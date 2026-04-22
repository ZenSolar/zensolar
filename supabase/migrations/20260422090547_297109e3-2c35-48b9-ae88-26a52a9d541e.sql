CREATE POLICY "Admins and editors can view send log"
ON public.email_send_log
FOR SELECT
TO public
USING (public.is_admin_or_editor(auth.uid()));