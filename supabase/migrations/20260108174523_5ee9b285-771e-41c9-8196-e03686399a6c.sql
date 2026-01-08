-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage all tokens" ON public.energy_tokens;

-- Users can only manage their own tokens (edge functions use service role key which bypasses RLS)
CREATE POLICY "Users can insert their own tokens"
ON public.energy_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
ON public.energy_tokens
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
ON public.energy_tokens
FOR DELETE
USING (auth.uid() = user_id);