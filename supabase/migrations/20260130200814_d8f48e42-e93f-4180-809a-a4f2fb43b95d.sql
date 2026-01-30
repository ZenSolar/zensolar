-- Create trigger on auth.users to notify admins of new signups
-- This calls the notify-new-user edge function when a new user signs up

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_user();