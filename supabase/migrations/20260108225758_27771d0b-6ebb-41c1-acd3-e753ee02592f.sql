-- Add baseline_data column to store initial lifetime values when device is claimed
-- This allows us to calculate "pending" activity = current - baseline
ALTER TABLE public.connected_devices 
ADD COLUMN baseline_data jsonb DEFAULT '{}'::jsonb;

-- Add last_minted_at to track when tokens were last minted for this device
ALTER TABLE public.connected_devices 
ADD COLUMN last_minted_at timestamp with time zone DEFAULT NULL;

COMMENT ON COLUMN public.connected_devices.baseline_data IS 'Stores lifetime values at claim time (odometer, total_energy_discharged, etc). Pending activity = current - baseline.';
COMMENT ON COLUMN public.connected_devices.last_minted_at IS 'When tokens were last minted for this device. Baseline is updated at mint time.';