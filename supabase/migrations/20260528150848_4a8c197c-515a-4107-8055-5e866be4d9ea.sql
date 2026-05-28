
-- Threads table
CREATE TABLE public.deason_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deason_threads TO authenticated;
GRANT ALL ON public.deason_threads TO service_role;

ALTER TABLE public.deason_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own deason threads"
  ON public.deason_threads FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own deason threads"
  ON public.deason_threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own deason threads"
  ON public.deason_threads FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own deason threads"
  ON public.deason_threads FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_deason_threads_user_updated ON public.deason_threads (user_id, updated_at DESC);

CREATE TRIGGER trg_deason_threads_updated_at
  BEFORE UPDATE ON public.deason_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages table
CREATE TABLE public.deason_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.deason_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content JSONB NOT NULL,
  bill_report JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deason_messages TO authenticated;
GRANT ALL ON public.deason_messages TO service_role;

ALTER TABLE public.deason_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own deason messages"
  ON public.deason_messages FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own deason messages"
  ON public.deason_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own deason messages"
  ON public.deason_messages FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_deason_messages_thread_created ON public.deason_messages (thread_id, created_at ASC);
