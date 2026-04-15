CREATE OR REPLACE FUNCTION public.check_nda_signed(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nda_signatures
    WHERE email = lower(trim(_email))
  )
$$;