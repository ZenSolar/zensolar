
-- Create announcements table for broadcast notifications visible to ALL logged-in users
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'system',
  url TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active announcements
CREATE POLICY "Authenticated users can view active announcements"
ON public.announcements FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Only admins can manage announcements
CREATE POLICY "Admins can insert announcements"
ON public.announcements FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update announcements"
ON public.announcements FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete announcements"
ON public.announcements FOR DELETE
USING (is_admin(auth.uid()));

-- Table to track which announcements a user has dismissed
CREATE TABLE public.announcement_dismissals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dismissals"
ON public.announcement_dismissals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can dismiss announcements"
ON public.announcement_dismissals FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add unique constraint on push_subscriptions endpoint to support upsert
-- (check if it exists first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'push_subscriptions_endpoint_key'
  ) THEN
    ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);
  END IF;
END $$;
