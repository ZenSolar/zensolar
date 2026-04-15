CREATE OR REPLACE FUNCTION public.get_nda_signer_name(_email text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT full_name
  FROM public.nda_signatures
  WHERE email = _email
  ORDER BY signed_at DESC
  LIMIT 1
$$;