DO $$
DECLARE
  target_uid uuid := 'efd8c5e5-ab11-4989-b644-2ef282ac5857';
  r record;
BEGIN
  -- Wipe rows in any public table that has a user_id column referencing this user
  FOR r IN
    SELECT table_schema, table_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'user_id'
  LOOP
    EXECUTE format('DELETE FROM %I.%I WHERE user_id = $1', r.table_schema, r.table_name) USING target_uid;
  END LOOP;

  DELETE FROM public.profiles WHERE user_id = target_uid;
  DELETE FROM auth.users WHERE id = target_uid;
END $$;