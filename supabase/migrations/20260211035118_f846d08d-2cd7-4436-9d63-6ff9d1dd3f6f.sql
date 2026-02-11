
-- Create beta signup requests table
CREATE TABLE public.beta_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint on email
ALTER TABLE public.beta_signups ADD CONSTRAINT beta_signups_email_unique UNIQUE (email);

-- Enable RLS
ALTER TABLE public.beta_signups ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (no auth required for coming soon page)
CREATE POLICY "Anyone can submit beta signup"
  ON public.beta_signups
  FOR INSERT
  WITH CHECK (true);

-- Only admins can read signups
CREATE POLICY "Admins can view beta signups"
  ON public.beta_signups
  FOR SELECT
  USING (public.is_admin(auth.uid()));
