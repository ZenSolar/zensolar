CREATE OR REPLACE FUNCTION public.get_mint_receipt(_chain_hash text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH target AS (
    SELECT * FROM public.mint_transactions WHERE chain_hash = _chain_hash LIMIT 1
  ),
  nxt AS (
    SELECT chain_hash AS h FROM public.mint_transactions
    WHERE user_id = (SELECT user_id FROM target)
      AND chain_seq = (SELECT chain_seq FROM target) + 1
  ),
  anc AS (
    SELECT to_jsonb(a) - 'details' AS j FROM public.proof_of_permanence_anchors a, target t
    WHERE a.snapshot_at >= t.created_at
    ORDER BY a.snapshot_at ASC LIMIT 1
  )
  SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM target) THEN
    jsonb_build_object('found', false)
  ELSE
    jsonb_build_object(
      'found', true,
      'chain_hash', (SELECT chain_hash FROM target),
      'chain_prev_hash', (SELECT chain_prev_hash FROM target),
      'chain_next_hash', (SELECT h FROM nxt),
      'chain_seq', (SELECT chain_seq FROM target),
      'tx_hash', (SELECT tx_hash FROM target),
      'block_number', (SELECT block_number FROM target),
      'action', (SELECT action FROM target),
      'tokens_minted', (SELECT tokens_minted FROM target),
      'kwh_delta', (SELECT kwh_delta FROM target),
      'miles_delta', (SELECT miles_delta FROM target),
      'source_breakdown', (SELECT source_breakdown FROM target),
      'status', (SELECT status FROM target),
      'created_at', (SELECT created_at FROM target),
      'covering_anchor', (SELECT j FROM anc)
    )
  END
$$;

GRANT EXECUTE ON FUNCTION public.get_mint_receipt(text) TO anon, authenticated;