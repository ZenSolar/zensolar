-- Create support_requests table for help center submissions
CREATE TABLE public.support_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'open',
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own support requests
CREATE POLICY "Users can view their own support requests"
ON public.support_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own support requests
CREATE POLICY "Users can create their own support requests"
ON public.support_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all support requests
CREATE POLICY "Admins can view all support requests"
ON public.support_requests
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Admins can update support requests (respond, change status)
CREATE POLICY "Admins can update support requests"
ON public.support_requests
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_support_requests_updated_at
BEFORE UPDATE ON public.support_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();