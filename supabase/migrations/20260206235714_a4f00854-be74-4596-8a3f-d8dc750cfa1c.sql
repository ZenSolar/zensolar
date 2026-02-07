-- Add home address to profiles for location-based charging classification
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_address text;

-- Add charging_type to charging_sessions for home vs supercharger classification
ALTER TABLE public.charging_sessions ADD COLUMN IF NOT EXISTS charging_type text NOT NULL DEFAULT 'supercharger';

-- Add index for efficient filtering by charging type
CREATE INDEX IF NOT EXISTS idx_charging_sessions_type ON public.charging_sessions (user_id, charging_type, session_date);