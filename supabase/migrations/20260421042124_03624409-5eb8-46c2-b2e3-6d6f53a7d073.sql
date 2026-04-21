-- Helper: is_founder
CREATE OR REPLACE FUNCTION public.is_founder(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'founder'
  )
$$;

-- Vault access whitelist
CREATE TABLE public.founder_vault_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.founder_vault_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founders view vault access list"
ON public.founder_vault_access FOR SELECT
USING (public.is_founder(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Admins manage vault access"
ON public.founder_vault_access FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Vault state (single row)
CREATE TABLE public.vault_state (
  id integer PRIMARY KEY DEFAULT 1,
  current_price_usd numeric NOT NULL DEFAULT 1.00,
  total_supply numeric NOT NULL DEFAULT 10000000000,
  joseph_allocation numeric NOT NULL DEFAULT 150000000000,
  michael_allocation numeric NOT NULL DEFAULT 50000000000,
  joseph_trillionaire_price numeric NOT NULL DEFAULT 6.67,
  michael_trillionaire_price numeric NOT NULL DEFAULT 20.00,
  family_legacy_pact_active boolean NOT NULL DEFAULT true,
  pact_start_date date NOT NULL DEFAULT CURRENT_DATE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT vault_state_singleton CHECK (id = 1)
);
ALTER TABLE public.vault_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founders read vault state"
ON public.vault_state FOR SELECT
USING (public.is_founder(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Admins update vault state"
ON public.vault_state FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins insert vault state"
ON public.vault_state FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- WebAuthn credentials
CREATE TABLE public.vault_webauthn_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credential_id text NOT NULL UNIQUE,
  public_key text NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  device_label text,
  transports text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
ALTER TABLE public.vault_webauthn_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founders manage own credentials"
ON public.vault_webauthn_credentials FOR ALL
USING (auth.uid() = user_id AND public.is_founder(auth.uid()))
WITH CHECK (auth.uid() = user_id AND public.is_founder(auth.uid()));

-- Access log
CREATE TABLE public.vault_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  success boolean NOT NULL,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vault_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founders view own access log"
ON public.vault_access_log FOR SELECT
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Founders insert own access log"
ON public.vault_access_log FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- Auto-link + auto-grant founder role on signup
CREATE OR REPLACE FUNCTION public.link_founder_on_signin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.founder_vault_access
  SET user_id = NEW.id
  WHERE lower(email) = lower(NEW.email) AND user_id IS NULL;

  IF EXISTS (SELECT 1 FROM public.founder_vault_access WHERE lower(email) = lower(NEW.email) AND is_active) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'founder')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS link_founder_on_user_create ON auth.users;
CREATE TRIGGER link_founder_on_user_create
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.link_founder_on_signin();

-- Seed access whitelist
INSERT INTO public.founder_vault_access (email, display_name, user_id)
VALUES
  ('jo@zen.solar', 'Joseph Maushart', (SELECT id FROM auth.users WHERE lower(email)='jo@zen.solar' LIMIT 1)),
  ('mjcheets@gmail.com', 'Michael Tschida', (SELECT id FROM auth.users WHERE lower(email)='mjcheets@gmail.com' LIMIT 1))
ON CONFLICT (email) DO NOTHING;

-- Grant founder role to existing matching users
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'founder'::app_role
FROM auth.users u
WHERE lower(u.email) IN ('jo@zen.solar','mjcheets@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- Seed vault state
INSERT INTO public.vault_state (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;