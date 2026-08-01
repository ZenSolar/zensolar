CREATE OR REPLACE VIEW public.connection_health AS
WITH last_row AS (
  SELECT user_id, provider,
         max(created_at) AS last_row_at,
         max(created_at) FILTER (
           WHERE proof_metadata->>'production_wh_semantics' = 'issuable_delta'
             AND production_wh > 0
         ) AS last_issuable_at
  FROM public.energy_production
  GROUP BY 1,2
),
dev AS (
  SELECT user_id, provider, count(*) AS device_count
  FROM public.connected_devices GROUP BY 1,2
)
SELECT
  t.user_id,
  t.provider,
  t.updated_at                                   AS last_token_refresh_at,
  t.expires_at                                   AS access_token_expires_at,
  lr.last_row_at,
  lr.last_issuable_at,
  COALESCE(d.device_count, 0)                    AS device_count,
  GREATEST(t.updated_at, COALESCE(lr.last_row_at, t.updated_at)) AS last_success_at,
  round(EXTRACT(epoch FROM now() - GREATEST(t.updated_at, COALESCE(lr.last_row_at, t.updated_at))) / 86400.0, 2) AS days_since_success,
  COALESCE(t.extra_data->>'grant_failure_class', 'none') AS failure_class,
  t.extra_data->>'grant_failure_at'              AS failure_first_seen_at,
  t.extra_data->>'grant_failure_detail'          AS failure_detail,
  CASE
    WHEN now() - GREATEST(t.updated_at, COALESCE(lr.last_row_at, t.updated_at)) > interval '72 hours' THEN 'dead'
    WHEN now() - GREATEST(t.updated_at, COALESCE(lr.last_row_at, t.updated_at)) > interval '24 hours' THEN 'stale'
    ELSE 'healthy'
  END AS status
FROM public.energy_tokens t
LEFT JOIN last_row lr ON lr.user_id = t.user_id AND lr.provider = t.provider
LEFT JOIN dev d       ON d.user_id  = t.user_id AND d.provider  = t.provider;

REVOKE ALL ON public.connection_health FROM anon, authenticated;
GRANT SELECT ON public.connection_health TO service_role;

CREATE OR REPLACE FUNCTION public.get_connection_health()
RETURNS SETOF public.connection_health
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.connection_health
  WHERE public.is_admin(auth.uid())
  ORDER BY days_since_success DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_connection_health() TO authenticated;

COMMENT ON VIEW public.connection_health IS
  'Report-only staleness signal per (account, provider). healthy <24h, stale 24-72h, dead >72h since the last successful token refresh or ingested row. failure_class separates user_revoked (churn) from technically_invalid (our problem). No alerting is wired to this view by design.';