-- Add Wallbox connected flag to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wallbox_connected boolean DEFAULT false;