-- 1. location_kind enum + column on home_charging_sessions
DO $$ BEGIN
  CREATE TYPE public.charging_location_kind AS ENUM (
    'home_primary',
    'home_secondary',
    'away_known',
    'away_unverified'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.home_charging_sessions
  ADD COLUMN IF NOT EXISTS location_kind public.charging_location_kind;

CREATE INDEX IF NOT EXISTS idx_home_charging_location_kind
  ON public.home_charging_sessions (user_id, location_kind);

-- 2. user_home_locations table
CREATE TABLE IF NOT EXISTS public.user_home_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  lat numeric NOT NULL,
  lon numeric NOT NULL,
  radius_m integer NOT NULL DEFAULT 150,
  is_primary boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_home_locations TO authenticated;
GRANT ALL ON public.user_home_locations TO service_role;

ALTER TABLE public.user_home_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own home locations"
  ON public.user_home_locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own home locations"
  ON public.user_home_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own home locations"
  ON public.user_home_locations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own home locations"
  ON public.user_home_locations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Viewers can view all home locations"
  ON public.user_home_locations FOR SELECT
  USING (public.has_role(auth.uid(), 'viewer'::app_role));

-- One primary home per user (only enforced when active)
CREATE UNIQUE INDEX IF NOT EXISTS user_home_locations_one_primary_uidx
  ON public.user_home_locations (user_id)
  WHERE is_primary = true AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_home_locations_user_active
  ON public.user_home_locations (user_id, is_active);

CREATE TRIGGER user_home_locations_set_updated_at
  BEFORE UPDATE ON public.user_home_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();