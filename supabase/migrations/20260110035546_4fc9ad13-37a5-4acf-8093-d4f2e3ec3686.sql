-- Remove SELECT policy from energy_tokens table
-- Users should never be able to read their tokens from client code
-- Edge functions use service_role_key which bypasses RLS anyway
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.energy_tokens;