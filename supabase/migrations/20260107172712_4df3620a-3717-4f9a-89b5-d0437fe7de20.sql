-- Add social media connection fields for sharing achievements
ALTER TABLE public.profiles
ADD COLUMN facebook_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN facebook_handle TEXT,
ADD COLUMN instagram_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN instagram_handle TEXT,
ADD COLUMN tiktok_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN tiktok_handle TEXT,
ADD COLUMN twitter_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN twitter_handle TEXT,
ADD COLUMN linkedin_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN linkedin_handle TEXT;