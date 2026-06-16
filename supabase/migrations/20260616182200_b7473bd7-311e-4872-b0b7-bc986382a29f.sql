
CREATE POLICY "Users can upload their own starlink screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'starlink-attestations'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read their own starlink screenshots"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'starlink-attestations'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
