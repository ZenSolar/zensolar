-- Create energy production history table for storing cached data and calculating rewards
CREATE TABLE public.energy_production (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  production_wh NUMERIC NOT NULL DEFAULT 0,
  consumption_wh NUMERIC DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Prevent duplicate entries for same device/time
  CONSTRAINT unique_production_entry UNIQUE (device_id, provider, recorded_at)
);

-- Enable Row Level Security
ALTER TABLE public.energy_production ENABLE ROW LEVEL SECURITY;

-- Users can view their own production data
CREATE POLICY "Users can view their own production"
ON public.energy_production
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own production data
CREATE POLICY "Users can insert their own production"
ON public.energy_production
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_energy_production_user_date ON public.energy_production (user_id, recorded_at DESC);
CREATE INDEX idx_energy_production_device ON public.energy_production (device_id, provider);

-- Create rewards table for tracking earned tokens
CREATE TABLE public.user_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tokens_earned NUMERIC NOT NULL DEFAULT 0,
  energy_wh_basis NUMERIC NOT NULL DEFAULT 0,
  reward_type TEXT NOT NULL DEFAULT 'production',
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own rewards
CREATE POLICY "Users can view their own rewards"
ON public.user_rewards
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own rewards (via edge function)
CREATE POLICY "Users can insert their own rewards"
ON public.user_rewards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own rewards (for claiming)
CREATE POLICY "Users can update their own rewards"
ON public.user_rewards
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_user_rewards_user ON public.user_rewards (user_id, created_at DESC);
CREATE INDEX idx_user_rewards_unclaimed ON public.user_rewards (user_id, claimed) WHERE claimed = false;