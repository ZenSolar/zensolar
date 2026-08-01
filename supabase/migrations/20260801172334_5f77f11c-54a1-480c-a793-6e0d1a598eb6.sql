-- 1. PROVENANCE COVERAGE — "how much of the history is hash-chained" as a query, not a one-off.
CREATE OR REPLACE FUNCTION public.get_provenance_coverage(_user_id uuid DEFAULT NULL)
RETURNS TABLE(
  scope text,
  total_rows bigint,
  hash_chained_rows bigint,
  imported_history_rows bigint,
  unclassified_unhashed_rows bigint,
  hash_chained_pct numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE WHEN _user_id IS NULL THEN 'protocol' ELSE 'user' END AS scope,
    count(*) AS total_rows,
    count(*) FILTER (WHERE proof_metadata->>'hash' IS NOT NULL) AS hash_chained_rows,
    count(*) FILTER (WHERE proof_metadata->>'provenance_class' = 'pre_pillar1_backfill') AS imported_history_rows,
    count(*) FILTER (
      WHERE proof_metadata->>'hash' IS NULL
        AND coalesce(proof_metadata->>'provenance_class','') <> 'pre_pillar1_backfill'
    ) AS unclassified_unhashed_rows,
    CASE WHEN count(*) = 0 THEN 0
         ELSE round(100.0 * count(*) FILTER (WHERE proof_metadata->>'hash' IS NOT NULL) / count(*), 2)
    END AS hash_chained_pct
  FROM public.energy_production
  WHERE _user_id IS NULL OR user_id = _user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_provenance_coverage(uuid) TO authenticated, service_role;

-- 2. FUNCTION INVOCATIONS — append-only invocation ledger, 400-day retention.
CREATE TABLE IF NOT EXISTS public.function_invocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  invoked_at timestamptz NOT NULL DEFAULT now(),
  invoked_by text,
  target_user_id uuid,
  mode text,
  outcome text NOT NULL DEFAULT 'started',
  rows_written integer NOT NULL DEFAULT 0,
  duration_ms integer,
  error_message text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '400 days')
);

CREATE INDEX IF NOT EXISTS idx_function_invocations_fn_time
  ON public.function_invocations (function_name, invoked_at DESC);
CREATE INDEX IF NOT EXISTS idx_function_invocations_user
  ON public.function_invocations (target_user_id, invoked_at DESC);
CREATE INDEX IF NOT EXISTS idx_function_invocations_expiry
  ON public.function_invocations (expires_at);

GRANT SELECT ON public.function_invocations TO authenticated;
GRANT ALL ON public.function_invocations TO service_role;

ALTER TABLE public.function_invocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read function invocations" ON public.function_invocations;
CREATE POLICY "Admins read function invocations"
  ON public.function_invocations FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Service role writes function invocations" ON public.function_invocations;
CREATE POLICY "Service role writes function invocations"
  ON public.function_invocations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Append-only: no updates or deletes from application roles (service_role
-- policy above is the only write path, and the purge below is definer-owned).
CREATE OR REPLACE FUNCTION public.purge_expired_function_invocations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  DELETE FROM public.function_invocations WHERE expires_at < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

-- 3. DUPLICATE-REGISTRATION SIGNAL — report only, never auto-demotion.
-- Two same-provider solar sources on one account whose daily production ratio
-- sits near 1.0 with low variance are the duplicate-registration signature.
-- Two genuinely disjoint arrays diverge (differing capacity, orientation).
-- Measurement SCOPE decides authority; this never demotes anything.
CREATE OR REPLACE FUNCTION public.get_solar_duplicate_registration_signals(
  _days integer DEFAULT 30
)
RETURNS TABLE(
  user_id uuid,
  provider text,
  device_a text,
  device_b text,
  paired_days integer,
  mean_ratio numeric,
  stddev_ratio numeric,
  signal text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH daily AS (
    SELECT ep.user_id, ep.provider, ep.device_id,
           date_trunc('day', ep.recorded_at) AS d,
           sum(ep.production_wh) AS wh
    FROM public.energy_production ep
    WHERE ep.data_type = 'solar'
      AND ep.recorded_at > now() - (_days || ' days')::interval
    GROUP BY 1,2,3,4
    HAVING sum(ep.production_wh) > 0
  ),
  pairs AS (
    SELECT a.user_id, a.provider,
           a.device_id AS device_a, b.device_id AS device_b,
           count(*)::int AS paired_days,
           avg(a.wh / b.wh) AS mean_ratio,
           coalesce(stddev_samp(a.wh / b.wh), 0) AS stddev_ratio
    FROM daily a
    JOIN daily b
      ON a.user_id = b.user_id
     AND a.provider = b.provider
     AND a.d = b.d
     AND a.device_id < b.device_id
    GROUP BY 1,2,3,4
    HAVING count(*) >= 5
  )
  SELECT user_id, provider, device_a, device_b, paired_days,
         round(mean_ratio, 3) AS mean_ratio,
         round(stddev_ratio, 3) AS stddev_ratio,
         CASE
           WHEN mean_ratio BETWEEN 0.95 AND 1.05 AND stddev_ratio < 0.05
             THEN 'possible_duplicate_registration'
           ELSE 'disjoint_arrays'
         END AS signal
  FROM pairs
  ORDER BY abs(mean_ratio - 1.0) ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_solar_duplicate_registration_signals(integer) TO authenticated, service_role;