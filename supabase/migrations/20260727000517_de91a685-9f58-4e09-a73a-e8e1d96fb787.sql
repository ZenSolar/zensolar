UPDATE public.connected_devices
SET baseline_data = COALESCE(baseline_data, '{}'::jsonb) || jsonb_build_object('home_charging_kwh', 440.76, 'home_charging_kwh_source', 'tesla_app_lifetime_2026-07-27', 'home_charging_kwh_reference_total_kwh', 464)
WHERE user_id = '331c79de-0c05-433c-a57e-9cdfcf2dc44d'
  AND device_id = '7SAYGDED1TA688212';