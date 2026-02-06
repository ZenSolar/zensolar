
-- Table to store individual EV charging sessions for detail view
CREATE TABLE public.charging_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  provider text NOT NULL, -- 'tesla', 'wallbox'
  device_id text NOT NULL,
  session_date date NOT NULL,
  energy_kwh numeric NOT NULL DEFAULT 0,
  location text,
  fee_amount numeric,
  fee_currency text,
  session_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.charging_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own charging sessions"
  ON public.charging_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own charging sessions"
  ON public.charging_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own charging sessions"
  ON public.charging_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Unique constraint to prevent duplicate sessions
CREATE UNIQUE INDEX unique_charging_session 
  ON public.charging_sessions (user_id, provider, device_id, session_date, energy_kwh, COALESCE(location, ''));

-- Index for querying by user and date range
CREATE INDEX idx_charging_sessions_user_date 
  ON public.charging_sessions (user_id, session_date DESC);
