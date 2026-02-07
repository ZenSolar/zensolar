
-- Create home_charging_sessions table for tracking AC charging sessions
CREATE TABLE public.home_charging_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  start_kwh_added NUMERIC NOT NULL DEFAULT 0,
  end_kwh_added NUMERIC NOT NULL DEFAULT 0,
  total_session_kwh NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'charging',
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  charger_power_kw NUMERIC DEFAULT 0,
  session_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.home_charging_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own home charging sessions"
  ON public.home_charging_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own home charging sessions"
  ON public.home_charging_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own home charging sessions"
  ON public.home_charging_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own home charging sessions"
  ON public.home_charging_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Index for quick active session lookup
CREATE INDEX idx_home_charging_active ON public.home_charging_sessions (user_id, device_id, status)
  WHERE status = 'charging';

-- Index for date-range queries in Energy Log
CREATE INDEX idx_home_charging_dates ON public.home_charging_sessions (user_id, start_time);

-- Trigger for updated_at
CREATE TRIGGER update_home_charging_sessions_updated_at
  BEFORE UPDATE ON public.home_charging_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
