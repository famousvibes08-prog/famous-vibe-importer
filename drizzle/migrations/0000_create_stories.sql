CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
GRANT SELECT ON public.stories TO anon, authenticated;
GRANT INSERT, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active stories are viewable" ON public.stories FOR SELECT TO anon, authenticated USING (expires_at > now());
CREATE POLICY "users create own stories" ON public.stories FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND expires_at > now() AND expires_at <= now() + interval '24 hours 5 minutes');
CREATE POLICY "users delete own stories" ON public.stories FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX stories_active_created_idx ON public.stories (expires_at, created_at DESC);
CREATE INDEX stories_user_created_idx ON public.stories (user_id, created_at DESC);