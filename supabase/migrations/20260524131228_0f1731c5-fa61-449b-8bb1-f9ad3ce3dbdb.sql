
-- Pillar 1 · Math — nightly invariant check.

CREATE TABLE IF NOT EXISTS public.user_invariant_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  check_name text NOT NULL,
  severity text NOT NULL DEFAULT 'warn',  -- 'warn' | 'critical'
  expected numeric,
  actual numeric,
  diff_pct numeric,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  detected_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_invariant_violations_user_idx
  ON public.user_invariant_violations (user_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS user_invariant_violations_check_idx
  ON public.user_invariant_violations (check_name, detected_at DESC);

ALTER TABLE public.user_invariant_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role inserts violations"
  ON public.user_invariant_violations FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users view own violations"
  ON public.user_invariant_violations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins editors viewers view all violations"
  ON public.user_invariant_violations FOR SELECT
  USING (is_admin_or_editor(auth.uid()) OR has_role(auth.uid(), 'viewer'::app_role));

-- ===== verify_user_sum_invariant =====
-- Scans every user. Logs:
--   M1: any device where baseline_data > lifetime_totals on a tracked field
--       (would yield negative pending — minted from nothing).
--   M2: any confirmed mint whose stored reconciliation_diff exceeded 1%.
-- Returns number of violations recorded.
CREATE OR REPLACE FUNCTION public.verify_user_sum_invariant()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer := 0;
  numeric_keys text[] := ARRAY[
    'solar_wh','lifetime_solar_wh','solar_production_wh','total_solar_produced_wh',
    'odometer','last_known_odometer',
    'charging_kwh','lifetime_charging_kwh',
    'battery_discharge_wh','battery_charge_wh'
  ];
BEGIN
  -- M1: negative-pending per device per tracked key
  WITH dev AS (
    SELECT
      cd.user_id,
      cd.device_id,
      cd.provider,
      cd.device_type,
      k AS key,
      (cd.baseline_data ->> k)::numeric AS base_val,
      (cd.lifetime_totals ->> k)::numeric AS life_val
    FROM public.connected_devices cd
    CROSS JOIN unnest(numeric_keys) AS k
    WHERE cd.baseline_data ? k
      AND cd.lifetime_totals ? k
      AND (cd.baseline_data ->> k) ~ '^-?[0-9]+(\.[0-9]+)?$'
      AND (cd.lifetime_totals ->> k) ~ '^-?[0-9]+(\.[0-9]+)?$'
  ),
  ins AS (
    INSERT INTO public.user_invariant_violations
      (user_id, check_name, severity, expected, actual, diff_pct, details)
    SELECT
      d.user_id,
      'baseline_exceeds_lifetime',
      'critical',
      d.life_val,
      d.base_val,
      CASE WHEN d.life_val = 0 THEN 100
           ELSE ROUND(((d.base_val - d.life_val) / NULLIF(ABS(d.life_val), 0)) * 100, 4)
      END,
      jsonb_build_object(
        'device_id', d.device_id,
        'provider', d.provider,
        'device_type', d.device_type,
        'field', d.key,
        'baseline', d.base_val,
        'lifetime', d.life_val
      )
    FROM dev d
    WHERE d.base_val > d.life_val
    RETURNING 1
  )
  SELECT inserted_count + COALESCE(COUNT(*), 0)::int INTO inserted_count FROM ins;

  -- M2: confirmed mints whose recorded drift was over tolerance
  WITH ins2 AS (
    INSERT INTO public.user_invariant_violations
      (user_id, check_name, severity, expected, actual, diff_pct, details)
    SELECT
      mt.user_id,
      'mint_reconciliation_drift',
      CASE WHEN COALESCE(mt.reconciliation_diff, 0) > 5 THEN 'critical' ELSE 'warn' END,
      1.0,                                    -- expected tolerance pct
      mt.reconciliation_diff,
      mt.reconciliation_diff,
      jsonb_build_object(
        'tx_hash', mt.tx_hash,
        'action', mt.action,
        'tokens_minted', mt.tokens_minted,
        'kwh_delta', mt.kwh_delta,
        'miles_delta', mt.miles_delta,
        'status', mt.status,
        'created_at', mt.created_at
      )
    FROM public.mint_transactions mt
    WHERE mt.status IN ('confirmed','flagged_drift')
      AND COALESCE(mt.reconciliation_diff, 0) > 1
      AND NOT EXISTS (
        SELECT 1 FROM public.user_invariant_violations v
        WHERE v.check_name = 'mint_reconciliation_drift'
          AND v.details->>'tx_hash' = mt.tx_hash
      )
    RETURNING 1
  )
  SELECT inserted_count + COALESCE(COUNT(*), 0)::int INTO inserted_count FROM ins2;

  RETURN inserted_count;
END $$;
