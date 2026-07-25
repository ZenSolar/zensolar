
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS beta_invite_token text,
  ADD COLUMN IF NOT EXISTS beta_flow_step text,
  ADD COLUMN IF NOT EXISTS beta_home_selections jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS beta_status jsonb DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.beta_invites (
  token text PRIMARY KEY,
  label text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_by uuid,
  consumed_at timestamptz
);

GRANT SELECT ON public.beta_invites TO anon, authenticated;
GRANT ALL ON public.beta_invites TO service_role;

ALTER TABLE public.beta_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read invite by token" ON public.beta_invites;
CREATE POLICY "Anyone can read invite by token" ON public.beta_invites
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can consume own invite" ON public.beta_invites;
CREATE POLICY "Authenticated can consume own invite" ON public.beta_invites
  FOR UPDATE TO authenticated
  USING (consumed_by IS NULL OR consumed_by = auth.uid())
  WITH CHECK (consumed_by = auth.uid());
