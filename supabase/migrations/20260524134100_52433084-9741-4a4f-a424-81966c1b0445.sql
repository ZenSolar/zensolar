
CREATE TABLE IF NOT EXISTS public.proof_of_permanence_anchors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  merkle_root text NOT NULL,
  leaf_count integer NOT NULL,
  max_chain_seq_global bigint NOT NULL,
  onchain_tx_hash text,
  block_number text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pop_anchors_snapshot_at
  ON public.proof_of_permanence_anchors(snapshot_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS pop_anchors_merkle_root_uniq
  ON public.proof_of_permanence_anchors(merkle_root);

ALTER TABLE public.proof_of_permanence_anchors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anchors are publicly readable" ON public.proof_of_permanence_anchors;
CREATE POLICY "Anchors are publicly readable"
  ON public.proof_of_permanence_anchors
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Build deterministic binary Merkle root over an ordered text[] of hex hashes.
CREATE OR REPLACE FUNCTION public.merkle_root_text(_leaves text[])
RETURNS text
LANGUAGE plpgsql IMMUTABLE
SET search_path = public, extensions
AS $$
DECLARE
  layer text[];
  next_layer text[];
  i integer;
  a text;
  b text;
BEGIN
  IF _leaves IS NULL OR array_length(_leaves, 1) IS NULL THEN
    RETURN encode(extensions.digest('EMPTY', 'sha256'), 'hex');
  END IF;
  layer := _leaves;
  WHILE array_length(layer, 1) > 1 LOOP
    next_layer := ARRAY[]::text[];
    i := 1;
    WHILE i <= array_length(layer, 1) LOOP
      a := layer[i];
      IF i + 1 <= array_length(layer, 1) THEN
        b := layer[i + 1];
      ELSE
        b := a; -- duplicate-last for odd counts
      END IF;
      next_layer := array_append(
        next_layer,
        encode(extensions.digest(decode(a, 'hex') || decode(b, 'hex'), 'sha256'), 'hex')
      );
      i := i + 2;
    END LOOP;
    layer := next_layer;
  END LOOP;
  RETURN layer[1];
END $$;

CREATE OR REPLACE FUNCTION public.compute_permanence_snapshot()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  leaves text[];
  root text;
  cnt integer;
  max_seq bigint;
  new_id uuid;
BEGIN
  SELECT array_agg(chain_hash ORDER BY user_id, chain_seq),
         COUNT(*)::int,
         COALESCE(MAX(chain_seq), 0)
    INTO leaves, cnt, max_seq
  FROM public.mint_transactions
  WHERE chain_hash IS NOT NULL;

  IF cnt = 0 THEN
    RETURN NULL;
  END IF;

  root := public.merkle_root_text(leaves);

  -- Skip insert if root unchanged since last snapshot
  IF EXISTS (
    SELECT 1 FROM public.proof_of_permanence_anchors
    ORDER BY snapshot_at DESC LIMIT 1
    OFFSET 0
  ) THEN
    IF (SELECT merkle_root FROM public.proof_of_permanence_anchors
        ORDER BY snapshot_at DESC LIMIT 1) = root THEN
      RETURN NULL;
    END IF;
  END IF;

  INSERT INTO public.proof_of_permanence_anchors
    (merkle_root, leaf_count, max_chain_seq_global, details)
  VALUES (root, cnt, max_seq,
          jsonb_build_object('algo', 'sha256-binary-duplicate-last'))
  RETURNING id INTO new_id;

  RETURN new_id;
END $$;

GRANT EXECUTE ON FUNCTION public.compute_permanence_snapshot() TO service_role;

-- Return the oldest anchor that covers a given receipt
CREATE OR REPLACE FUNCTION public.get_covering_anchor(_chain_hash text)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH r AS (
    SELECT created_at FROM public.mint_transactions
    WHERE chain_hash = _chain_hash LIMIT 1
  )
  SELECT to_jsonb(a) FROM public.proof_of_permanence_anchors a, r
  WHERE a.snapshot_at >= r.created_at
  ORDER BY a.snapshot_at ASC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_covering_anchor(text) TO anon, authenticated;

-- Extend get_mint_receipt to include covering anchor
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
      'status', (SELECT status FROM target),
      'created_at', (SELECT created_at FROM target),
      'is_valid', (SELECT chain_hash FROM target) = public.compute_mint_chain_hash(
        (SELECT user_id FROM target), (SELECT tx_hash FROM target), (SELECT action FROM target),
        COALESCE((SELECT tokens_minted FROM target), 0),
        COALESCE((SELECT kwh_delta FROM target), 0),
        COALESCE((SELECT miles_delta FROM target), 0),
        (SELECT created_at FROM target), (SELECT chain_prev_hash FROM target)
      ),
      'covering_anchor', (SELECT j FROM anc)
    )
  END;
$$;

GRANT EXECUTE ON FUNCTION public.get_mint_receipt(text) TO anon, authenticated;
