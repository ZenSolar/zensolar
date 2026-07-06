
-- Trigger function: null out client-supplied network metadata unless caller is service_role
CREATE OR REPLACE FUNCTION public.strip_client_network_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  jwt_role text;
BEGIN
  BEGIN
    jwt_role := current_setting('request.jwt.claim.role', true);
  EXCEPTION WHEN OTHERS THEN
    jwt_role := NULL;
  END;

  IF jwt_role IS DISTINCT FROM 'service_role' THEN
    NEW.ip_address := NULL;
    NEW.user_agent := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS strip_client_metadata_demo_access_log ON public.demo_access_log;
CREATE TRIGGER strip_client_metadata_demo_access_log
BEFORE INSERT ON public.demo_access_log
FOR EACH ROW EXECUTE FUNCTION public.strip_client_network_metadata();

DROP TRIGGER IF EXISTS strip_client_metadata_nda_signatures ON public.nda_signatures;
CREATE TRIGGER strip_client_metadata_nda_signatures
BEFORE INSERT ON public.nda_signatures
FOR EACH ROW EXECUTE FUNCTION public.strip_client_network_metadata();

-- Add public SELECT policy for yc_application_content (intended-public marketing content)
CREATE POLICY "Public can view yc content"
ON public.yc_application_content
FOR SELECT
TO anon, authenticated
USING (true);
