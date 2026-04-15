
CREATE TABLE public.demo_access_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_code text NOT NULL,
  city text,
  region text,
  country text,
  ip_address text,
  user_agent text,
  nda_signed boolean NOT NULL DEFAULT false,
  nda_signature_id uuid REFERENCES public.nda_signatures(id),
  accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log demo access"
ON public.demo_access_log
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins and editors can view demo access log"
ON public.demo_access_log
FOR SELECT
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins and editors can update demo access log"
ON public.demo_access_log
FOR UPDATE
USING (is_admin_or_editor(auth.uid()));
