-- Add lifetime_totals column to connected_devices to store the latest lifetime data
-- This will be updated each time the user views their dashboard

ALTER TABLE public.connected_devices 
ADD COLUMN IF NOT EXISTS lifetime_totals jsonb DEFAULT '{}'::jsonb;

-- Add an index for faster queries
CREATE INDEX IF NOT EXISTS idx_connected_devices_lifetime ON connected_devices USING GIN (lifetime_totals);

COMMENT ON COLUMN public.connected_devices.lifetime_totals IS 'Latest lifetime energy totals fetched from provider API (solar_wh, battery_discharge_wh, odometer, charging_kwh, etc.)';