-- Queue table for push messages that should auto-fire as soon as the target
-- user registers a push subscription (e.g. they haven't enabled push yet).
CREATE TABLE public.pending_push_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
);

CREATE INDEX idx_pending_push_messages_user_pending
  ON public.pending_push_messages (user_id)
  WHERE status = 'pending';

ALTER TABLE public.pending_push_messages ENABLE ROW LEVEL SECURITY;

-- Admins manage everything
CREATE POLICY "Admins manage pending push messages"
ON public.pending_push_messages
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Recipients can view their own pending messages
CREATE POLICY "Users view their own pending push messages"
ON public.pending_push_messages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Trigger: when a push subscription is inserted, fire any pending messages
-- for that user via the send-push-notification edge function (pg_net async).
CREATE OR REPLACE FUNCTION public.flush_pending_push_messages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  msg RECORD;
  edge_url TEXT := 'https://fcptrpgqkjffgeddajwl.supabase.co/functions/v1/send-push-notification';
  service_role_key TEXT;
BEGIN
  service_role_key := current_setting('app.settings.service_role_key', true);

  FOR msg IN
    SELECT id, user_id, title, body, data
    FROM public.pending_push_messages
    WHERE user_id = NEW.user_id AND status = 'pending'
    ORDER BY created_at ASC
  LOOP
    BEGIN
      PERFORM net.http_post(
        url := edge_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
        ),
        body := jsonb_build_object(
          'user_id', msg.user_id,
          'title', msg.title,
          'body', msg.body,
          'data', msg.data
        )
      );

      UPDATE public.pending_push_messages
      SET status = 'sent', delivered_at = now()
      WHERE id = msg.id;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.pending_push_messages
      SET status = 'error', delivered_at = now(),
          data = COALESCE(data, '{}'::jsonb) || jsonb_build_object('error', SQLERRM)
      WHERE id = msg.id;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_flush_pending_push_messages
AFTER INSERT ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.flush_pending_push_messages();