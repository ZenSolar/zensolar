-- Add proof chain column to energy_production for cryptographic verification of odometer readings
ALTER TABLE public.energy_production ADD COLUMN IF NOT EXISTS proof_metadata jsonb DEFAULT NULL;

COMMENT ON COLUMN public.energy_production.proof_metadata IS 'Cryptographic proof chain data for Proof-of-Delta verification. Contains SHA-256 hashes for odometer snapshots and other verified measurements.';