-- KPI tap analytics: record single/double-tap events and whether a mint was confirmed within the double-tap window.
CREATE TABLE IF NOT EXISTS public.kpi_tap_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('single_tap', 'double_tap', 'mint_in_window', 'mint_outside_window')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  session_id text,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_kpi_tap_events_user_id ON public.kpi_tap_events(user_id);
CREATE INDEX IF NOT EXISTS idx_kpi_tap_events_occurred_at ON public.kpi_tap_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_tap_events_user_event ON public.kpi_tap_events(user_id, event_type);

ALTER TABLE public.kpi_tap_events ENABLE ROW LEVEL SECURITY;

-- Users can record their own tap events.
CREATE POLICY "Users insert their own tap events"
ON public.kpi_tap_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can read their own tap events (handy for client-side debug).
CREATE POLICY "Users read their own tap events"
ON public.kpi_tap_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins / editors / viewers can read all rows for the admin users page.
CREATE POLICY "Admins and editors read all tap events"
ON public.kpi_tap_events
FOR SELECT
TO authenticated
USING (public.is_admin_or_editor(auth.uid()) OR public.has_role(auth.uid(), 'viewer'::public.app_role));