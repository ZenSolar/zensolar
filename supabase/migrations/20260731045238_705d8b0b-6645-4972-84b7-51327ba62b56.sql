-- ============================================================
-- Item 6 — delta-based issuance cutover (option A).
-- Historical rows are marked CONSUMED. No historical value is
-- deleted, recomputed or altered. Fully logged and reversible.
-- ============================================================

ALTER TABLE public.energy_production
  ADD COLUMN IF NOT EXISTS minted_at       timestamptz,
  ADD COLUMN IF NOT EXISTS mint_tx_id      uuid,
  ADD COLUMN IF NOT EXISTS consumed_reason text;

COMMENT ON COLUMN public.energy_production.minted_at IS
  'Set when this row has been consumed by issuance. NULL = unminted and issuable. Never cleared except by revert_issuance_cutover().';
COMMENT ON COLUMN public.energy_production.mint_tx_id IS
  'mint_transactions.id that consumed this row. NULL with a non-null minted_at means consumed by the cutover, not by a mint.';
COMMENT ON COLUMN public.energy_production.consumed_reason IS
  'pre_cutover | mint. Distinguishes the one-time cutover marker from real issuance.';

-- Partial index: the hot path is "unminted rows for this user/category".
CREATE INDEX IF NOT EXISTS idx_energy_production_unminted
  ON public.energy_production (user_id, data_type, recorded_at)
  WHERE minted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_energy_production_mint_tx
  ON public.energy_production (mint_tx_id)
  WHERE mint_tx_id IS NOT NULL;

-- ------------------------------------------------------------
-- Audit log for the cutover itself.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.issuance_cutovers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cutover_at  timestamptz NOT NULL,
  applied_at  timestamptz NOT NULL DEFAULT now(),
  rows_marked integer NOT NULL DEFAULT 0,
  note        text,
  reverted_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.issuance_cutovers TO authenticated;
GRANT ALL    ON public.issuance_cutovers TO service_role;

ALTER TABLE public.issuance_cutovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view issuance cutovers"
  ON public.issuance_cutovers FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role manages issuance cutovers"
  ON public.issuance_cutovers FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- Apply the cutover. Values untouched; marker only.
-- ------------------------------------------------------------
DO $cutover$
DECLARE
  _cutover_at timestamptz := now();
  _n integer;
BEGIN
  UPDATE public.energy_production
     SET minted_at       = _cutover_at,
         mint_tx_id      = NULL,
         consumed_reason = 'pre_cutover'
   WHERE minted_at IS NULL
     AND created_at < _cutover_at;

  GET DIAGNOSTICS _n = ROW_COUNT;

  INSERT INTO public.issuance_cutovers (cutover_at, rows_marked, note)
  VALUES (
    _cutover_at,
    _n,
    'Item 6 option (a): all rows predating cutover marked consumed. '
    'Per-device attribution unrecoverable for 38 of 40 historical mints, so '
    'partial reconciliation (option b) could not be computed honestly. '
    'Mainnet genesis is fresh; nothing here carries to mainnet. '
    'Reverse with select public.revert_issuance_cutover(id).'
  );
END
$cutover$;

-- ------------------------------------------------------------
-- Atomic consumption. A row can never be consumed twice: the
-- UPDATE is guarded by "minted_at IS NULL" and the caller runs
-- inside the mint's transaction.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_energy_rows(
  _user_id     uuid,
  _row_ids     uuid[],
  _mint_tx_id  uuid
)
RETURNS TABLE(consumed_count integer, consumed_wh numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _c integer;
  _wh numeric;
BEGIN
  IF _mint_tx_id IS NULL THEN
    RAISE EXCEPTION 'consume_energy_rows: mint_tx_id is required'
      USING ERRCODE = 'check_violation';
  END IF;

  WITH claimed AS (
    UPDATE public.energy_production ep
       SET minted_at       = now(),
           mint_tx_id      = _mint_tx_id,
           consumed_reason = 'mint'
     WHERE ep.id = ANY(_row_ids)
       AND ep.user_id = _user_id
       AND ep.minted_at IS NULL   -- <- the double-spend guard
    RETURNING ep.production_wh
  )
  SELECT count(*)::integer, COALESCE(sum(production_wh), 0)
    INTO _c, _wh
    FROM claimed;

  consumed_count := _c;
  consumed_wh := _wh;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_energy_rows(uuid, uuid[], uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_energy_rows(uuid, uuid[], uuid) TO service_role;

-- ------------------------------------------------------------
-- Reversal. Clears ONLY the cutover markers.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.revert_issuance_cutover(_cutover_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _at timestamptz;
  _n integer;
BEGIN
  SELECT cutover_at INTO _at
    FROM public.issuance_cutovers
   WHERE id = _cutover_id AND reverted_at IS NULL;

  IF _at IS NULL THEN
    RAISE EXCEPTION 'revert_issuance_cutover: no active cutover %', _cutover_id;
  END IF;

  UPDATE public.energy_production
     SET minted_at = NULL, consumed_reason = NULL
   WHERE consumed_reason = 'pre_cutover'
     AND minted_at = _at;

  GET DIAGNOSTICS _n = ROW_COUNT;

  UPDATE public.issuance_cutovers
     SET reverted_at = now(), updated_at = now()
   WHERE id = _cutover_id;

  RETURN _n;
END;
$$;

REVOKE ALL ON FUNCTION public.revert_issuance_cutover(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revert_issuance_cutover(uuid) TO service_role;

-- ------------------------------------------------------------
-- Read-side helper: issuable (unminted) quantity per category.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_issuable_deltas(_user_id uuid)
RETURNS TABLE(data_type text, provider text, row_count integer, quantity numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ep.data_type,
         ep.provider,
         count(*)::integer,
         CASE WHEN ep.data_type IN ('ev_miles','fsd_miles')
              THEN sum(ep.production_wh)
              ELSE sum(ep.production_wh) / 1000.0
         END
    FROM public.energy_production ep
   WHERE ep.user_id = _user_id
     AND ep.minted_at IS NULL
   GROUP BY ep.data_type, ep.provider;
$$;

GRANT EXECUTE ON FUNCTION public.get_issuable_deltas(uuid) TO authenticated, service_role;