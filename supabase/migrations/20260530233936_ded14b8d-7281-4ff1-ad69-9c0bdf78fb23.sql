ALTER TABLE public.deason_messages
  ADD COLUMN IF NOT EXISTS energy_report JSONB;