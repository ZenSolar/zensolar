-- Track VIP code first-use to support idempotent "first time used" notifications
CREATE TABLE public.vip_code_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code text NOT NULL UNIQUE,
  first_used_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz NOT NULL DEFAULT now(),
  signer_email text,
  signer_name text
);

ALTER TABLE public.vip_code_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and editors can view vip notifications"
  ON public.vip_code_notifications FOR SELECT
  USING (is_admin_or_editor(auth.uid()));

-- (Inserts handled by service role from edge function; no public insert policy needed)

-- Mint access requests from VIP demo viewers
CREATE TABLE public.mint_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code text,
  requester_email text,
  requester_name text,
  source text NOT NULL DEFAULT 'live_mirror_fab',
  user_agent text,
  ip_address text,
  notified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mint_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request mint access"
  ON public.mint_access_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins and editors can view mint access requests"
  ON public.mint_access_requests FOR SELECT
  USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins and editors can update mint access requests"
  ON public.mint_access_requests FOR UPDATE
  USING (is_admin_or_editor(auth.uid()));