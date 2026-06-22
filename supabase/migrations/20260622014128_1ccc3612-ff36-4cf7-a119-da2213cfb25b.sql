-- Remove the admin SELECT policy: RLS cannot restrict columns, so this was
-- exposing secret_hash to any admin via the Data API.
DROP POLICY IF EXISTS "Admins can read non-secret columns of origin proof keys" ON public.origin_proof_keys;

-- Defense in depth: revoke any column-level SELECT for authenticated, then
-- re-grant SELECT only on non-secret columns. service_role retains full access
-- via its bypass of RLS and table-level grants.
REVOKE SELECT ON public.origin_proof_keys FROM authenticated;
REVOKE SELECT ON public.origin_proof_keys FROM anon;

-- Ensure the metadata view (secret_hash excluded) is readable by admins/authenticated users.
GRANT SELECT ON public.origin_proof_keys_metadata TO authenticated;
GRANT ALL ON public.origin_proof_keys_metadata TO service_role;
