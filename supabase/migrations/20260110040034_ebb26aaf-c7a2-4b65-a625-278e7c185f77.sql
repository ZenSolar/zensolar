-- Add UPDATE policy for connected_devices table
-- Allows users to update their own device information (device_name, device_metadata)
CREATE POLICY "Users can update their own devices"
ON public.connected_devices
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);