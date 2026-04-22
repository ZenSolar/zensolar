
CREATE TABLE public.email_link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text NOT NULL,
  link_key text NOT NULL,
  template_name text,
  recipient_email text,
  destination_url text,
  ip_address text,
  user_agent text,
  clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_link_clicks_message ON public.email_link_clicks(message_id);
CREATE INDEX idx_email_link_clicks_template ON public.email_link_clicks(template_name);
CREATE INDEX idx_email_link_clicks_clicked_at ON public.email_link_clicks(clicked_at DESC);

ALTER TABLE public.email_link_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert link clicks"
ON public.email_link_clicks FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins and editors can view link clicks"
ON public.email_link_clicks FOR SELECT
USING (is_admin_or_editor(auth.uid()));
