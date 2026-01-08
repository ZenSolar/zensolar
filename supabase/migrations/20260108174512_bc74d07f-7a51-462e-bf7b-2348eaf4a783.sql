-- Create table to store energy provider tokens securely
CREATE TABLE public.energy_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('tesla', 'enphase', 'solaredge')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  extra_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.energy_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own tokens (but typically only edge functions access this)
CREATE POLICY "Users can view their own tokens"
ON public.energy_tokens
FOR SELECT
USING (auth.uid() = user_id);

-- Service role will insert/update tokens from edge functions
CREATE POLICY "Service role can manage all tokens"
ON public.energy_tokens
FOR ALL
USING (true)
WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_energy_tokens_updated_at
BEFORE UPDATE ON public.energy_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();