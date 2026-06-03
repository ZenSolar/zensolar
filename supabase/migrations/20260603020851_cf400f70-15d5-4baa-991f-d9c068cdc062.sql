ALTER TABLE public.grid_outage_events
  ADD COLUMN peak_load_kw numeric,
  ADD COLUMN deason_interacted boolean NOT NULL DEFAULT false;