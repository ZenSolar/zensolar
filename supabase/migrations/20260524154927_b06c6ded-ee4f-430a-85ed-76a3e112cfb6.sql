CREATE TABLE public.page_cleanup_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route TEXT NOT NULL UNIQUE,
  action TEXT NOT NULL CHECK (action IN ('archive', 'delete')),
  flagged_by UUID NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'cancelled')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.page_cleanup_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and editors manage page cleanup flags"
  ON public.page_cleanup_flags FOR ALL
  TO authenticated
  USING (is_admin_or_editor(auth.uid()))
  WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE TRIGGER update_page_cleanup_flags_updated_at
  BEFORE UPDATE ON public.page_cleanup_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();