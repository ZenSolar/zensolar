
-- 1. Fix search_path on pgmq wrapper functions
CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
 RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;

-- 2. Drop energy_tokens SELECT policy (OAuth tokens should never be readable from client)
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.energy_tokens;

-- 3. Create a safe RPC that returns only provider names (no tokens)
CREATE OR REPLACE FUNCTION public.get_connected_providers(_user_id uuid)
 RETURNS TABLE(provider text)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT DISTINCT et.provider
  FROM public.energy_tokens et
  WHERE et.user_id = _user_id
$function$;

-- 4. Restrict notification_logs INSERT to service_role only
DROP POLICY IF EXISTS "Users can receive notifications" ON public.notification_logs;
CREATE POLICY "Service role can insert notifications"
  ON public.notification_logs
  FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');

-- 5. Restrict viewer access to profiles (exclude sensitive fields via a view)
-- Drop the overly permissive viewer policy
DROP POLICY IF EXISTS "Viewers can view all profiles" ON public.profiles;

-- Create a restricted viewer policy that still allows viewing but through an RPC
CREATE OR REPLACE FUNCTION public.get_profiles_for_viewer(_user_id uuid)
 RETURNS TABLE(
   user_id uuid,
   display_name text,
   avatar_url text,
   created_at timestamptz,
   tesla_connected boolean,
   enphase_connected boolean,
   solaredge_connected boolean,
   wallbox_connected boolean,
   referral_code text,
   last_seen_at timestamptz,
   login_count integer
 )
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    p.user_id, p.display_name, p.avatar_url, p.created_at,
    p.tesla_connected, p.enphase_connected, p.solaredge_connected,
    p.wallbox_connected, p.referral_code, p.last_seen_at, p.login_count
  FROM public.profiles p
  WHERE public.is_viewer(_user_id)
$function$;

-- 6. Add explicit deny for user_rewards writes (only service_role can write)
-- The table already blocks INSERT/UPDATE/DELETE for regular users via no policies,
-- but let's be explicit
CREATE POLICY "Only service role can insert rewards"
  ON public.user_rewards
  FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service role can update rewards"
  ON public.user_rewards
  FOR UPDATE
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service role can delete rewards"
  ON public.user_rewards
  FOR DELETE
  TO public
  USING (auth.role() = 'service_role');
