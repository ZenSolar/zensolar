
-- 1) charging_sessions: source enum (as text to avoid enum churn), site_id, clean_claim
ALTER TABLE public.charging_sessions
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'supercharger'
    CHECK (source IN ('home','wallbox','supercharger','third_party_dc')),
  ADD COLUMN IF NOT EXISTS site_id uuid,
  ADD COLUMN IF NOT EXISTS clean_claim text NOT NULL DEFAULT 'unknown'
    CHECK (clean_claim IN ('self_produced','tesla_rec','unknown'));

-- 2) home_charging_sessions: source + clean_claim (always home/self_produced by default)
ALTER TABLE public.home_charging_sessions
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'home'
    CHECK (source IN ('home','wallbox','supercharger','third_party_dc')),
  ADD COLUMN IF NOT EXISTS clean_claim text NOT NULL DEFAULT 'self_produced'
    CHECK (clean_claim IN ('self_produced','tesla_rec','unknown'));

-- 3) supercharger_sites reference table
CREATE TABLE IF NOT EXISTS public.supercharger_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tesla_site_id text UNIQUE,
  name text NOT NULL,
  address text,
  city text,
  region text,
  country text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  stall_count integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.supercharger_sites TO authenticated;
GRANT ALL ON public.supercharger_sites TO service_role;

ALTER TABLE public.supercharger_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read supercharger sites"
  ON public.supercharger_sites FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert supercharger sites"
  ON public.supercharger_sites FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins and editors can update supercharger sites"
  ON public.supercharger_sites FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins and editors can delete supercharger sites"
  ON public.supercharger_sites FOR DELETE
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

CREATE TRIGGER trg_supercharger_sites_updated_at
  BEFORE UPDATE ON public.supercharger_sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS supercharger_sites_geo_idx
  ON public.supercharger_sites (latitude, longitude);

-- 4) Now that supercharger_sites exists, attach the FK for charging_sessions.site_id
ALTER TABLE public.charging_sessions
  ADD CONSTRAINT charging_sessions_site_id_fkey
  FOREIGN KEY (site_id) REFERENCES public.supercharger_sites(id) ON DELETE SET NULL;

-- 5) profiles: first-ever session timestamps for one-time L2 gating
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_supercharger_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_home_charge_at timestamptz;
