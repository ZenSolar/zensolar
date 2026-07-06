
REVOKE EXECUTE ON FUNCTION public.check_nda_signed(text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_nda_signed(text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_nda_signer_name(text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_nda_signer_name(text) TO authenticated, service_role;
