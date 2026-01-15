-- Drop the overly permissive policy and create a more specific one
DROP POLICY IF EXISTS "Service can insert mint transactions" ON public.mint_transactions;

-- Only allow inserts where user_id matches the authenticated user
-- Edge functions using service role bypass RLS anyway, so this is for client-side safety
CREATE POLICY "Users can insert their own mint transactions" 
ON public.mint_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);