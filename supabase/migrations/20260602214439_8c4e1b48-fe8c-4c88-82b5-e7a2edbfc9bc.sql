CREATE POLICY "Admins and editors can view all telemetry cache"
ON public.device_telemetry_cache
FOR SELECT
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Viewers can view all telemetry cache"
ON public.device_telemetry_cache
FOR SELECT
USING (has_role(auth.uid(), 'viewer'::app_role));