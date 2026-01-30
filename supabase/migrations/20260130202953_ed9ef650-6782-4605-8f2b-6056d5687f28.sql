-- Add hidden_activity_fields column to profiles table for storing user's hidden dashboard fields
ALTER TABLE public.profiles 
ADD COLUMN hidden_activity_fields text[] DEFAULT '{}'::text[];