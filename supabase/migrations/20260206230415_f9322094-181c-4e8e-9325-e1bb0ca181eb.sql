-- Add data_type column to distinguish solar, battery, ev_charging, ev_miles data
ALTER TABLE public.energy_production 
ADD COLUMN data_type text NOT NULL DEFAULT 'solar';

-- Drop old unique constraint
ALTER TABLE public.energy_production DROP CONSTRAINT unique_production_entry;

-- Create new unique constraint including data_type
ALTER TABLE public.energy_production 
ADD CONSTRAINT unique_production_entry UNIQUE (device_id, provider, recorded_at, data_type);

-- Add index for efficient filtering by data_type
CREATE INDEX idx_energy_production_data_type 
ON public.energy_production USING btree (user_id, data_type, recorded_at DESC);