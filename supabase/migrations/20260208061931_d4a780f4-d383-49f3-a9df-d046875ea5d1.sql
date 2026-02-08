-- Add timezone field to profiles for local date attribution
ALTER TABLE public.profiles 
ADD COLUMN timezone text DEFAULT NULL;

-- Add comment explaining purpose
COMMENT ON COLUMN public.profiles.timezone IS 'IANA timezone identifier (e.g. America/Chicago) auto-detected from weather widget geolocation';