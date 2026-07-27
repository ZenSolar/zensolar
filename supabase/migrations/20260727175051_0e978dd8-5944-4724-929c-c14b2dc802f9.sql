
-- 1. Add paused_for_testing flag
ALTER TABLE public.connected_devices
  ADD COLUMN IF NOT EXISTS paused_for_testing boolean NOT NULL DEFAULT false;

-- 2. Snapshot table for admin release-for-testing
CREATE TABLE IF NOT EXISTS public.admin_device_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  provider text NOT NULL,
  device_id text NOT NULL,
  device_type text,
  device_name text,
  device_metadata jsonb,
  baseline_data jsonb,
  lifetime_totals jsonb,
  last_known_state jsonb,
  home_charging_source text,
  home_charger_brand text,
  home_setup_type text,
  home_location jsonb,
  released_at timestamptz NOT NULL DEFAULT now(),
  restored_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_device_snapshots_active_idx
  ON public.admin_device_snapshots (provider, device_id)
  WHERE restored_at IS NULL;

CREATE INDEX IF NOT EXISTS admin_device_snapshots_admin_idx
  ON public.admin_device_snapshots (admin_user_id, released_at DESC);

GRANT SELECT ON public.admin_device_snapshots TO authenticated;
GRANT ALL ON public.admin_device_snapshots TO service_role;

ALTER TABLE public.admin_device_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view snapshots"
  ON public.admin_device_snapshots FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role manages snapshots"
  ON public.admin_device_snapshots FOR ALL TO service_role
  USING (true) WITH CHECK (true);
