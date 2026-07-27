DO $$
DECLARE uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'jmaushart123@gmail.com';
  IF uid IS NOT NULL THEN
    DELETE FROM public.charging_sessions WHERE user_id = uid;
    DELETE FROM public.connected_devices WHERE user_id = uid;
    DELETE FROM public.profiles WHERE id = uid OR user_id = uid;
    DELETE FROM auth.users WHERE id = uid;
  END IF;
END $$;