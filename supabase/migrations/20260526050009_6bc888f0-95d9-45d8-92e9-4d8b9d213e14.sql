
-- Flip bucket to private
UPDATE storage.buckets SET public = false WHERE id = 'cheetah-exports';

-- Drop the public SELECT policy
DROP POLICY IF EXISTS "Public read cheetah exports" ON storage.objects;

-- Owner can read their own files (path layout: <user_id>/<filename>.pdf)
CREATE POLICY "Owners can read their cheetah exports"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'cheetah-exports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Service role (edge functions) can read any file in this bucket
CREATE POLICY "Service role can read cheetah exports"
  ON storage.objects
  FOR SELECT
  TO service_role
  USING (bucket_id = 'cheetah-exports');
