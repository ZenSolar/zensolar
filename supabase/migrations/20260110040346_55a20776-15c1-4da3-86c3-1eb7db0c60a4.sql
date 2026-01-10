-- Fix all remaining RLS policy issues

-- 1. Add SELECT policy for energy_tokens (users need to view their own tokens for disconnect functionality)
CREATE POLICY "Users can view their own tokens"
ON public.energy_tokens
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Add DELETE policy for connected_devices (users should be able to remove their own devices)
CREATE POLICY "Users can delete their own devices"
ON public.connected_devices
FOR DELETE
USING (auth.uid() = user_id);

-- 3. Add UPDATE and DELETE policies for energy_production (users should manage their own data)
CREATE POLICY "Users can update their own production"
ON public.energy_production
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own production"
ON public.energy_production
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Add UPDATE policy for notification_logs (users should be able to mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notification_logs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Add DELETE policy for user_rewards (GDPR compliance - right to erasure)
CREATE POLICY "Users can delete their own rewards"
ON public.user_rewards
FOR DELETE
USING (auth.uid() = user_id);

-- 6. Add DELETE policy for profiles (GDPR compliance - right to erasure)
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);