REVOKE EXECUTE ON FUNCTION public.detect_collusion_signals() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.detect_collusion_signals() TO service_role;