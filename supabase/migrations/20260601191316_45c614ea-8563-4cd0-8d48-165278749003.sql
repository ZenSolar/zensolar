-- =====================================================================
-- 1. PII tables: restrict editor SELECT down to admin-only
-- =====================================================================

-- demo_access_log
DROP POLICY IF EXISTS "Admins and editors can view demo access log" ON public.demo_access_log;
DROP POLICY IF EXISTS "Admins and editors can update demo access log" ON public.demo_access_log;
CREATE POLICY "Admins can view demo access log"
  ON public.demo_access_log FOR SELECT
  USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update demo access log"
  ON public.demo_access_log FOR UPDATE
  USING (is_admin(auth.uid()));

-- email_link_clicks
DROP POLICY IF EXISTS "Admins and editors can view link clicks" ON public.email_link_clicks;
CREATE POLICY "Admins can view link clicks"
  ON public.email_link_clicks FOR SELECT
  USING (is_admin(auth.uid()));

-- email_opens
DROP POLICY IF EXISTS "Admins and editors can view opens" ON public.email_opens;
CREATE POLICY "Admins can view opens"
  ON public.email_opens FOR SELECT
  USING (is_admin(auth.uid()));

-- email_send_log
DROP POLICY IF EXISTS "Admins and editors can view send log" ON public.email_send_log;
CREATE POLICY "Admins can view send log"
  ON public.email_send_log FOR SELECT
  USING (is_admin(auth.uid()));

-- mint_access_requests
DROP POLICY IF EXISTS "Admins and editors can view mint access requests" ON public.mint_access_requests;
DROP POLICY IF EXISTS "Admins and editors can update mint access requests" ON public.mint_access_requests;
CREATE POLICY "Admins can view mint access requests"
  ON public.mint_access_requests FOR SELECT
  USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update mint access requests"
  ON public.mint_access_requests FOR UPDATE
  USING (is_admin(auth.uid()));

-- nda_signatures
DROP POLICY IF EXISTS "Admins and editors can view all NDA signatures" ON public.nda_signatures;
CREATE POLICY "Admins can view all NDA signatures"
  ON public.nda_signatures FOR SELECT
  USING (is_admin(auth.uid()));

-- suppressed_emails
DROP POLICY IF EXISTS "Admins and editors can view suppressed emails" ON public.suppressed_emails;
DROP POLICY IF EXISTS "Admins and editors can insert suppressed emails" ON public.suppressed_emails;
DROP POLICY IF EXISTS "Admins and editors can delete suppressed emails" ON public.suppressed_emails;
CREATE POLICY "Admins can view suppressed emails"
  ON public.suppressed_emails FOR SELECT
  USING (is_admin(auth.uid()));
CREATE POLICY "Admins can insert suppressed emails"
  ON public.suppressed_emails FOR INSERT
  WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can delete suppressed emails"
  ON public.suppressed_emails FOR DELETE
  USING (is_admin(auth.uid()));

-- vip_code_notifications
DROP POLICY IF EXISTS "Admins and editors can view vip notifications" ON public.vip_code_notifications;
CREATE POLICY "Admins can view vip notifications"
  ON public.vip_code_notifications FOR SELECT
  USING (is_admin(auth.uid()));

-- beta_signups
DROP POLICY IF EXISTS "Admins and editors can view beta signups" ON public.beta_signups;
CREATE POLICY "Admins can view beta signups"
  ON public.beta_signups FOR SELECT
  USING (is_admin(auth.uid()));

-- =====================================================================
-- 2. profiles: tighten editor SELECT to admin-only for full-table reads
-- =====================================================================

DROP POLICY IF EXISTS "Admins and editors can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_admin(auth.uid()));

-- =====================================================================
-- 3. energy_tokens: drop user-facing policies; service role only.
--     Edge functions already use SUPABASE_SERVICE_ROLE_KEY which
--     bypasses RLS, so this does not affect the app.
-- =====================================================================

DROP POLICY IF EXISTS "Users can read own energy tokens" ON public.energy_tokens;
DROP POLICY IF EXISTS "Users can insert their own tokens" ON public.energy_tokens;
DROP POLICY IF EXISTS "Users can update their own tokens" ON public.energy_tokens;
DROP POLICY IF EXISTS "Users can delete their own tokens" ON public.energy_tokens;

-- Explicit service-role policy (also implicit via service role key, but
-- documenting intent in pg_policies for future scanners).
CREATE POLICY "Service role manages energy tokens"
  ON public.energy_tokens FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================================
-- 4. collusion_signals: remove user-facing SELECT (admins/staff retain)
-- =====================================================================

DROP POLICY IF EXISTS "Users view signals involving them" ON public.collusion_signals;

-- =====================================================================
-- 5. user_invariant_violations: remove user-facing SELECT
-- =====================================================================

DROP POLICY IF EXISTS "Users view own violations" ON public.user_invariant_violations;

-- =====================================================================
-- 6. energy-docs storage bucket: add owner-scoped UPDATE policy
-- =====================================================================

DROP POLICY IF EXISTS "Users update own energy docs" ON storage.objects;
CREATE POLICY "Users update own energy docs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'energy-docs'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'energy-docs'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
