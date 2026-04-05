
-- Function for viewers to get the admin user_id they should mirror
CREATE OR REPLACE FUNCTION public.get_viewer_target_admin()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id
  FROM public.user_roles
  WHERE role = 'admin'
  LIMIT 1
$$;
