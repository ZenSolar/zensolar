
CREATE OR REPLACE FUNCTION public.get_merkle_inclusion_proof(_chain_hash text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  anchor_row record;
  leaves text[];
  layer text[];
  next_layer text[];
  siblings jsonb := '[]'::jsonb;
  idx int;
  pair_idx int;
  sib_hash text;
  sib_pos text;
  cnt int;
  i int;
  a text; b text;
  computed_root text;
BEGIN
  SELECT pa.* INTO anchor_row
  FROM public.mint_transactions m
  JOIN public.proof_of_permanence_anchors pa
    ON pa.snapshot_at >= m.created_at
  WHERE m.chain_hash = _chain_hash
  ORDER BY pa.snapshot_at ASC
  LIMIT 1;

  IF anchor_row IS NULL THEN
    RETURN jsonb_build_object('found', false, 'reason', 'no_covering_anchor');
  END IF;

  SELECT array_agg(chain_hash ORDER BY user_id, chain_seq)
  INTO leaves
  FROM public.mint_transactions
  WHERE chain_hash IS NOT NULL
    AND created_at <= anchor_row.snapshot_at;

  cnt := COALESCE(array_length(leaves, 1), 0);
  IF cnt = 0 THEN
    RETURN jsonb_build_object('found', false, 'reason', 'empty_tree');
  END IF;

  idx := array_position(leaves, _chain_hash);
  IF idx IS NULL THEN
    RETURN jsonb_build_object('found', false, 'reason', 'leaf_not_in_tree');
  END IF;

  layer := leaves;
  WHILE array_length(layer, 1) > 1 LOOP
    IF idx % 2 = 1 THEN
      pair_idx := idx + 1;
      sib_pos := 'right';
    ELSE
      pair_idx := idx - 1;
      sib_pos := 'left';
    END IF;
    IF pair_idx > array_length(layer, 1) THEN
      sib_hash := layer[idx];
    ELSE
      sib_hash := layer[pair_idx];
    END IF;
    siblings := siblings || jsonb_build_array(jsonb_build_object('hash', sib_hash, 'position', sib_pos));

    next_layer := ARRAY[]::text[];
    i := 1;
    WHILE i <= array_length(layer, 1) LOOP
      a := layer[i];
      IF i + 1 <= array_length(layer, 1) THEN
        b := layer[i + 1];
      ELSE
        b := a;
      END IF;
      next_layer := array_append(next_layer,
        encode(extensions.digest(decode(a,'hex')||decode(b,'hex'),'sha256'),'hex'));
      i := i + 2;
    END LOOP;
    layer := next_layer;
    idx := (idx + 1) / 2;
  END LOOP;

  computed_root := layer[1];

  RETURN jsonb_build_object(
    'found', true,
    'chain_hash', _chain_hash,
    'leaf_index', array_position(leaves, _chain_hash) - 1,
    'leaf_count', cnt,
    'siblings', siblings,
    'computed_root', computed_root,
    'anchor_root', anchor_row.merkle_root,
    'root_match', computed_root = anchor_row.merkle_root,
    'anchor', jsonb_build_object(
      'id', anchor_row.id,
      'merkle_root', anchor_row.merkle_root,
      'snapshot_at', anchor_row.snapshot_at,
      'leaf_count', anchor_row.leaf_count,
      'onchain_tx_hash', anchor_row.onchain_tx_hash,
      'block_number', anchor_row.block_number
    )
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.get_merkle_inclusion_proof(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_merkle_inclusion_proof(text) TO anon, authenticated, service_role;


CREATE OR REPLACE FUNCTION public.verify_chain_integrity()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer := 0;
BEGIN
  WITH recomputed AS (
    SELECT
      mt.user_id, mt.tx_hash, mt.chain_seq, mt.chain_hash AS stored_hash,
      public.compute_mint_chain_hash(
        mt.user_id, mt.tx_hash, mt.action,
        COALESCE(mt.tokens_minted, 0),
        COALESCE(mt.kwh_delta, 0),
        COALESCE(mt.miles_delta, 0),
        mt.created_at, mt.chain_prev_hash
      ) AS computed_hash
    FROM public.mint_transactions mt
    WHERE mt.chain_hash IS NOT NULL
  ),
  mismatched AS (
    SELECT * FROM recomputed WHERE stored_hash <> computed_hash
  ),
  ins AS (
    INSERT INTO public.user_invariant_violations
      (user_id, check_name, severity, expected, actual, diff_pct, details)
    SELECT
      m.user_id, 'chain_hash_tamper', 'critical', 0, 0, 100,
      jsonb_build_object(
        'tx_hash', m.tx_hash,
        'chain_seq', m.chain_seq,
        'stored_hash', m.stored_hash,
        'computed_hash', m.computed_hash
      )
    FROM mismatched m
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_invariant_violations v
      WHERE v.check_name = 'chain_hash_tamper'
        AND v.details->>'tx_hash' = m.tx_hash
        AND v.details->>'stored_hash' = m.stored_hash
    )
    RETURNING 1
  )
  SELECT COALESCE(COUNT(*),0)::int INTO inserted_count FROM ins;
  RETURN inserted_count;
END $$;

REVOKE EXECUTE ON FUNCTION public.verify_chain_integrity() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_chain_integrity() TO service_role;


CREATE OR REPLACE FUNCTION public.check_anchor_freshness()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_at timestamptz;
  age_minutes numeric;
  inserted int := 0;
BEGIN
  SELECT MAX(snapshot_at) INTO last_at FROM public.proof_of_permanence_anchors;
  IF last_at IS NULL THEN
    age_minutes := 999999;
  ELSE
    age_minutes := EXTRACT(EPOCH FROM (now() - last_at)) / 60.0;
  END IF;

  IF age_minutes > 120 THEN
    INSERT INTO public.kpi_reconciliation_log
      (user_id, kpi_key, scope, severity, headline_value, computed_value,
       diff, diff_pct, tolerance_pct, passed, source_breakdown, details)
    VALUES
      (NULL, 'permanence_anchor_freshness', 'protocol', 'critical',
       120, age_minutes, age_minutes - 120, 100, 120, false,
       jsonb_build_object('last_anchor_at', last_at),
       jsonb_build_object('threshold_minutes', 120, 'run_at', now()));
    inserted := 1;
  END IF;
  RETURN inserted;
END $$;

REVOKE EXECUTE ON FUNCTION public.check_anchor_freshness() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_anchor_freshness() TO service_role;
