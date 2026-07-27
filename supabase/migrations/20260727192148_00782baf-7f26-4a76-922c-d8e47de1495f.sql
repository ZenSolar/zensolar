GRANT SELECT, INSERT, UPDATE, DELETE ON public.tesla_oauth_states TO service_role;

DROP POLICY IF EXISTS "Tesla OAuth states are backend only" ON public.tesla_oauth_states;
CREATE POLICY "Tesla OAuth states are backend only"
ON public.tesla_oauth_states
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);