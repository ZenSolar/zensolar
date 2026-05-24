
-- M1: tx_hash uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS mint_transactions_tx_hash_uniq
  ON public.mint_transactions(tx_hash);

-- M3: non-negative minted amounts
ALTER TABLE public.mint_transactions
  DROP CONSTRAINT IF EXISTS mint_transactions_nonneg;
ALTER TABLE public.mint_transactions
  ADD CONSTRAINT mint_transactions_nonneg
  CHECK (
    COALESCE(tokens_minted, 0) >= 0
    AND COALESCE(kwh_delta, 0) >= 0
    AND COALESCE(miles_delta, 0) >= 0
  );

-- M2: per-window idempotency
CREATE TABLE IF NOT EXISTS public.mint_idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  mint_tx_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, action, window_start)
);
ALTER TABLE public.mint_idempotency_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own idempotency keys"
  ON public.mint_idempotency_keys FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Admins editors viewers view all idempotency keys"
  ON public.mint_idempotency_keys FOR SELECT
  USING (is_admin_or_editor(auth.uid()) OR has_role(auth.uid(), 'viewer'::app_role));
CREATE POLICY "Service role manages idempotency keys"
  ON public.mint_idempotency_keys FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- M6: forensic reconciliation log
CREATE TABLE IF NOT EXISTS public.mint_reconciliation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mint_tx_hash text NOT NULL,
  category text NOT NULL,
  headline_amount numeric NOT NULL,
  rows_amount numeric NOT NULL,
  on_chain_amount numeric NOT NULL,
  diff_pct numeric NOT NULL,
  source_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  tolerance_pct numeric NOT NULL DEFAULT 1.0,
  passed boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mint_reconciliation_log_user_idx
  ON public.mint_reconciliation_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS mint_reconciliation_log_tx_idx
  ON public.mint_reconciliation_log(mint_tx_hash);
ALTER TABLE public.mint_reconciliation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own reconciliation log"
  ON public.mint_reconciliation_log FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Admins editors viewers view all reconciliation log"
  ON public.mint_reconciliation_log FOR SELECT
  USING (is_admin_or_editor(auth.uid()) OR has_role(auth.uid(), 'viewer'::app_role));
CREATE POLICY "Service role inserts reconciliation log"
  ON public.mint_reconciliation_log FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- M5: baseline ≤ lifetime trigger
CREATE OR REPLACE FUNCTION public.enforce_baseline_le_lifetime()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  k text;
  base_val numeric;
  life_val numeric;
  numeric_keys text[] := ARRAY[
    'solar_wh','lifetime_solar_wh','solar_production_wh','total_solar_produced_wh',
    'odometer','last_known_odometer',
    'charging_kwh','lifetime_charging_kwh',
    'battery_discharge_wh','battery_charge_wh'
  ];
BEGIN
  IF NEW.baseline_data IS NULL OR NEW.lifetime_totals IS NULL THEN
    RETURN NEW;
  END IF;
  FOREACH k IN ARRAY numeric_keys LOOP
    IF (NEW.baseline_data ? k) AND (NEW.lifetime_totals ? k) THEN
      BEGIN
        base_val := (NEW.baseline_data ->> k)::numeric;
        life_val := (NEW.lifetime_totals ->> k)::numeric;
        IF base_val > life_val THEN
          RAISE EXCEPTION 'Baseline %.% (%) exceeds lifetime (%). Mint blocked until data syncs.',
            k, '', base_val, life_val;
        END IF;
      EXCEPTION WHEN invalid_text_representation THEN
        -- non-numeric value for that key (e.g. nested object); skip
        NULL;
      END;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS connected_devices_baseline_le_lifetime ON public.connected_devices;
CREATE TRIGGER connected_devices_baseline_le_lifetime
  BEFORE INSERT OR UPDATE ON public.connected_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_baseline_le_lifetime();
