DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'jmaushart123@gmail.com';
  IF uid IS NULL THEN RETURN; END IF;

  DELETE FROM public.charging_sessions WHERE user_id = uid;
  DELETE FROM public.home_charging_sessions WHERE user_id = uid;
  DELETE FROM public.energy_production WHERE user_id = uid;
  DELETE FROM public.connected_devices WHERE user_id = uid;
  DELETE FROM public.device_telemetry_cache WHERE user_id = uid;
  DELETE FROM public.user_home_locations WHERE user_id = uid;
  DELETE FROM public.user_rewards WHERE user_id = uid;
  DELETE FROM public.mint_transactions WHERE user_id = uid;
  DELETE FROM public.user_roles WHERE user_id = uid;
  DELETE FROM public.push_subscriptions WHERE user_id = uid;
  DELETE FROM public.pending_push_messages WHERE user_id = uid;
  DELETE FROM public.notification_logs WHERE user_id = uid;
  DELETE FROM public.tesla_oauth_states WHERE user_id = uid;
  DELETE FROM public.profiles WHERE user_id = uid OR id = uid;
  DELETE FROM auth.users WHERE id = uid;
END $$;