-- Pillar 2 · Source: HMAC-signed origin_proof registry
CREATE TABLE IF NOT EXISTS public.origin_proof_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  key_id text NOT NULL,
  algorithm text NOT NULL DEFAULT 'HMAC-SHA256',
  secret_hash text NOT NULL,           -- SHA-256 hex of the shared secret (registry-side fingerprint only)
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE (provider, key_id)
);

CREATE INDEX IF NOT EXISTS idx_origin_proof_keys_provider_active
  ON public.origin_proof_keys (provider) WHERE revoked_at IS NULL;

ALTER TABLE public.origin_proof_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can read the registry; service role bypasses RLS for edge functions.
CREATE POLICY "Admins can view origin proof keys"
  ON public.origin_proof_keys FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage origin proof keys"
  ON public.origin_proof_keys FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Append-only audit of every HMAC verification attempt against ingest endpoints.
CREATE TABLE IF NOT EXISTS public.origin_proof_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  provider text NOT NULL,
  key_id text,
  action text NOT NULL,                -- e.g. 'mint-onchain', 'ingest-energy'
  result text NOT NULL,                -- 'valid' | 'invalid_signature' | 'unknown_key' | 'revoked' | 'expired' | 'missing'
  payload_hash text,                   -- SHA-256 hex of canonical payload (no PII)
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  verified_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_origin_proof_verifications_user
  ON public.origin_proof_verifications (user_id, verified_at DESC);

CREATE INDEX IF NOT EXISTS idx_origin_proof_verifications_result
  ON public.origin_proof_verifications (result, verified_at DESC);

ALTER TABLE public.origin_proof_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own origin proof verifications"
  ON public.origin_proof_verifications FOR SELECT
  USING (auth.uid() = user_id OR public.has_dashboard_access(auth.uid()));