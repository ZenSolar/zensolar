-- Allow users to read their own energy tokens (needed for incomplete setup detection)
CREATE POLICY "Users can view their own tokens" 
ON public.energy_tokens 
FOR SELECT 
USING (auth.uid() = user_id);