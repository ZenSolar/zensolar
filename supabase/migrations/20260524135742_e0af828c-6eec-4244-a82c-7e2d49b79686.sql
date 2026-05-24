
-- collusion_signals table
CREATE TABLE IF NOT EXISTS public.collusion_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_key text NOT NULL,           -- 'shared_wallet' | 'rapid_handoff' | 'shared_fingerprint'
  severity text NOT NULL DEFAULT 'warn', -- 'warn' | 'critical' | 'info'
  user_ids uuid[] NOT NULL,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  fingerprint text NOT NULL,          -- dedupe key
  detected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (signal_key, fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_collusion_signals_detected_at
  ON public.collusion_signals (detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_collusion_signals_user_ids
  ON public.collusion_signals USING GIN (user_ids);

ALTER TABLE public.collusion_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dashboard staff view all collusion signals"
  ON public.collusion_signals FOR SELECT
  USING (public.has_dashboard_access(auth.uid()));

CREATE POLICY "Users view signals involving them"
  ON public.collusion_signals FOR SELECT
  USING (auth.uid() = ANY(user_ids));

CREATE POLICY "Service role inserts collusion signals"
  ON public.collusion_signals FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Detector function
CREATE OR REPLACE FUNCTION public.detect_collusion_signals()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer := 0;
BEGIN
  -- 1) Shared wallet across multiple user_ids in mint_transactions.
  WITH groups AS (
    SELECT lower(wallet_address) AS wallet,
           array_agg(DISTINCT user_id ORDER BY user_id) AS users,
           COUNT(DISTINCT user_id) AS n,
           COUNT(*) AS n_tx,
           SUM(COALESCE(tokens_minted,0)) AS tokens
    FROM public.mint_transactions
    WHERE wallet_address IS NOT NULL
      AND wallet_address <> ''
    GROUP BY lower(wallet_address)
    HAVING COUNT(DISTINCT user_id) > 1
  ),
  ins AS (
    INSERT INTO public.collusion_signals (signal_key, severity, user_ids, evidence, fingerprint)
    SELECT
      'shared_wallet',
      CASE WHEN g.n >= 3 OR g.tokens > 1000 THEN 'critical' ELSE 'warn' END,
      g.users,
      jsonb_build_object(
        'wallet', g.wallet,
        'user_count', g.n,
        'tx_count', g.n_tx,
        'tokens_minted_total', g.tokens
      ),
      'wallet:' || g.wallet
    FROM groups g
    ON CONFLICT (signal_key, fingerprint) DO NOTHING
    RETURNING 1
  )
  SELECT inserted_count + COALESCE(COUNT(*),0)::int INTO inserted_count FROM ins;

  -- 2) Rapid handoffs (<24h between consecutive handoffs of same device).
  WITH chained AS (
    SELECT
      provider, device_id, previous_user_id, new_user_id, handoff_at,
      LAG(handoff_at) OVER (PARTITION BY provider, device_id ORDER BY handoff_at) AS prev_handoff_at
    FROM public.device_handoff_log
  ),
  fast AS (
    SELECT *
    FROM chained
    WHERE prev_handoff_at IS NOT NULL
      AND handoff_at - prev_handoff_at < interval '24 hours'
  ),
  ins2 AS (
    INSERT INTO public.collusion_signals (signal_key, severity, user_ids, evidence, fingerprint)
    SELECT
      'rapid_handoff',
      'warn',
      ARRAY[previous_user_id, new_user_id],
      jsonb_build_object(
        'provider', provider,
        'device_id', device_id,
        'handoff_at', handoff_at,
        'prev_handoff_at', prev_handoff_at,
        'gap_seconds', EXTRACT(EPOCH FROM (handoff_at - prev_handoff_at))::int
      ),
      'handoff:' || provider || ':' || device_id || ':' || extract(epoch from handoff_at)::text
    FROM fast
    ON CONFLICT (signal_key, fingerprint) DO NOTHING
    RETURNING 1
  )
  SELECT inserted_count + COALESCE(COUNT(*),0)::int INTO inserted_count FROM ins2;

  -- 3) Duplicate event fingerprints across multiple user_ids
  --    (same energy event credited to two different accounts).
  WITH all_events AS (
    SELECT user_id, event_fingerprint, 'energy_production'::text AS src
    FROM public.energy_production
    WHERE event_fingerprint IS NOT NULL
    UNION ALL
    SELECT user_id, event_fingerprint, 'charging_sessions'
    FROM public.charging_sessions
    WHERE event_fingerprint IS NOT NULL
    UNION ALL
    SELECT user_id, event_fingerprint, 'home_charging_sessions'
    FROM public.home_charging_sessions
    WHERE event_fingerprint IS NOT NULL
  ),
  dups AS (
    SELECT event_fingerprint,
           array_agg(DISTINCT user_id ORDER BY user_id) AS users,
           array_agg(DISTINCT src) AS sources,
           COUNT(DISTINCT user_id) AS n
    FROM all_events
    GROUP BY event_fingerprint
    HAVING COUNT(DISTINCT user_id) > 1
  ),
  ins3 AS (
    INSERT INTO public.collusion_signals (signal_key, severity, user_ids, evidence, fingerprint)
    SELECT
      'shared_fingerprint',
      'critical',
      d.users,
      jsonb_build_object(
        'event_fingerprint', d.event_fingerprint,
        'sources', to_jsonb(d.sources),
        'user_count', d.n
      ),
      'fp:' || d.event_fingerprint
    FROM dups d
    ON CONFLICT (signal_key, fingerprint) DO NOTHING
    RETURNING 1
  )
  SELECT inserted_count + COALESCE(COUNT(*),0)::int INTO inserted_count FROM ins3;

  RETURN inserted_count;
END $$;
