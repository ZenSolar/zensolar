-- Add per-mint delta columns so the Proof-of-Genesis receipt can show
-- the EXACT odometer/kWh delta that produced the mint, not just the
-- token amount. Required for honest, verifiable receipts.
ALTER TABLE public.mint_transactions
  ADD COLUMN IF NOT EXISTS miles_delta numeric,
  ADD COLUMN IF NOT EXISTS kwh_delta numeric,
  ADD COLUMN IF NOT EXISTS source_breakdown jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.mint_transactions.miles_delta IS
  'EV miles driven since prior mint (odometer delta) — basis for EV reward portion';
COMMENT ON COLUMN public.mint_transactions.kwh_delta IS
  'Total verified kWh delta across all sources for this mint';
COMMENT ON COLUMN public.mint_transactions.source_breakdown IS
  'Per-source delta breakdown e.g. { "solar_kwh": 12.4, "battery_kwh": 3.1, "ev_miles": 1553.72, "charging_kwh": 17.3 }';

CREATE INDEX IF NOT EXISTS idx_mint_transactions_user_created
  ON public.mint_transactions (user_id, created_at DESC);