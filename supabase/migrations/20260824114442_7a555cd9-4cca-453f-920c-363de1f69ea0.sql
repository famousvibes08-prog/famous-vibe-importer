-- ROLES
create type public.app_role as enum ('admin','moderator','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles are viewable" on public.profiles for select using (true);
create policy "insert own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(replace(new.id::text,'-',''), 1, 10)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- FOLLOWS
create table public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);
grant select, insert, delete on public.follows to authenticated;
grant select on public.follows to anon;
grant all on public.follows to service_role;
alter table public.follows enable row level security;
create policy "follows viewable" on public.follows for select using (true);
create policy "manage own follows" on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy "delete own follows" on public.follows for delete to authenticated using (follower_id = auth.uid());

-- POSTS
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_url text not null,
  media_type text not null check (media_type in ('image','video')),
  caption text,
  is_vibe boolean not null default false,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  report_count integer not null default 0,
  hidden boolean not null default false,
  avg_rating numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.posts to authenticated;
grant select on public.posts to anon;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "visible posts" on public.posts for select
  using (hidden = false or user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "insert own posts" on public.posts for insert to authenticated with check (user_id = auth.uid());
create policy "update own posts" on public.posts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own posts" on public.posts for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create index posts_created_idx on public.posts (created_at desc);
create index posts_vibe_idx on public.posts (is_vibe, created_at desc);

-- LIKES
create table public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
grant select, insert, delete on public.likes to authenticated;
grant all on public.likes to service_role;
alter table public.likes enable row level security;
create policy "likes viewable" on public.likes for select to authenticated using (true);
create policy "insert own like" on public.likes for insert to authenticated with check (user_id = auth.uid());
create policy "delete own like" on public.likes for delete to authenticated using (user_id = auth.uid());

create or replace function public.sync_like_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
  else
    update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end; $$;
create trigger likes_count_trg after insert or delete on public.likes
for each row execute function public.sync_like_count();

-- COMMENTS
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.comments to authenticated;
grant all on public.comments to service_role;
alter table public.comments enable row level security;
create policy "comments viewable" on public.comments for select to authenticated using (true);
create policy "insert own comment" on public.comments for insert to authenticated with check (user_id = auth.uid());
create policy "delete own comment" on public.comments for delete to authenticated using (user_id = auth.uid());

create or replace function public.sync_comment_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  else
    update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end; $$;
create trigger comments_count_trg after insert or delete on public.comments
for each row execute function public.sync_comment_count();

-- SAVES
create table public.saves (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
grant select, insert, delete on public.saves to authenticated;
grant all on public.saves to service_role;
alter table public.saves enable row level security;
create policy "own saves" on public.saves for select to authenticated using (user_id = auth.uid());
create policy "insert own save" on public.saves for insert to authenticated with check (user_id = auth.uid());
create policy "delete own save" on public.saves for delete to authenticated using (user_id = auth.uid());

-- RATINGS
create table public.ratings (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
grant select, insert, update, delete on public.ratings to authenticated;
grant all on public.ratings to service_role;
alter table public.ratings enable row level security;
create policy "ratings viewable" on public.ratings for select to authenticated using (true);
create policy "insert own rating" on public.ratings for insert to authenticated with check (user_id = auth.uid());
create policy "update own rating" on public.ratings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own rating" on public.ratings for delete to authenticated using (user_id = auth.uid());

create or replace function public.sync_post_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  pid := coalesce(new.post_id, old.post_id);
  update public.posts p set
    avg_rating = coalesce((select round(avg(stars)::numeric, 2) from public.ratings where post_id = pid), 0),
    rating_count = (select count(*) from public.ratings where post_id = pid)
  where p.id = pid;
  return null;
end; $$;
create trigger ratings_sync_trg after insert or update or delete on public.ratings
for each row execute function public.sync_post_rating();

-- REPORTS
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);
grant select, insert on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "own reports" on public.reports for select to authenticated using (user_id = auth.uid());
create policy "insert own report" on public.reports for insert to authenticated with check (user_id = auth.uid());

create or replace function public.sync_report_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare c integer;
begin
  select count(*) into c from public.reports where post_id = new.post_id;
  update public.posts set report_count = c, hidden = (c >= 3) where id = new.post_id;
  return null;
end; $$;
create trigger reports_sync_trg after insert on public.reports
for each row execute function public.sync_report_count();

-- INTERESTS
create table public.interests (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  state text not null check (state in ('interested','not_interested')),
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
grant select, insert, update, delete on public.interests to authenticated;
grant all on public.interests to service_role;
alter table public.interests enable row level security;
create policy "own interests" on public.interests for select to authenticated using (user_id = auth.uid());
create policy "insert own interest" on public.interests for insert to authenticated with check (user_id = auth.uid());
create policy "update own interest" on public.interests for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own interest" on public.interests for delete to authenticated using (user_id = auth.uid());