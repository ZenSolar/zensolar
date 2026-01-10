-- Remove SELECT policy from energy_tokens - tokens should never be readable from client
-- Edge functions use service_role which bypasses RLS
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.energy_tokens;