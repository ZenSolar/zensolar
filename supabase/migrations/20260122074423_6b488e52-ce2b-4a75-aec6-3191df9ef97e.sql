-- Create table for storing tokenomics framework responses
CREATE TABLE public.tokenomics_framework_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tokenomics_framework_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for admin-only access
CREATE POLICY "Admins can view all framework responses"
ON public.tokenomics_framework_responses
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert framework responses"
ON public.tokenomics_framework_responses
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Admins can update framework responses"
ON public.tokenomics_framework_responses
FOR UPDATE
USING (public.is_admin(auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Admins can delete framework responses"
ON public.tokenomics_framework_responses
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tokenomics_framework_responses_updated_at
BEFORE UPDATE ON public.tokenomics_framework_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create unique constraint for one response per user (they can update it)
CREATE UNIQUE INDEX idx_tokenomics_framework_user ON public.tokenomics_framework_responses(user_id);