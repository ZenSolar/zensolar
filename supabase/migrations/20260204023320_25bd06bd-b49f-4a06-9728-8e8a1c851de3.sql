-- Create table for YC application content
CREATE TABLE public.yc_application_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text NOT NULL UNIQUE,
  section_title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.yc_application_content ENABLE ROW LEVEL SECURITY;

-- Admins can view all content
CREATE POLICY "Admins can view yc content"
ON public.yc_application_content
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Admins can insert content
CREATE POLICY "Admins can insert yc content"
ON public.yc_application_content
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Admins can update content
CREATE POLICY "Admins can update yc content"
ON public.yc_application_content
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Admins can delete content
CREATE POLICY "Admins can delete yc content"
ON public.yc_application_content
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Public can view content (for the public /yc-application route)
CREATE POLICY "Public can view yc content"
ON public.yc_application_content
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_yc_application_content_updated_at
BEFORE UPDATE ON public.yc_application_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();