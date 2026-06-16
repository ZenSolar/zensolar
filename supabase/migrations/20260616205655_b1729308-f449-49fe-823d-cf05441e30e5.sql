
-- Restrict origin_proof_keys.secret_hash exposure: admins no longer get raw row reads.
-- Edge functions continue to access via service_role (bypasses RLS).
DROP POLICY IF EXISTS "Admins can view origin proof keys" ON public.origin_proof_keys;
DROP POLICY IF EXISTS "Admins can manage origin proof keys" ON public.origin_proof_keys;

-- Admin-managed metadata view (no secret_hash) for UI/audit purposes.
CREATE OR REPLACE VIEW public.origin_proof_keys_metadata
WITH (security_invoker = true) AS
SELECT id, provider, key_id, algorithm, description, created_at, revoked_at
FROM public.origin_proof_keys;

-- Allow admins to read metadata-only via the view; underlying table stays locked to service_role.
GRANT SELECT ON public.origin_proof_keys_metadata TO authenticated;

-- Re-add a metadata-only policy on the base table so the security_invoker view works for admins,
-- but exclude secret_hash by only allowing SELECT through the view (column-level grant).
REVOKE SELECT ON public.origin_proof_keys FROM authenticated;
GRANT SELECT (id, provider, key_id, algorithm, description, created_at, revoked_at)
  ON public.origin_proof_keys TO authenticated;

CREATE POLICY "Admins can read non-secret columns of origin proof keys"
  ON public.origin_proof_keys FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Mutations (rotate/revoke) remain admin-only and go through the base table.
CREATE POLICY "Admins can insert origin proof keys"
  ON public.origin_proof_keys FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update origin proof keys"
  ON public.origin_proof_keys FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete origin proof keys"
  ON public.origin_proof_keys FOR DELETE
  USING (public.is_admin(auth.uid()));
