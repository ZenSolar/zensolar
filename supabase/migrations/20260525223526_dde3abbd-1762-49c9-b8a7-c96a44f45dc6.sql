
CREATE OR REPLACE FUNCTION public.verify_kpi_vs_mint_window_7d()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer := 0;
  tol_warn numeric := 1.0;
  tol_crit numeric := 5.0;
  abs_floor numeric := 0.5;
  window_start timestamptz := now() - interval '7 days';
BEGIN
  WITH agg AS (
    SELECT
      mrl.user_id,
      mrl.category,
      SUM(mrl.headline_amount) AS headline_sum,
      SUM(mrl.on_chain_amount) AS onchain_sum,
      COUNT(*) AS mint_count,
      SUM(CASE WHEN NOT mrl.passed THEN 1 ELSE 0 END) AS failed_mints,
      MAX(mrl.diff_pct) AS max_diff_pct
    FROM public.mint_reconciliation_log mrl
    WHERE mrl.created_at >= window_start
    GROUP BY mrl.user_id, mrl.category
  ),
  scored AS (
    SELECT
      user_id, category, headline_sum, onchain_sum, mint_count, failed_mints, max_diff_pct,
      (headline_sum - onchain_sum) AS diff,
      ROUND(
        ((headline_sum - onchain_sum) /
         NULLIF(GREATEST(ABS(headline_sum), ABS(onchain_sum), abs_floor), 0)
        ) * 100, 4
      ) AS diff_pct
    FROM agg
  ),
  ins AS (
    INSERT INTO public.kpi_reconciliation_log
      (user_id, kpi_key, scope, severity, headline_value, computed_value,
       diff, diff_pct, tolerance_pct, passed, source_breakdown, details)
    SELECT
      s.user_id,
      'recon7d_' || s.category || '_vs_mint',
      'user_window_7d',
      CASE
        WHEN ABS(s.diff_pct) > tol_crit OR s.failed_mints > 0 THEN 'critical'
        WHEN ABS(s.diff_pct) > tol_warn THEN 'warn'
        ELSE 'info'
      END,
      s.headline_sum, s.onchain_sum, s.diff, s.diff_pct, tol_warn,
      ABS(s.diff_pct) <= tol_warn AND s.failed_mints = 0,
      jsonb_build_object(
        'category', s.category,
        'mint_count', s.mint_count,
        'failed_mints', s.failed_mints,
        'max_per_mint_diff_pct', s.max_diff_pct,
        'window_days', 7,
        'tolerance_warn_pct', tol_warn,
        'tolerance_critical_pct', tol_crit
      ),
      jsonb_build_object('run_at', now(), 'window_start', window_start)
    FROM scored s
    WHERE ABS(s.diff_pct) > tol_warn OR s.failed_mints > 0
    RETURNING 1
  )
  SELECT COALESCE(COUNT(*), 0)::int INTO inserted_count FROM ins;

  RETURN inserted_count;
END $$;

GRANT EXECUTE ON FUNCTION public.verify_kpi_vs_mint_window_7d() TO authenticated, service_role;
