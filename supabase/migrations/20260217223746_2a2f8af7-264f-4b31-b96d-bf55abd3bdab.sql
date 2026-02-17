-- Create table for persisting SEO task statuses
CREATE TABLE public.seo_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  updated_by uuid NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view seo tasks"
  ON public.seo_tasks FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert seo tasks"
  ON public.seo_tasks FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update seo tasks"
  ON public.seo_tasks FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete seo tasks"
  ON public.seo_tasks FOR DELETE
  USING (is_admin(auth.uid()));