-- Remove the unique constraint on user_id to allow multiple versions
DROP INDEX IF EXISTS idx_tokenomics_framework_user_unique;

-- Add version_name column for user-friendly version identification
ALTER TABLE public.tokenomics_framework_responses 
ADD COLUMN IF NOT EXISTS version_name text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Create index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_tokenomics_framework_user_version 
ON public.tokenomics_framework_responses(user_id, created_at DESC);

-- Add comment explaining the versioning system
COMMENT ON TABLE public.tokenomics_framework_responses IS 'Stores tokenomics framework responses with version history. Users can save multiple versions and compare them.';