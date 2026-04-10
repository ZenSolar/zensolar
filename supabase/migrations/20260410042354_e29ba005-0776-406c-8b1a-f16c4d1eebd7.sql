
-- Table to store demo access codes
CREATE TABLE public.demo_access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text,
  is_active boolean NOT NULL DEFAULT true,
  uses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_access_codes ENABLE ROW LEVEL SECURITY;

-- Admins can manage codes
CREATE POLICY "Admins can manage demo codes"
  ON public.demo_access_codes FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Security definer function so anon/public can verify without reading the table
CREATE OR REPLACE FUNCTION public.verify_demo_code(_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.demo_access_codes
    WHERE code = _code AND is_active = true
  ) INTO found;

  IF found THEN
    UPDATE public.demo_access_codes SET uses = uses + 1 WHERE code = _code;
  END IF;

  RETURN found;
END;
$$;
