DO $$
DECLARE uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email='jmaushart123@gmail.com';
  IF uid IS NOT NULL THEN
    DELETE FROM public.charging_sessions WHERE user_id = uid;
    DELETE FROM public.home_charging_sessions WHERE user_id = uid;
    DELETE FROM public.connected_devices WHERE user_id = uid;
    DELETE FROM public.user_roles WHERE user_id = uid;
    DELETE FROM public.profiles WHERE user_id = uid OR id = uid;
    DELETE FROM auth.users WHERE id = uid;
  END IF;
END $$;