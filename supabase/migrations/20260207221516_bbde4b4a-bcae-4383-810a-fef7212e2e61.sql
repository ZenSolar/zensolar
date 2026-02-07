
-- Add cryptographic verification columns to home_charging_sessions
ALTER TABLE public.home_charging_sessions
  ADD COLUMN IF NOT EXISTS proof_chain jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS delta_proof text,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.home_charging_sessions.proof_chain IS 'Array of SHA-256 snapshot hashes forming a hash chain per session';
COMMENT ON COLUMN public.home_charging_sessions.delta_proof IS 'Final SHA-256 proof of the session delta (start→end kWh)';
COMMENT ON COLUMN public.home_charging_sessions.verified IS 'Whether this session has a complete, valid proof chain';
