CREATE TABLE public.grid_outage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'tesla',
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  duration_seconds integer GENERATED ALWAYS AS (
    CASE WHEN ended_at IS NULL THEN NULL
         ELSE GREATEST(0, EXTRACT(EPOCH FROM (ended_at - started_at))::int)
    END
  ) STORED,
  estimated_backup_hours_at_start numeric,
  soc_pct_start numeric,
  soc_pct_end numeric,
  device_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.grid_outage_events TO authenticated;
GRANT ALL ON public.grid_outage_events TO service_role;

ALTER TABLE public.grid_outage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own outages: select"
ON public.grid_outage_events FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "own outages: insert"
ON public.grid_outage_events FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "own outages: update"
ON public.grid_outage_events FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX grid_outage_events_user_started_idx
  ON public.grid_outage_events (user_id, started_at DESC);

CREATE TRIGGER grid_outage_events_set_updated_at
  BEFORE UPDATE ON public.grid_outage_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();