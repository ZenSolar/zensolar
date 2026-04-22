
CREATE TABLE public.email_opens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id text NOT NULL,
  recipient_email text,
  template_name text,
  opened_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  metadata jsonb
);

CREATE INDEX idx_email_opens_message_id ON public.email_opens(message_id);
CREATE INDEX idx_email_opens_recipient ON public.email_opens(recipient_email);
CREATE INDEX idx_email_opens_opened_at ON public.email_opens(opened_at DESC);

ALTER TABLE public.email_opens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert opens"
  ON public.email_opens FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins and editors can view opens"
  ON public.email_opens FOR SELECT
  USING (public.is_admin_or_editor(auth.uid()));
