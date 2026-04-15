
-- Create NDA signatures table
CREATE TABLE public.nda_signatures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  signature_text text NOT NULL,
  signature_method text NOT NULL DEFAULT 'typed',
  ip_address text,
  user_agent text,
  nda_version text NOT NULL DEFAULT '1.0',
  access_code_used text,
  email_sent boolean NOT NULL DEFAULT false,
  signed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nda_signatures ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can insert a signature
CREATE POLICY "Anyone can sign the NDA"
ON public.nda_signatures
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins and editors can view signatures
CREATE POLICY "Admins and editors can view all NDA signatures"
ON public.nda_signatures
FOR SELECT
USING (is_admin_or_editor(auth.uid()));

-- No update or delete policies - signatures are immutable
