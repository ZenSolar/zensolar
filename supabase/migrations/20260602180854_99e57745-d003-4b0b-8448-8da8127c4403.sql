-- Add primary data-source preferences to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS solar_inverter_brand text
    CHECK (solar_inverter_brand IN ('enphase','solaredge','tesla','other')),
  ADD COLUMN IF NOT EXISTS primary_charging_source text
    CHECK (primary_charging_source IN ('tesla_vehicle','home_charger','none'));

-- Backfill Joseph's reference account so the SSOT rule is deterministic
UPDATE public.profiles
  SET solar_installer = COALESCE(solar_installer, 'other'),
      solar_inverter_brand = COALESCE(solar_inverter_brand, 'enphase'),
      primary_charging_source = COALESCE(primary_charging_source, 'tesla_vehicle')
  WHERE user_id = '331c79de-0c05-433c-a57e-9cdfcf2dc44d';

-- OEM diagnostic log (Deason discrepancy support)
CREATE TABLE IF NOT EXISTS public.oem_diagnostic_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  diagnostic_key text NOT NULL,
  severity text NOT NULL DEFAULT 'warn' CHECK (severity IN ('info','warn','error')),
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.oem_diagnostic_log TO authenticated;
GRANT ALL ON public.oem_diagnostic_log TO service_role;

ALTER TABLE public.oem_diagnostic_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own oem diagnostics"
  ON public.oem_diagnostic_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own oem diagnostics"
  ON public.oem_diagnostic_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users resolve own oem diagnostics"
  ON public.oem_diagnostic_log FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff view all oem diagnostics"
  ON public.oem_diagnostic_log FOR SELECT TO authenticated
  USING (is_admin_or_editor(auth.uid()) OR has_role(auth.uid(), 'viewer'::app_role));

CREATE POLICY "Service role manages oem diagnostics"
  ON public.oem_diagnostic_log FOR ALL TO public
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_oem_diagnostic_log_user_open
  ON public.oem_diagnostic_log (user_id, provider) WHERE resolved_at IS NULL;