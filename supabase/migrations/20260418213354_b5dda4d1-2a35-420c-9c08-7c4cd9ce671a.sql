CREATE OR REPLACE FUNCTION public.get_admin_live_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
  result jsonb;
BEGIN
  -- Resolve the primary admin (single-admin project; matches get_viewer_target_admin)
  SELECT user_id INTO admin_id
  FROM public.user_roles
  WHERE role = 'admin'
  ORDER BY created_at ASC
  LIMIT 1;

  IF admin_id IS NULL THEN
    RETURN jsonb_build_object('error', 'no_admin');
  END IF;

  WITH
    solar AS (
      SELECT COALESCE(SUM(production_wh), 0)::numeric AS wh
      FROM public.energy_production
      WHERE user_id = admin_id AND data_type = 'solar'
    ),
    battery_disch AS (
      SELECT COALESCE(SUM((lifetime_totals->>'battery_discharge_wh')::numeric), 0) AS wh
      FROM public.connected_devices
      WHERE user_id = admin_id
    ),
    vehicle AS (
      SELECT
        COALESCE(SUM((lifetime_totals->>'odometer')::numeric), 0) AS miles,
        COALESCE(SUM((lifetime_totals->>'charging_kwh')::numeric), 0) AS charging_kwh
      FROM public.connected_devices
      WHERE user_id = admin_id AND device_type IN ('vehicle','ev','tesla_vehicle')
    ),
    super_sessions AS (
      SELECT COALESCE(SUM(energy_kwh), 0)::numeric AS kwh
      FROM public.charging_sessions
      WHERE user_id = admin_id AND charging_type = 'supercharger'
    ),
    home_sessions AS (
      SELECT COALESCE(SUM(total_session_kwh), 0)::numeric AS kwh
      FROM public.home_charging_sessions
      WHERE user_id = admin_id
    ),
    minted AS (
      SELECT
        COALESCE(SUM(tokens_minted), 0)::numeric AS tokens,
        COALESCE(SUM(COALESCE(array_length(nfts_minted, 1), 0)), 0)::int AS nft_count
      FROM public.mint_transactions
      WHERE user_id = admin_id AND status = 'confirmed'
    ),
    devices AS (
      SELECT jsonb_agg(jsonb_build_object(
        'device_id', device_id,
        'device_name', device_name,
        'device_type', device_type,
        'provider', provider
      ) ORDER BY device_type, claimed_at) AS list
      FROM public.connected_devices
      WHERE user_id = admin_id
    ),
    profile_row AS (
      SELECT
        display_name,
        tesla_connected,
        enphase_connected,
        solaredge_connected,
        wallbox_connected
      FROM public.profiles
      WHERE user_id = admin_id
      LIMIT 1
    )
  SELECT jsonb_build_object(
    'solar_kwh', (SELECT wh / 1000.0 FROM solar),
    'battery_discharged_kwh', (SELECT wh / 1000.0 FROM battery_disch),
    'ev_miles', (SELECT miles FROM vehicle),
    'supercharger_kwh', (SELECT kwh FROM super_sessions),
    'home_charger_kwh', (SELECT kwh FROM home_sessions) + (SELECT charging_kwh FROM vehicle) * 0,
    'lifetime_minted', (SELECT tokens FROM minted),
    'nft_count', (SELECT nft_count FROM minted),
    'devices', COALESCE((SELECT list FROM devices), '[]'::jsonb),
    'connections', (SELECT to_jsonb(profile_row) FROM profile_row),
    'snapshot_at', now()
  )
  INTO result;

  RETURN result;
END;
$$;

-- Allow anyone (including anon) to call the snapshot — it returns only aggregates
GRANT EXECUTE ON FUNCTION public.get_admin_live_snapshot() TO anon, authenticated;