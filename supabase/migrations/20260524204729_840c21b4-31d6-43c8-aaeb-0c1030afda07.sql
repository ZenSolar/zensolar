-- Add home charging setup fields to connected_devices (Tesla vehicles primarily).
-- These power the new onboarding flow that asks the user how they charge at home,
-- where home is, and what their living situation is. Geofence filter uses
-- home_location to decide whether a Tesla vehicle-telemetry AC session counts
-- as home charging.

ALTER TABLE public.connected_devices
  ADD COLUMN IF NOT EXISTS home_charging_source text
    CHECK (home_charging_source IN (
      'tesla_wall_connector',
      'wallbox',
      'vehicle_telemetry',
      'none'
    )),
  ADD COLUMN IF NOT EXISTS home_charger_brand text,
  ADD COLUMN IF NOT EXISTS home_setup_type text
    CHECK (home_setup_type IN (
      'house',
      'apartment_private',
      'apartment_shared',
      'other'
    )),
  ADD COLUMN IF NOT EXISTS home_location jsonb;

-- home_location shape:
-- {
--   "lat": number,
--   "lon": number,
--   "radius_m": number (default 200),
--   "source": "tesla_saved" | "user_entered",
--   "address": string (optional, display only)
-- }

COMMENT ON COLUMN public.connected_devices.home_charging_source IS
  'How home charging is measured for this vehicle: tesla_wall_connector / wallbox (smart charger API), vehicle_telemetry (read from car), or none (user does not charge at home).';
COMMENT ON COLUMN public.connected_devices.home_charger_brand IS
  'Display label for the home charger (e.g. "ChargePoint Home Flex", "Tesla Wall Connector", "Apartment Shared L2").';
COMMENT ON COLUMN public.connected_devices.home_setup_type IS
  'Residential context: house, apartment_private (own charger), apartment_shared (public L2 at building), or other.';
COMMENT ON COLUMN public.connected_devices.home_location IS
  'Home geofence center { lat, lon, radius_m, source, address? }. Used to gate Tesla vehicle-telemetry AC sessions into home_charging_sessions.';