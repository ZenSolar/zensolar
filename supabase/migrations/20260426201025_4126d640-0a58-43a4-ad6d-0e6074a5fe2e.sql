DROP TRIGGER IF EXISTS trg_flush_pending_push_messages ON public.push_subscriptions;
DROP FUNCTION IF EXISTS public.flush_pending_push_messages();