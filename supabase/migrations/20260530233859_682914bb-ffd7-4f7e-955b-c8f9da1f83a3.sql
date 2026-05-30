CREATE TABLE public.deason_doc_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  thread_id UUID NOT NULL,
  report JSONB NOT NULL,
  narrative TEXT,
  doc_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_deason_doc_analyses_thread ON public.deason_doc_analyses(thread_id, created_at DESC);
CREATE INDEX idx_deason_doc_analyses_user ON public.deason_doc_analyses(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deason_doc_analyses TO authenticated;
GRANT ALL ON public.deason_doc_analyses TO service_role;

ALTER TABLE public.deason_doc_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own analyses"
  ON public.deason_doc_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own analyses"
  ON public.deason_doc_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own analyses"
  ON public.deason_doc_analyses FOR DELETE
  USING (auth.uid() = user_id);