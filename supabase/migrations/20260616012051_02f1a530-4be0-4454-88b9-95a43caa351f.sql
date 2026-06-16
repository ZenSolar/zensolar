ALTER TABLE public.connected_devices
  ADD COLUMN IF NOT EXISTS last_known_state JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS connected_devices_last_known_state_fsd_idx
  ON public.connected_devices ((last_known_state->>'fsd_source'))
  WHERE last_known_state ? 'fsd_source';