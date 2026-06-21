CREATE TABLE public.ux_first_seen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ux_first_seen TO authenticated;
GRANT ALL ON public.ux_first_seen TO service_role;
ALTER TABLE public.ux_first_seen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ux_first_seen" ON public.ux_first_seen FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_ux_first_seen_user_event ON public.ux_first_seen (user_id, event_key);