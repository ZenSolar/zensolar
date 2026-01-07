-- Add admin policy for viewing all profiles
-- First, add an is_admin column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create a policy that allows admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE is_admin = true
  )
);