
-- O1: Device fingerprint uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS connected_devices_provider_device_id_uniq
  ON public.connected_devices(provider, device_id);

-- O2: Provider whitelist
ALTER TABLE public.connected_devices
  DROP CONSTRAINT IF EXISTS connected_devices_provider_whitelist;
ALTER TABLE public.connected_devices
  ADD CONSTRAINT connected_devices_provider_whitelist
  CHECK (provider IN ('tesla','enphase','solaredge','wallbox'));

ALTER TABLE public.energy_production
  DROP CONSTRAINT IF EXISTS energy_production_provider_whitelist;
ALTER TABLE public.energy_production
  ADD CONSTRAINT energy_production_provider_whitelist
  CHECK (provider IN ('tesla','tesla_home_charging','tesla_historical','enphase','solaredge','wallbox'));

-- O4: Device handoff audit + baseline reset
CREATE TABLE IF NOT EXISTS public.device_handoff_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  device_id text NOT NULL,
  previous_user_id uuid NOT NULL,
  new_user_id uuid NOT NULL,
  previous_lifetime_totals jsonb,
  handoff_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.device_handoff_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and editors view handoff log"
  ON public.device_handoff_log FOR SELECT
  USING (is_admin_or_editor(auth.uid()) OR has_role(auth.uid(), 'viewer'::app_role));

CREATE POLICY "Users view handoffs involving them"
  ON public.device_handoff_log FOR SELECT
  USING (auth.uid() = previous_user_id OR auth.uid() = new_user_id);

CREATE OR REPLACE FUNCTION public.handle_device_handoff()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    INSERT INTO public.device_handoff_log(
      provider, device_id, previous_user_id, new_user_id, previous_lifetime_totals
    ) VALUES (
      OLD.provider, OLD.device_id, OLD.user_id, NEW.user_id, OLD.lifetime_totals
    );
    NEW.lifetime_totals := '{}'::jsonb;
    NEW.baseline_data := '{}'::jsonb;
    NEW.last_minted_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS connected_devices_handoff_trigger ON public.connected_devices;
CREATE TRIGGER connected_devices_handoff_trigger
  BEFORE UPDATE ON public.connected_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_device_handoff();
