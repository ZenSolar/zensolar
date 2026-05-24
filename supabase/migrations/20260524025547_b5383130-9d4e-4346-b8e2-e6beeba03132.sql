-- 1) Remove the single existing duplicate in charging_sessions before enforcing uniqueness
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id, provider, device_id, session_date, energy_kwh, charging_type
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM public.charging_sessions
)
DELETE FROM public.charging_sessions
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 2) Unique fingerprints (idempotent ingest at DB layer = Proof-of-Delta invariant #1)
CREATE UNIQUE INDEX IF NOT EXISTS energy_production_fingerprint_uidx
  ON public.energy_production (user_id, provider, device_id, data_type, recorded_at);

CREATE UNIQUE INDEX IF NOT EXISTS home_charging_sessions_fingerprint_uidx
  ON public.home_charging_sessions (user_id, device_id, start_time);

CREATE UNIQUE INDEX IF NOT EXISTS charging_sessions_fingerprint_uidx
  ON public.charging_sessions (user_id, provider, device_id, session_date, energy_kwh, charging_type);

-- 3) Post-mint three-way reconciliation field
ALTER TABLE public.mint_transactions
  ADD COLUMN IF NOT EXISTS reconciliation_diff numeric;