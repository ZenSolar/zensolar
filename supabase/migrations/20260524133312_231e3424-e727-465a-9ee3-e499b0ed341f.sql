
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.mint_transactions
  ADD COLUMN IF NOT EXISTS chain_seq bigint,
  ADD COLUMN IF NOT EXISTS chain_prev_hash text,
  ADD COLUMN IF NOT EXISTS chain_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS mint_transactions_chain_hash_uniq
  ON public.mint_transactions(chain_hash) WHERE chain_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mint_transactions_user_chain_seq
  ON public.mint_transactions(user_id, chain_seq);

CREATE OR REPLACE FUNCTION public.compute_mint_chain_hash(
  _user_id uuid, _tx_hash text, _action text, _tokens numeric,
  _kwh numeric, _miles numeric, _created_at timestamptz, _prev text
) RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT encode(extensions.digest(
    coalesce(_user_id::text,'') || '|' ||
    coalesce(_tx_hash,'') || '|' ||
    coalesce(_action,'') || '|' ||
    coalesce(round(_tokens::numeric, 8)::text, '0') || '|' ||
    coalesce(round(_kwh::numeric, 6)::text, '0') || '|' ||
    coalesce(round(_miles::numeric, 6)::text, '0') || '|' ||
    coalesce(extract(epoch from _created_at)::text, '0') || '|' ||
    coalesce(_prev, 'GENESIS'),
    'sha256'
  ), 'hex');
$$;

CREATE OR REPLACE FUNCTION public.mint_transactions_fill_chain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev_seq bigint;
  prev_hash text;
BEGIN
  SELECT chain_seq, chain_hash INTO prev_seq, prev_hash
  FROM public.mint_transactions
  WHERE user_id = NEW.user_id AND chain_seq IS NOT NULL
  ORDER BY chain_seq DESC LIMIT 1;

  NEW.chain_seq := COALESCE(prev_seq, 0) + 1;
  NEW.chain_prev_hash := prev_hash;
  NEW.chain_hash := public.compute_mint_chain_hash(
    NEW.user_id, NEW.tx_hash, NEW.action,
    COALESCE(NEW.tokens_minted, 0),
    COALESCE(NEW.kwh_delta, 0),
    COALESCE(NEW.miles_delta, 0),
    NEW.created_at, prev_hash
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_mint_transactions_fill_chain ON public.mint_transactions;
CREATE TRIGGER trg_mint_transactions_fill_chain
  BEFORE INSERT ON public.mint_transactions
  FOR EACH ROW EXECUTE FUNCTION public.mint_transactions_fill_chain();

CREATE OR REPLACE FUNCTION public.mint_transactions_protect_chain()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.chain_hash IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.chain_seq IS DISTINCT FROM OLD.chain_seq
     OR NEW.chain_prev_hash IS DISTINCT FROM OLD.chain_prev_hash
     OR NEW.chain_hash IS DISTINCT FROM OLD.chain_hash
     OR NEW.tx_hash IS DISTINCT FROM OLD.tx_hash
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Mint receipt chain fields are immutable (tx %, seq %)', OLD.tx_hash, OLD.chain_seq;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_mint_transactions_protect_chain ON public.mint_transactions;
CREATE TRIGGER trg_mint_transactions_protect_chain
  BEFORE UPDATE ON public.mint_transactions
  FOR EACH ROW EXECUTE FUNCTION public.mint_transactions_protect_chain();

DO $$
DECLARE
  r record;
  prev_seq bigint;
  prev_hash text;
  new_hash text;
BEGIN
  FOR r IN
    SELECT id, user_id, tx_hash, action, tokens_minted, kwh_delta, miles_delta, created_at
    FROM public.mint_transactions
    WHERE chain_hash IS NULL
    ORDER BY user_id, created_at, id
  LOOP
    SELECT chain_seq, chain_hash INTO prev_seq, prev_hash
    FROM public.mint_transactions
    WHERE user_id = r.user_id AND chain_seq IS NOT NULL
    ORDER BY chain_seq DESC LIMIT 1;

    new_hash := public.compute_mint_chain_hash(
      r.user_id, r.tx_hash, r.action,
      COALESCE(r.tokens_minted, 0),
      COALESCE(r.kwh_delta, 0),
      COALESCE(r.miles_delta, 0),
      r.created_at, prev_hash
    );

    UPDATE public.mint_transactions
    SET chain_seq = COALESCE(prev_seq, 0) + 1,
        chain_prev_hash = prev_hash,
        chain_hash = new_hash
    WHERE id = r.id;
  END LOOP;
END $$;

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
      )
    )
  END;
$$;

GRANT EXECUTE ON FUNCTION public.get_mint_receipt(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compute_mint_chain_hash(uuid, text, text, numeric, numeric, numeric, timestamptz, text) TO anon, authenticated;
