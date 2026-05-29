-- 1. Tier enum + column on energy_subscriptions (scaffold only; $7.99 Pro deferred)
DO $$ BEGIN
  CREATE TYPE public.energy_subscription_tier AS ENUM ('standard', 'pro');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.energy_subscriptions
  ADD COLUMN IF NOT EXISTS tier public.energy_subscription_tier NOT NULL DEFAULT 'standard';

-- 2. Telemetry cache table
CREATE TABLE IF NOT EXISTS public.device_telemetry_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  oem_type TEXT NOT NULL,           -- 'tesla' | 'enphase' | 'solaredge' | 'wallbox'
  device_type TEXT NOT NULL,        -- 'battery' | 'ev_charger' | 'solar'
  site_id TEXT NOT NULL,            -- OEM-specific site/device id
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, oem_type, device_type, site_id)
);

CREATE INDEX IF NOT EXISTS idx_dtc_user_device
  ON public.device_telemetry_cache (user_id, device_type);
CREATE INDEX IF NOT EXISTS idx_dtc_expires_at
  ON public.device_telemetry_cache (expires_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_telemetry_cache TO authenticated;
GRANT ALL ON public.device_telemetry_cache TO service_role;

ALTER TABLE public.device_telemetry_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own telemetry cache"
  ON public.device_telemetry_cache
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own telemetry cache"
  ON public.device_telemetry_cache
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own telemetry cache"
  ON public.device_telemetry_cache
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own telemetry cache"
  ON public.device_telemetry_cache
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages telemetry cache"
  ON public.device_telemetry_cache
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_dtc_updated_at
  BEFORE UPDATE ON public.device_telemetry_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();