alter table public.posts add column if not exists ai_stars integer;
alter table public.posts add column if not exists ai_note text;
alter table public.posts add column if not exists ai_flagged boolean not null default false;
create index if not exists posts_ai_flagged_idx on public.posts (ai_flagged);