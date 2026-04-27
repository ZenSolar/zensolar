
-- 1. Enum for genesis status
CREATE TYPE public.genesis_status AS ENUM (
  'pending_genesis',
  'genesis_consumed',
  'unverifiable_source',
  'broken'
);

-- 2. Add genesis tracking to home_charging_sessions
ALTER TABLE public.home_charging_sessions
  ADD COLUMN genesis_status public.genesis_status NOT NULL DEFAULT 'unverifiable_source',
  ADD COLUMN genesis_reason text,
  ADD COLUMN origin_proof jsonb DEFAULT '{}'::jsonb;

-- 3. Add genesis tracking to energy_production (solar, etc.)
ALTER TABLE public.energy_production
  ADD COLUMN genesis_status public.genesis_status NOT NULL DEFAULT 'pending_genesis',
  ADD COLUMN genesis_reason text,
  ADD COLUMN origin_proof jsonb DEFAULT '{}'::jsonb;

-- 4. Add genesis tracking to charging_sessions (Supercharger)
ALTER TABLE public.charging_sessions
  ADD COLUMN genesis_status public.genesis_status NOT NULL DEFAULT 'pending_genesis',
  ADD COLUMN genesis_reason text,
  ADD COLUMN origin_proof jsonb DEFAULT '{}'::jsonb;

-- 5. Add genesis tracking to bidirectional_mint_events
ALTER TABLE public.bidirectional_mint_events
  ADD COLUMN genesis_status public.genesis_status NOT NULL DEFAULT 'pending_genesis',
  ADD COLUMN genesis_reason text,
  ADD COLUMN origin_proof jsonb DEFAULT '{}'::jsonb;

-- 6. Backfill: ALL existing home_charging_sessions are vehicle-telemetry sourced
UPDATE public.home_charging_sessions
SET genesis_status = 'unverifiable_source',
    genesis_reason = 'vehicle_telemetry_not_charger_attested',
    origin_proof = jsonb_build_object(
      'source', 'tesla_vehicle_onboard_telemetry',
      'attested_by', 'load_side_battery_meter',
      'pog_failure_modes', jsonb_build_array(
        'no_charger_side_signature',
        'no_origin_proof_of_household_panel',
        'load_side_kwh_includes_thermal_and_bms_losses'
      )
    );

-- 7. Backfill: Mark broken-chain rows where end < start
UPDATE public.home_charging_sessions
SET genesis_status = 'broken',
    genesis_reason = 'end_kwh_less_than_start'
WHERE end_kwh_added < start_kwh_added;

-- 8. protocol_settings (single-row config)
CREATE TABLE public.protocol_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  beta_overrides_enabled boolean NOT NULL DEFAULT true,
  mainnet_launched_at timestamp with time zone,
  notes text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

INSERT INTO public.protocol_settings (id, beta_overrides_enabled, notes)
VALUES (1, true, 'Beta phase: founder override active until mainnet LP funding event.');

ALTER TABLE public.protocol_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read protocol settings"
ON public.protocol_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can update protocol settings"
ON public.protocol_settings FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 9. energy_manual_adjustments (admin-only beta corrections, fully audited)
CREATE TABLE public.energy_manual_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  source_table text NOT NULL CHECK (source_table IN (
    'home_charging_sessions',
    'energy_production',
    'charging_sessions',
    'bidirectional_mint_events',
    'connected_devices'
  )),
  source_row_id uuid,
  kwh_adjustment numeric NOT NULL,
  reason text NOT NULL,
  beta_only boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.energy_manual_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert manual adjustments"
ON public.energy_manual_adjustments FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin(auth.uid())
  AND admin_user_id = auth.uid()
);

CREATE POLICY "Admins editors viewers can read manual adjustments"
ON public.energy_manual_adjustments FOR SELECT
TO authenticated
USING (
  public.is_admin_or_editor(auth.uid())
  OR public.has_role(auth.uid(), 'viewer'::app_role)
);

-- Block writes when beta overrides are off (kill-switch enforcement)
CREATE OR REPLACE FUNCTION public.enforce_beta_override_kill_switch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  beta_enabled boolean;
BEGIN
  SELECT beta_overrides_enabled INTO beta_enabled
  FROM public.protocol_settings WHERE id = 1;
  IF NOT COALESCE(beta_enabled, false) THEN
    RAISE EXCEPTION 'Manual energy adjustments are disabled (mainnet launched, beta overrides off).';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_beta_override_kill_switch
BEFORE INSERT ON public.energy_manual_adjustments
FOR EACH ROW EXECUTE FUNCTION public.enforce_beta_override_kill_switch();

-- 10. founder_dashboard_prefs (per-user toggle)
CREATE TABLE public.founder_dashboard_prefs (
  user_id uuid PRIMARY KEY,
  show_unverifiable_in_kpi boolean NOT NULL DEFAULT false,
  show_manual_adjustments_in_kpi boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.founder_dashboard_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own dashboard prefs"
ON public.founder_dashboard_prefs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own dashboard prefs"
ON public.founder_dashboard_prefs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own dashboard prefs"
ON public.founder_dashboard_prefs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 11. Helper function: mintable kWh resolver per user/source
CREATE OR REPLACE FUNCTION public.get_mintable_status_filter(_user_id uuid)
RETURNS public.genesis_status[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  beta_on boolean;
  show_unverif boolean;
  is_admin_user boolean;
BEGIN
  SELECT beta_overrides_enabled INTO beta_on FROM public.protocol_settings WHERE id = 1;
  SELECT public.is_admin(_user_id) INTO is_admin_user;
  SELECT COALESCE(show_unverifiable_in_kpi, false) INTO show_unverif
    FROM public.founder_dashboard_prefs WHERE user_id = _user_id;

  IF is_admin_user AND COALESCE(beta_on, false) AND COALESCE(show_unverif, false) THEN
    RETURN ARRAY['pending_genesis', 'unverifiable_source']::public.genesis_status[];
  END IF;

  RETURN ARRAY['pending_genesis']::public.genesis_status[];
END;
$$;

-- 12. Indexes for fast genesis_status filtering
CREATE INDEX idx_home_charging_genesis_status ON public.home_charging_sessions(user_id, genesis_status);
CREATE INDEX idx_energy_production_genesis_status ON public.energy_production(user_id, genesis_status);
CREATE INDEX idx_charging_sessions_genesis_status ON public.charging_sessions(user_id, genesis_status);
CREATE INDEX idx_bidir_genesis_status ON public.bidirectional_mint_events(user_id, genesis_status);
CREATE INDEX idx_manual_adj_target_user ON public.energy_manual_adjustments(target_user_id, source_table);
