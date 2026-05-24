
-- get_mint_source_lines: returns the raw energy events that fall inside the
-- Proof-of-Delta window for a given mint (prev mint.created_at, this mint.created_at]
-- for the same user. Public/anon-safe: NO user_id, NO wallet, NO lat/lng,
-- NO device_id, NO location, NO session metadata. Just the cryptographic
-- fingerprint, kWh, timestamp, and source type — enough to independently
-- cross-reference against an OEM API export.

CREATE OR REPLACE FUNCTION public.get_mint_source_lines(_chain_hash text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_created timestamptz;
  v_prev_created timestamptz;
  v_lines jsonb;
BEGIN
  SELECT user_id, created_at
    INTO v_user, v_created
  FROM public.mint_transactions
  WHERE chain_hash = _chain_hash
  LIMIT 1;

  IF v_user IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  -- Window = previous confirmed mint for this user → this mint
  SELECT MAX(created_at)
    INTO v_prev_created
  FROM public.mint_transactions
  WHERE user_id = v_user
    AND created_at < v_created;

  -- Fallback: 30-day backstop for first-ever mints
  IF v_prev_created IS NULL THEN
    v_prev_created := v_created - interval '30 days';
  END IF;

  WITH lines AS (
    -- Supercharger / public charging
    SELECT
      'supercharger'::text AS source,
      cs.event_fingerprint AS fingerprint,
      cs.energy_kwh        AS kwh,
      (cs.session_date::timestamp AT TIME ZONE 'UTC') AS occurred_at
    FROM public.charging_sessions cs
    WHERE cs.user_id = v_user
      AND cs.created_at > v_prev_created
      AND cs.created_at <= v_created
      AND cs.event_fingerprint IS NOT NULL

    UNION ALL

    -- Home charging
    SELECT
      'home_charger'::text,
      hcs.event_fingerprint,
      hcs.total_session_kwh,
      hcs.start_time
    FROM public.home_charging_sessions hcs
    WHERE hcs.user_id = v_user
      AND hcs.created_at > v_prev_created
      AND hcs.created_at <= v_created
      AND hcs.event_fingerprint IS NOT NULL

    UNION ALL

    -- Solar / energy production
    SELECT
      ep.data_type,
      ep.event_fingerprint,
      ep.production_wh / 1000.0,
      ep.recorded_at
    FROM public.energy_production ep
    WHERE ep.user_id = v_user
      AND ep.created_at > v_prev_created
      AND ep.created_at <= v_created
      AND ep.event_fingerprint IS NOT NULL

    UNION ALL

    -- Bidirectional (V2G / battery export)
    SELECT
      ('bidir_' || COALESCE(bme.direction, 'unknown'))::text,
      bme.event_fingerprint,
      bme.energy_kwh,
      bme.recorded_at
    FROM public.bidirectional_mint_events bme
    WHERE bme.user_id = v_user
      AND bme.created_at > v_prev_created
      AND bme.created_at <= v_created
      AND bme.event_fingerprint IS NOT NULL
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'source', source,
    'fingerprint', fingerprint,
    'kwh', round(kwh::numeric, 4),
    'occurred_at', occurred_at
  ) ORDER BY occurred_at DESC), '[]'::jsonb)
    INTO v_lines
  FROM lines;

  RETURN jsonb_build_object(
    'found', true,
    'window_start', v_prev_created,
    'window_end', v_created,
    'line_count', jsonb_array_length(v_lines),
    'lines', v_lines
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_mint_source_lines(text) TO anon, authenticated;
