CREATE EXTENSION IF NOT EXISTS citext;

-- access_requests
CREATE TABLE public.access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'unspecified' CHECK (source IN ('investor','hardware','other','unspecified')),
  note TEXT,
  hp TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.access_requests TO service_role;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
-- No policies for anon/authenticated = no direct client access. Service role bypasses RLS.

-- invite_codes
CREATE TABLE public.invite_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code CITEXT NOT NULL UNIQUE,
  label TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  redeem_count INT NOT NULL DEFAULT 0,
  last_redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.invite_codes TO service_role;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- invite_redeem_attempts
CREATE TABLE public.invite_redeem_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind TEXT NOT NULL DEFAULT 'invite' CHECK (kind IN ('invite','access')),
  ip_hash TEXT,
  code_tried_hash TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX invite_redeem_attempts_ip_time_idx
  ON public.invite_redeem_attempts (ip_hash, attempted_at DESC);
GRANT ALL ON public.invite_redeem_attempts TO service_role;
ALTER TABLE public.invite_redeem_attempts ENABLE ROW LEVEL SECURITY;

-- Seed invite codes
INSERT INTO public.invite_codes (code, label) VALUES
  ('8712387', 'Harrison (legacy)'),
  ('ZS-QUIETCURRENT', 'Founder-shared invite'),
  ('ZS-EARLYSIGNAL', 'Seed reviewer invite'),
  ('ZS-FIRSTPROOF', 'Investor referral invite')
ON CONFLICT (code) DO NOTHING;