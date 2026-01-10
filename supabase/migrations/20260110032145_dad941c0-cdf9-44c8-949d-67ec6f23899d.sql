-- Fix the overly permissive INSERT policy on notification_logs
-- Only allow inserts from service role (edge functions), not from anonymous users
DROP POLICY "Service role can insert notifications" ON public.notification_logs;

-- Create a more restrictive policy - notifications can only be inserted by authenticated users for themselves
-- Edge functions using service role key will bypass RLS anyway
CREATE POLICY "Users can receive notifications" 
ON public.notification_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);