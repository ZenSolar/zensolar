
-- Add daily summaries table for narrative recaps
CREATE TABLE public.work_journal_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE public.work_journal_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view summaries"
  ON public.work_journal_summaries FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert summaries"
  ON public.work_journal_summaries FOR INSERT
  WITH CHECK (is_admin(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Admins can update summaries"
  ON public.work_journal_summaries FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete summaries"
  ON public.work_journal_summaries FOR DELETE
  USING (is_admin(auth.uid()));

CREATE TRIGGER update_work_journal_summaries_updated_at
  BEFORE UPDATE ON public.work_journal_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
