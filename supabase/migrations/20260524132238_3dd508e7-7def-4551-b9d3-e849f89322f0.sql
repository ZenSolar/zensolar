-- ============================================================
-- kpi_reconciliation_log: per-KPI production drift audit log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kpi_reconciliation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,                       -- NULL for global/protocol KPIs
  kpi_key text NOT NULL,              -- e.g. 'solar_kwh', 'supercharger_kwh', 'home_charger_kwh', 'lifetime_tokens', 'nft_count'
  scope text NOT NULL DEFAULT 'user', -- 'user' | 'global'
  severity text NOT NULL DEFAULT 'warn', -- 'warn' | 'critical' | 'info'
  headline_value numeric NOT NULL,    -- value as displayed / aggregated for the headline
  computed_value numeric NOT NULL,    -- value recomputed from source rows
  diff numeric NOT NULL,              -- headline - computed
  diff_pct numeric NOT NULL,          -- ((headline - computed) / max(|headline|,|computed|,0.5)) * 100
  tolerance_pct numeric NOT NULL DEFAULT 1.0,
  passed boolean NOT NULL DEFAULT false,
  source_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  detected_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kpi_recon_user_time
  ON public.kpi_reconciliation_log (user_id, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_kpi_recon_kpi_severity
  ON public.kpi_reconciliation_log (kpi_key, severity, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_kpi_recon_failures_only
  ON public.kpi_reconciliation_log (detected_at DESC)
  WHERE passed = false;

ALTER TABLE public.kpi_reconciliation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own kpi reconciliation"
  ON public.kpi_reconciliation_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Dashboard staff view all kpi reconciliation"
  ON public.kpi_reconciliation_log FOR SELECT
  USING (public.has_dashboard_access(auth.uid()));

CREATE POLICY "Service role inserts kpi reconciliation"
  ON public.kpi_reconciliation_log FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- verify_kpi_reconciliation()
-- For each user, recompute canonical KPIs from source rows and
-- log any drift > tolerance_pct into kpi_reconciliation_log.
-- Headline = current authoritative aggregate (per-source sum).
-- Computed = the same number rolled up via per-row sum, included
-- so future divergence between cached/headline and row-sum surfaces.
-- ============================================================
CREATE OR REPLACE FUNCTION public.verify_kpi_reconciliation()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inserted_count integer := 0;
  tolerance_warn numeric := 1.0;
  tolerance_crit numeric := 5.0;
  abs_floor numeric := 0.5;
BEGIN
  WITH per_user AS (
    SELECT
      u.user_id,
      -- Solar (kWh) — energy_production rows of type 'solar'
      COALESCE((
        SELECT SUM(production_wh) / 1000.0 FROM public.energy_production
        WHERE user_id = u.user_id AND data_type = 'solar'
      ), 0) AS solar_rows_kwh,
      COALESCE((
        SELECT SUM((lifetime_totals->>'solar_wh')::numeric) / 1000.0 FROM public.connected_devices
        WHERE user_id = u.user_id
          AND lifetime_totals ? 'solar_wh'
          AND (lifetime_totals->>'solar_wh') ~ '^-?[0-9]+(\.[0-9]+)?$'
      ), 0) AS solar_headline_kwh,
      -- Supercharger kWh
      COALESCE((
        SELECT SUM(energy_kwh) FROM public.charging_sessions
        WHERE user_id = u.user_id AND charging_type = 'supercharger'
      ), 0) AS supercharger_rows_kwh,
      -- Home charger kWh
      COALESCE((
        SELECT SUM(total_session_kwh) FROM public.home_charging_sessions
        WHERE user_id = u.user_id
      ), 0) AS home_rows_kwh,
      COALESCE((
        SELECT SUM((lifetime_totals->>'charging_kwh')::numeric) FROM public.connected_devices
        WHERE user_id = u.user_id
          AND lifetime_totals ? 'charging_kwh'
          AND (lifetime_totals->>'charging_kwh') ~ '^-?[0-9]+(\.[0-9]+)?$'
      ), 0) AS home_headline_kwh,
      -- Lifetime tokens minted (confirmed only)
      COALESCE((
        SELECT SUM(tokens_minted) FROM public.mint_transactions
        WHERE user_id = u.user_id AND status = 'confirmed'
      ), 0) AS tokens_confirmed,
      COALESCE((
        SELECT SUM(tokens_minted) FROM public.mint_transactions
        WHERE user_id = u.user_id AND status IN ('confirmed','flagged_drift')
      ), 0) AS tokens_headline
    FROM (
      SELECT DISTINCT user_id FROM public.connected_devices
      UNION
      SELECT DISTINCT user_id FROM public.mint_transactions
    ) u
    WHERE u.user_id IS NOT NULL
  ),
  drifts AS (
    -- Solar drift
    SELECT
      p.user_id,
      'solar_kwh'::text AS kpi_key,
      p.solar_headline_kwh AS headline_value,
      p.solar_rows_kwh    AS computed_value
    FROM per_user p
    UNION ALL
    -- Home-charger drift (device-lifetime vs session sum)
    SELECT
      p.user_id,
      'home_charger_kwh'::text,
      p.home_headline_kwh,
      p.home_rows_kwh
    FROM per_user p
    UNION ALL
    -- Lifetime tokens (flagged-inclusive headline vs confirmed-only canonical)
    SELECT
      p.user_id,
      'lifetime_tokens'::text,
      p.tokens_headline,
      p.tokens_confirmed
    FROM per_user p
  ),
  scored AS (
    SELECT
      user_id,
      kpi_key,
      headline_value,
      computed_value,
      (headline_value - computed_value) AS diff,
      ROUND(
        ((headline_value - computed_value) /
          NULLIF(GREATEST(ABS(headline_value), ABS(computed_value), abs_floor), 0)
        ) * 100, 4
      ) AS diff_pct
    FROM drifts
  ),
  to_insert AS (
    SELECT
      user_id, kpi_key, headline_value, computed_value, diff, diff_pct,
      CASE
        WHEN ABS(diff_pct) > tolerance_crit THEN 'critical'
        WHEN ABS(diff_pct) > tolerance_warn THEN 'warn'
        ELSE 'info'
      END AS severity,
      ABS(diff_pct) <= tolerance_warn AS passed
    FROM scored
  ),
  ins AS (
    INSERT INTO public.kpi_reconciliation_log
      (user_id, kpi_key, scope, severity, headline_value, computed_value,
       diff, diff_pct, tolerance_pct, passed, source_breakdown, details)
    SELECT
      t.user_id, t.kpi_key, 'user', t.severity, t.headline_value, t.computed_value,
      t.diff, t.diff_pct, tolerance_warn, t.passed,
      jsonb_build_object(
        'tolerance_warn_pct', tolerance_warn,
        'tolerance_critical_pct', tolerance_crit
      ),
      jsonb_build_object('run_at', now())
    FROM to_insert t
    WHERE t.passed = false
    RETURNING 1
  )
  SELECT COALESCE(COUNT(*), 0)::int INTO inserted_count FROM ins;

  RETURN inserted_count;
END $$;