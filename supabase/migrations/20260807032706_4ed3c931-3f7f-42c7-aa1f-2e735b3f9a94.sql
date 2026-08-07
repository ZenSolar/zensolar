DROP POLICY IF EXISTS "Public can view yc content" ON public.yc_application_content;
REVOKE SELECT ON public.yc_application_content FROM anon;

DROP POLICY IF EXISTS "Anyone can read invite by token" ON public.beta_invites;
REVOKE SELECT ON public.beta_invites FROM anon;

CREATE OR REPLACE FUNCTION public.check_beta_invite(_token text)
RETURNS TABLE(label text, valid boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bi.label, (bi.consumed_by IS NULL) AS valid
  FROM public.beta_invites bi
  WHERE bi.token = _token
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.check_beta_invite(text) TO anon, authenticated;