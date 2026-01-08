-- Create connected_devices table for tracking unique device ownership
CREATE TABLE public.connected_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL, -- 'tesla', 'enphase', 'solaredge'
  device_id TEXT NOT NULL, -- unique ID from provider (VIN, system_id, etc.)
  device_type TEXT NOT NULL, -- 'vehicle', 'powerwall', 'solar_system', etc.
  device_name TEXT, -- user-friendly name from API
  device_metadata JSONB, -- store additional info (model, location, etc.)
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure each device can only be claimed once across all users
  CONSTRAINT unique_device_per_provider UNIQUE (provider, device_id)
);

-- Enable RLS
ALTER TABLE public.connected_devices ENABLE ROW LEVEL SECURITY;

-- Users can view their own devices
CREATE POLICY "Users can view their own devices"
ON public.connected_devices
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert devices (will fail if device already exists due to unique constraint)
CREATE POLICY "Users can claim unclaimed devices"
ON public.connected_devices
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only admins can delete devices (release for reclaiming)
CREATE POLICY "Admins can release devices"
ON public.connected_devices
FOR DELETE
USING (is_admin(auth.uid()));

-- Admins can view all devices (for support)
CREATE POLICY "Admins can view all devices"
ON public.connected_devices
FOR SELECT
USING (is_admin(auth.uid()));

-- Create function to check if device is already claimed by another user
CREATE OR REPLACE FUNCTION public.is_device_claimed(
  _provider TEXT,
  _device_id TEXT,
  _current_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_build_object(
        'is_claimed', true,
        'claimed_by_current_user', user_id = _current_user_id
      )
      FROM connected_devices
      WHERE provider = _provider AND device_id = _device_id
      LIMIT 1
    ),
    jsonb_build_object('is_claimed', false, 'claimed_by_current_user', false)
  )
$$;

-- Trigger for updated_at
CREATE TRIGGER update_connected_devices_updated_at
BEFORE UPDATE ON public.connected_devices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();