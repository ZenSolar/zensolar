
-- ============================================================
-- 1. founder_pins: add missing INSERT/UPDATE policies
--    (CRITICAL: any authed user could previously overwrite
--     another user's PIN)
-- ============================================================
CREATE POLICY "Users can insert own pin row"
  ON public.founder_pins
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pin row"
  ON public.founder_pins
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. suppressed_emails: let admins review the list
-- ============================================================
CREATE POLICY "Admins and editors can view suppressed emails"
  ON public.suppressed_emails
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

-- ============================================================
-- 3. Validation triggers for tables that accept anon inserts
--    (We can't use CHECK on a column referencing length/regex
--     against email because the columns may be null; use a
--     BEFORE INSERT trigger for clarity.)
-- ============================================================

-- demo_access_log: require ip_address present, cap user_agent length,
-- cap city/region/country length
CREATE OR REPLACE FUNCTION public.validate_demo_access_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_agent IS NOT NULL AND length(NEW.user_agent) > 500 THEN
    RAISE EXCEPTION 'user_agent too long';
  END IF;
  IF NEW.city       IS NOT NULL AND length(NEW.city)       > 120 THEN RAISE EXCEPTION 'city too long';    END IF;
  IF NEW.region     IS NOT NULL AND length(NEW.region)     > 120 THEN RAISE EXCEPTION 'region too long';  END IF;
  IF NEW.country    IS NOT NULL AND length(NEW.country)    > 120 THEN RAISE EXCEPTION 'country too long'; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_demo_access_log_trigger ON public.demo_access_log;
CREATE TRIGGER validate_demo_access_log_trigger
  BEFORE INSERT ON public.demo_access_log
  FOR EACH ROW EXECUTE FUNCTION public.validate_demo_access_log();

-- mint_access_requests: require non-empty name + valid email
CREATE OR REPLACE FUNCTION public.validate_mint_access_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.requester_name IS NULL OR length(btrim(NEW.requester_name)) < 1 THEN
    RAISE EXCEPTION 'requester_name required';
  END IF;
  IF length(NEW.requester_name) > 200 THEN
    RAISE EXCEPTION 'requester_name too long';
  END IF;
  IF NEW.requester_email IS NULL
     OR NEW.requester_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
     OR length(NEW.requester_email) > 254
  THEN
    RAISE EXCEPTION 'valid requester_email required';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_mint_access_request_trigger ON public.mint_access_requests;
CREATE TRIGGER validate_mint_access_request_trigger
  BEFORE INSERT ON public.mint_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_mint_access_request();

-- nda_signatures: require non-empty full_name + valid email
CREATE OR REPLACE FUNCTION public.validate_nda_signature()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.full_name IS NULL OR length(btrim(NEW.full_name)) < 2 THEN
    RAISE EXCEPTION 'full_name required';
  END IF;
  IF length(NEW.full_name) > 200 THEN
    RAISE EXCEPTION 'full_name too long';
  END IF;
  IF NEW.email IS NULL
     OR NEW.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
     OR length(NEW.email) > 254
  THEN
    RAISE EXCEPTION 'valid email required';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_nda_signature_trigger ON public.nda_signatures;
CREATE TRIGGER validate_nda_signature_trigger
  BEFORE INSERT ON public.nda_signatures
  FOR EACH ROW EXECUTE FUNCTION public.validate_nda_signature();

-- ============================================================
-- 4. Pin search_path on the one remaining function missing it
-- ============================================================
ALTER FUNCTION public.mint_transactions_protect_chain() SET search_path = public;
