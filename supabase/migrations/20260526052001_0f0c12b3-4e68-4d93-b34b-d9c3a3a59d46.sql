CREATE OR REPLACE FUNCTION public.get_mint_source_lines(_chain_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_user uuid;
  v_created timestamptz;
  v_prev_created timestamptz;
  v_action text;
  v_miles numeric;
  v_kwh numeric;
  v_breakdown jsonb;
  v_lines jsonb;
  v_window_start timestamptz;
  v_window_end timestamptz;
  v_allow_supercharger boolean := false;
  v_allow_home boolean := false;
  v_allow_solar boolean := false;
  v_allow_battery boolean := false;
  v_attributed text[] := ARRAY[]::text[];
BEGIN
  SELECT user_id, created_at, action, miles_delta, kwh_delta, source_breakdown
    INTO v_user, v_created, v_action, v_miles, v_kwh, v_breakdown
  FROM public.mint_transactions
  WHERE chain_hash = _chain_hash
  LIMIT 1;

  IF v_user IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT MAX(created_at)
    INTO v_prev_created
  FROM public.mint_transactions
  WHERE user_id = v_user
    AND created_at < v_created;

  IF v_prev_created IS NULL THEN
    v_prev_created := v_created - interval '30 days';
  END IF;

  v_window_start := v_prev_created;
  v_window_end   := v_created;

  IF v_breakdown IS NOT NULL AND v_breakdown <> '{}'::jsonb THEN
    IF COALESCE((v_breakdown ->> 'supercharger_kwh')::numeric, 0) > 0
       OR COALESCE((v_breakdown ->> 'tesla_supercharger_kwh')::numeric, 0) > 0
       OR COALESCE((v_breakdown ->> 'ev_charging_kwh')::numeric, 0) > 0 THEN
      v_allow_supercharger := true;
      v_attributed := v_attributed || 'supercharger';
    END IF;
    IF COALESCE((v_breakdown ->> 'home_charging_kwh')::numeric, 0) > 0
       OR COALESCE((v_breakdown ->> 'home_charger_kwh')::numeric, 0) > 0 THEN
      v_allow_home := true;
      v_attributed := v_attributed || 'home_charger';
    END IF;
    IF COALESCE((v_breakdown ->> 'solar_kwh')::numeric, 0) > 0
       OR COALESCE((v_breakdown ->> 'solar_production_kwh')::numeric, 0) > 0 THEN
      v_allow_solar := true;
      v_attributed := v_attributed || 'solar';
    END IF;
    IF COALESCE((v_breakdown ->> 'battery_kwh')::numeric, 0) > 0
       OR COALESCE((v_breakdown ->> 'battery_export_kwh')::numeric, 0) > 0
       OR COALESCE((v_breakdown ->> 'battery_discharge_kwh')::numeric, 0) > 0 THEN
      v_allow_battery := true;
      v_attributed := v_attributed || 'battery';
    END IF;
  ELSIF v_action = 'mint-rewards' THEN
    v_allow_supercharger := true;
    v_attributed := ARRAY['supercharger'];
  ELSE
    v_allow_supercharger := true;
    v_allow_home := true;
    v_allow_solar := true;
    v_allow_battery := true;
    v_attributed := ARRAY['supercharger','home_charger','solar','battery'];
  END IF;

  WITH lines AS (
    SELECT
      'supercharger'::text AS source,
      cs.event_fingerprint AS fingerprint,
      cs.energy_kwh        AS kwh,
      (cs.session_date::timestamp AT TIME ZONE 'UTC') AS occurred_at,
      cs.provider          AS provider,
      cs.device_id         AS device_id
    FROM public.charging_sessions cs
    WHERE v_allow_supercharger
      AND cs.user_id = v_user
      AND cs.created_at > v_prev_created
      AND cs.created_at <= v_created
      AND cs.event_fingerprint IS NOT NULL

    UNION ALL

    SELECT
      'home_charger'::text,
      hcs.event_fingerprint,
      hcs.total_session_kwh,
      hcs.start_time,
      NULL::text,
      hcs.device_id
    FROM public.home_charging_sessions hcs
    WHERE v_allow_home
      AND hcs.user_id = v_user
      AND hcs.created_at > v_prev_created
      AND hcs.created_at <= v_created
      AND hcs.event_fingerprint IS NOT NULL

    UNION ALL

    -- Solar: only data_type = 'solar' rows from energy_production
    SELECT
      'solar'::text,
      ep.event_fingerprint,
      ep.production_wh / 1000.0,
      ep.recorded_at,
      ep.provider,
      ep.device_id
    FROM public.energy_production ep
    WHERE v_allow_solar
      AND ep.user_id = v_user
      AND ep.data_type = 'solar'
      AND ep.created_at > v_prev_created
      AND ep.created_at <= v_created
      AND ep.event_fingerprint IS NOT NULL

    UNION ALL

    -- Battery discharge: data_type IN ('battery','battery_discharge') from energy_production.
    -- We intentionally do NOT read bidirectional_mint_events here — bi-directional
    -- attribution is unresolved and would produce ghost rows.
    SELECT
      'battery'::text,
      ep.event_fingerprint,
      ep.production_wh / 1000.0,
      ep.recorded_at,
      ep.provider,
      ep.device_id
    FROM public.energy_production ep
    WHERE v_allow_battery
      AND ep.user_id = v_user
      AND ep.data_type IN ('battery','battery_discharge')
      AND ep.created_at > v_prev_created
      AND ep.created_at <= v_created
      AND ep.event_fingerprint IS NOT NULL
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'source', source,
    'fingerprint', fingerprint,
    'kwh', round(kwh::numeric, 4),
    'occurred_at', occurred_at,
    'provider', provider,
    'device_watermark', CASE
      WHEN device_id IS NULL OR provider IS NULL THEN NULL
      ELSE substring(
        encode(extensions.digest(provider || '|' || device_id, 'sha256'), 'hex')
        from 1 for 12)
    END
  ) ORDER BY occurred_at DESC), '[]'::jsonb)
    INTO v_lines
  FROM lines;

  RETURN jsonb_build_object(
    'found', true,
    'window_start', v_window_start,
    'window_end',   v_window_end,
    'attributed_sources', to_jsonb(v_attributed),
    'line_count', jsonb_array_length(v_lines),
    'lines', v_lines
  );
END;
$function$;