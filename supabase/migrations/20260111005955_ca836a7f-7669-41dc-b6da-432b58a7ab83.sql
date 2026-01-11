-- Create notification templates table for editable push notification templates
CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  title_template text NOT NULL,
  body_template text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'system',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can manage templates
CREATE POLICY "Admins can view templates" ON public.notification_templates
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert templates" ON public.notification_templates
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update templates" ON public.notification_templates
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete templates" ON public.notification_templates
  FOR DELETE USING (is_admin(auth.uid()));

-- Insert default templates
INSERT INTO public.notification_templates (template_key, title_template, body_template, description, category) VALUES
  ('referral_reward', '🎉 Referral Reward!', 'Someone used your referral code! You''ve earned {{tokens}} $ZSOLAR tokens.', 'Sent when a user successfully refers someone', 'referral'),
  ('welcome', '👋 Welcome to ZenSolar!', 'Thanks for joining {{name}}! Start earning $ZSOLAR by connecting your solar devices.', 'Sent to new users after signup', 'system'),
  ('energy_milestone', '⚡ Energy Milestone!', 'Congratulations! You''ve produced {{energy}} Wh of clean energy and earned {{tokens}} $ZSOLAR!', 'Sent when users reach energy production milestones', 'milestone'),
  ('daily_summary', '☀️ Daily Energy Summary', 'Today you produced {{energy}} Wh and earned {{tokens}} $ZSOLAR tokens!', 'Daily energy production summary', 'system'),
  ('device_connected', '🔌 Device Connected!', 'Your {{device_name}} has been successfully connected. Start earning rewards!', 'Sent when a new device is connected', 'system');

-- Add trigger for updated_at
CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();