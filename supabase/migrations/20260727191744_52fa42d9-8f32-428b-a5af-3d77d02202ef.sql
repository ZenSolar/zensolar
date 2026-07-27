CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sanitized_name text;
BEGIN
  sanitized_name := regexp_replace(
    substring(trim(COALESCE(new.raw_user_meta_data ->> 'display_name', '')) from 1 for 100),
    E'[\\x00-\\x1F\\x7F]',
    '',
    'g'
  );

  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, NULLIF(sanitized_name, ''))
  ON CONFLICT (user_id) DO UPDATE
  SET display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
      updated_at = now();

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (user_id, display_name)
SELECT
  u.id,
  NULLIF(
    regexp_replace(
      substring(trim(COALESCE(u.raw_user_meta_data ->> 'display_name', '')) from 1 for 100),
      E'[\\x00-\\x1F\\x7F]',
      '',
      'g'
    ),
    ''
  )
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;