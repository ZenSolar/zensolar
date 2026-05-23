
CREATE OR REPLACE FUNCTION public.get_live_earnings_stats()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'lifetime_tokens', COALESCE((
      SELECT SUM(tokens_minted) FROM public.mint_transactions WHERE status = 'confirmed'
    ), 0),
    'lifetime_mints', COALESCE((
      SELECT COUNT(*) FROM public.mint_transactions WHERE status = 'confirmed'
    ), 0),
    'month_tokens', COALESCE((
      SELECT SUM(tokens_minted) FROM public.mint_transactions
      WHERE status = 'confirmed' AND created_at > now() - interval '30 days'
    ), 0),
    'month_mints', COALESCE((
      SELECT COUNT(*) FROM public.mint_transactions
      WHERE status = 'confirmed' AND created_at > now() - interval '30 days'
    ), 0),
    'unique_minters', COALESCE((
      SELECT COUNT(DISTINCT user_id) FROM public.mint_transactions WHERE status = 'confirmed'
    ), 0),
    'last_mint_at', (
      SELECT MAX(created_at) FROM public.mint_transactions WHERE status = 'confirmed'
    ),
    'snapshot_at', now()
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_live_earnings_stats() TO anon, authenticated;
