-- Per-user Deason inner-circle access (admin-managed toggle)
CREATE TABLE IF NOT EXISTS public.deason_inner_circle (
  user_id uuid PRIMARY KEY,
  granted_by uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  note text
);

ALTER TABLE public.deason_inner_circle ENABLE ROW LEVEL SECURITY;

-- Admins can fully manage
CREATE POLICY "Admins manage deason inner circle"
  ON public.deason_inner_circle
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Users can see whether they themselves are in the list (optional, harmless)
CREATE POLICY "Users can view their own inner-circle row"
  ON public.deason_inner_circle
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Helper used by edge function (service role bypasses RLS, but keep symmetric)
CREATE OR REPLACE FUNCTION public.is_deason_inner_circle(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.deason_inner_circle WHERE user_id = _user_id);
$$;