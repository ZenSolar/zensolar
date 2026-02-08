
-- Create work journal table for admin tracking
CREATE TABLE public.work_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'feature',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.work_journal ENABLE ROW LEVEL SECURITY;

-- Only admins can CRUD
CREATE POLICY "Admins can view journal entries"
  ON public.work_journal FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert journal entries"
  ON public.work_journal FOR INSERT
  WITH CHECK (is_admin(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Admins can update journal entries"
  ON public.work_journal FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete journal entries"
  ON public.work_journal FOR DELETE
  USING (is_admin(auth.uid()));

-- Index for fast date lookups
CREATE INDEX idx_work_journal_date ON public.work_journal (date DESC);
