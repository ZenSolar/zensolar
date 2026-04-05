
-- Helper: check if user has any dashboard access role
CREATE OR REPLACE FUNCTION public.has_dashboard_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'editor', 'viewer')
  )
$$;

-- Helper: check if user is viewer only (not admin or editor)
CREATE OR REPLACE FUNCTION public.is_viewer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'viewer'
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'editor')
  )
$$;

-- Viewer read-only policies on data tables
CREATE POLICY "Viewers can view all devices"
  ON public.connected_devices FOR SELECT
  USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view all energy production"
  ON public.energy_production FOR SELECT
  USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view all charging sessions"
  ON public.charging_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view all home charging sessions"
  ON public.home_charging_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view all mint transactions"
  ON public.mint_transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view all rewards"
  ON public.user_rewards FOR SELECT
  USING (public.has_role(auth.uid(), 'viewer'));

-- Viewers can see their own role
-- (already covered by "Users can view their own roles" policy)

-- Viewers can view announcements (already covered by existing policy)
-- Viewers can view feedback, support requests read-only
CREATE POLICY "Viewers can view all feedback"
  ON public.feedback FOR SELECT
  USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view all support requests"
  ON public.support_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'viewer'));

-- Viewers can view work journal and summaries
CREATE POLICY "Viewers can view journal entries"
  ON public.work_journal FOR SELECT
  USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view summaries"
  ON public.work_journal_summaries FOR SELECT
  USING (public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "Viewers can view snapshots"
  ON public.work_journal_snapshots_schema FOR SELECT
  USING (public.has_role(auth.uid(), 'viewer'));
