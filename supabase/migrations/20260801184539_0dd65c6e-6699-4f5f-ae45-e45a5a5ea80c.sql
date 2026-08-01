DROP FUNCTION IF EXISTS public.get_connection_health();
DROP VIEW IF EXISTS public.connection_health;

CREATE VIEW public.connection_health AS
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
),
base AS (
  SELECT
    t.user_id,
    t.provider,
    t.updated_at AS last_token_refresh_at,
    t.expires_at AS access_token_expires_at,
    lr.last_row_at,
    lr.last_issuable_at,
    COALESCE(d.device_count, 0) AS device_count,
    COALESCE(t.extra_data->>'grant_failure_class', 'none') AS failure_class,
    t.extra_data->>'grant_failure_at' AS failure_first_seen_at,
    t.extra_data->>'grant_failure_detail' AS failure_detail
  FROM public.energy_tokens t
  LEFT JOIN last_row lr ON lr.user_id = t.user_id AND lr.provider = t.provider
  LEFT JOIN dev d       ON d.user_id  = t.user_id AND d.provider  = t.provider
)
SELECT
  b.*,
  round(EXTRACT(epoch FROM now() - b.last_token_refresh_at) / 86400.0, 2) AS days_since_grant_ok,
  round(EXTRACT(epoch FROM now() - b.last_row_at) / 86400.0, 2)           AS days_since_ingest,
  CASE
    WHEN now() - b.last_token_refresh_at > interval '72 hours' THEN 'dead'
    WHEN now() - b.last_token_refresh_at > interval '24 hours' THEN 'stale'
    ELSE 'healthy'
  END AS grant_status,
  CASE
    WHEN b.device_count = 0 THEN 'no_devices'
    WHEN b.last_row_at IS NULL THEN 'never'
    WHEN now() - b.last_row_at > interval '72 hours' THEN 'silent'
    WHEN now() - b.last_row_at > interval '24 hours' THEN 'stale'
    ELSE 'healthy'
  END AS ingest_status,
  CASE
    WHEN now() - b.last_token_refresh_at > interval '72 hours' THEN 'dead_grant'
    WHEN b.device_count > 0 AND (b.last_row_at IS NULL OR now() - b.last_row_at > interval '72 hours') THEN 'silent_ingest'
    WHEN now() - b.last_token_refresh_at > interval '24 hours'
      OR (b.device_count > 0 AND now() - b.last_row_at > interval '24 hours') THEN 'stale'
    ELSE 'healthy'
  END AS status
FROM base b;

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
  ORDER BY days_since_grant_ok DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_connection_health() TO authenticated;

COMMENT ON VIEW public.connection_health IS
  'Report-only staleness signal per (account, provider). Two independent axes: grant_status (can we still refresh the token) and ingest_status (are rows actually arriving). A grant that refreshes cleanly while no rows land is silent_ingest, not healthy — that distinction is what a token-only check missed. failure_class separates user_revoked (churn) from technically_invalid (our defect). Nothing alerts off this view by design.';