
-- 1) founder_pins: lock down direct reads, expose secure RPCs
DROP POLICY IF EXISTS "Users can view own pin row" ON public.founder_pins;
REVOKE SELECT ON public.founder_pins FROM authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.founder_pins TO service_role;

CREATE OR REPLACE FUNCTION public.founder_pin_status()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'has_pin', EXISTS(SELECT 1 FROM public.founder_pins WHERE user_id = auth.uid()),
    'locked_until', (SELECT locked_until FROM public.founder_pins WHERE user_id = auth.uid()),
    'failed_attempts', COALESCE((SELECT failed_attempts FROM public.founder_pins WHERE user_id = auth.uid()), 0)
  );
$$;

CREATE OR REPLACE FUNCTION public.set_founder_pin(_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  uid uuid := auth.uid();
  new_salt text;
  new_hash text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _pin IS NULL OR length(_pin) < 4 OR length(_pin) > 32 THEN
    RAISE EXCEPTION 'invalid pin length';
  END IF;
  new_salt := encode(extensions.gen_random_bytes(16), 'hex');
  new_hash := encode(extensions.digest(new_salt || _pin, 'sha256'), 'hex');

  INSERT INTO public.founder_pins (user_id, pin_hash, salt, failed_attempts, locked_until)
  VALUES (uid, new_hash, new_salt, 0, NULL)
  ON CONFLICT (user_id) DO UPDATE
    SET pin_hash = EXCLUDED.pin_hash,
        salt = EXCLUDED.salt,
        failed_attempts = 0,
        locked_until = NULL,
        updated_at = now();
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_founder_pin(_pin text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  uid uuid := auth.uid();
  rec public.founder_pins%ROWTYPE;
  computed text;
  ok boolean;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  SELECT * INTO rec FROM public.founder_pins WHERE user_id = uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('verified', false, 'reason', 'no_pin');
  END IF;
  IF rec.locked_until IS NOT NULL AND rec.locked_until > now() THEN
    RETURN jsonb_build_object('verified', false, 'reason', 'locked', 'locked_until', rec.locked_until);
  END IF;

  computed := encode(extensions.digest(rec.salt || _pin, 'sha256'), 'hex');
  ok := computed = rec.pin_hash;

  IF ok THEN
    UPDATE public.founder_pins
       SET failed_attempts = 0, locked_until = NULL, updated_at = now()
     WHERE user_id = uid;
    RETURN jsonb_build_object('verified', true);
  ELSE
    UPDATE public.founder_pins
       SET failed_attempts = failed_attempts + 1,
           locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN now() + interval '15 minutes' ELSE locked_until END,
           updated_at = now()
     WHERE user_id = uid;
    RETURN jsonb_build_object('verified', false, 'reason', 'mismatch');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_founder_pin(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_founder_pin(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.founder_pin_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_founder_pin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_founder_pin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.founder_pin_status() TO authenticated;

-- 2) energy_documents: restrict staff SELECT to admin/editor only
DROP POLICY IF EXISTS "Staff view all energy docs" ON public.energy_documents;
CREATE POLICY "Admins and editors view all energy docs"
  ON public.energy_documents
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

-- 3) founder-docs bucket: explicit owner + founder-role policies
CREATE POLICY "Founders read founder-docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'founder-docs'
    AND (
      public.has_role(auth.uid(), 'founder')
      OR public.is_admin(auth.uid())
      OR (auth.uid())::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Founders upload founder-docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'founder-docs'
    AND (
      public.has_role(auth.uid(), 'founder')
      OR public.is_admin(auth.uid())
    )
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Founders update own founder-docs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'founder-docs'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Founders delete own founder-docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'founder-docs'
    AND (
      public.is_admin(auth.uid())
      OR (auth.uid())::text = (storage.foldername(name))[1]
    )
  );
