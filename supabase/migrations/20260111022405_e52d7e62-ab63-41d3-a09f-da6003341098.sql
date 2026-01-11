-- Create a trigger function that calls the notify-new-user edge function
-- This uses pg_net to make HTTP calls to the edge function

-- First, enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a function to notify admin on new user signup
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  edge_function_url text;
  service_role_key text;
BEGIN
  -- Get the Supabase URL and service role key from environment
  edge_function_url := 'https://fcptrpgqkjffgeddajwl.supabase.co/functions/v1/notify-new-user';
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- Use pg_net to call the edge function asynchronously
  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(service_role_key, '')
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'users',
      'schema', 'auth',
      'record', jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'created_at', NEW.created_at
      )
    )
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't block user creation if notification fails
  RAISE WARNING 'Failed to notify admin of new user: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table for new signups
DROP TRIGGER IF EXISTS on_new_user_notify_admin ON auth.users;
CREATE TRIGGER on_new_user_notify_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_user();