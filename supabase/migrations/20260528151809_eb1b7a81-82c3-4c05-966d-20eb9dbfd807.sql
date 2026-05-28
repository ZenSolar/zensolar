ALTER TABLE public.deason_threads
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS deason_threads_user_pinned_updated_idx
  ON public.deason_threads (user_id, pinned DESC, updated_at DESC);

-- Clean any orphan messages so the FK can be added safely.
DELETE FROM public.deason_messages m
WHERE NOT EXISTS (SELECT 1 FROM public.deason_threads t WHERE t.id = m.thread_id);

-- Add cascading FK so deleting a thread removes its messages.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deason_messages_thread_id_fkey'
  ) THEN
    ALTER TABLE public.deason_messages
      ADD CONSTRAINT deason_messages_thread_id_fkey
      FOREIGN KEY (thread_id) REFERENCES public.deason_threads(id) ON DELETE CASCADE;
  END IF;
END $$;