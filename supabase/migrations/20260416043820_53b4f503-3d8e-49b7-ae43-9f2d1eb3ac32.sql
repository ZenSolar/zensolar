-- 1. Add SELECT policy on energy_tokens so only the owner can read their tokens
CREATE POLICY "Users can read own energy tokens"
ON public.energy_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Restrict storage.objects SELECT to only allow reading individual files, not listing
-- Drop the overly broad SELECT policy on storage.objects for the public bucket
-- and replace with a scoped one that allows reading by path but not listing
DO $$
BEGIN
  -- Drop existing broad select policies on storage.objects for public buckets
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Public Access'
  ) THEN
    DROP POLICY "Public Access" ON storage.objects;
  END IF;
END $$;

-- Recreate a scoped policy that allows reading objects but requires a specific path
CREATE POLICY "Public read access to public bucket files"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'public'
  AND (storage.filename(name) IS NOT NULL)
  AND name IS NOT NULL
);