-- Archive the legacy 10B tokenomics model as historical reference
CREATE TABLE public.tokenomics_archive (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL UNIQUE,
  model_version TEXT NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_by UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  superseded_by TEXT,
  max_supply NUMERIC NOT NULL,
  allocations JSONB NOT NULL,
  mint_distribution JSONB NOT NULL,
  transfer_tax JSONB NOT NULL,
  reward_rates JSONB NOT NULL,
  prices JSONB NOT NULL,
  lp_seed JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tokenomics_archive ENABLE ROW LEVEL SECURITY;

-- Only admins can view the archive (sensitive strategic data)
CREATE POLICY "Admins can view tokenomics archive"
ON public.tokenomics_archive
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert new archive entries
CREATE POLICY "Admins can archive tokenomics models"
ON public.tokenomics_archive
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed with the 10B model snapshot
INSERT INTO public.tokenomics_archive (
  model_name,
  model_version,
  reason,
  superseded_by,
  max_supply,
  allocations,
  mint_distribution,
  transfer_tax,
  reward_rates,
  prices,
  lp_seed,
  notes
) VALUES (
  '10B Strategy v1',
  'v1.0',
  'Superseded by 1T model with halving curve to support 20-year founder hold strategy, autonomous economy expansion (FSD/Robotaxi/Optimus), and patent-protected category coverage.',
  '1T Strategy v2',
  10000000000,
  '{"community":{"percentage":90,"amount":9000000000},"treasury":{"percentage":7.5,"amount":750000000,"vestingYears":2},"founder":{"percentage":2.5,"amount":250000000,"vestingYears":3,"cliffMonths":6}}'::jsonb,
  '{"user":75,"burn":20,"lp":3,"treasury":2}'::jsonb,
  '{"burn":3,"lp":2,"treasury":2,"total":7}'::jsonb,
  '{"solarProduction":1,"batteryDischarge":1,"evMiles":1,"evCharging":1,"unit":"$ZSOLAR per kWh or mile"}'::jsonb,
  '{"launchFloor":0.10,"target":1.00,"moonshotTargets":[5.00,10.00,20.00]}'::jsonb,
  '{"mainnet":{"usdcAmount":300000,"tokenAmount":3000000,"initialPrice":0.10},"liveBeta":{"usdcAmount":5000,"tokenAmount":50000,"initialPrice":0.10}}'::jsonb,
  'Original 10B model designed pre-Lyndon-Rive thesis. Did not account for: (1) 20-year founder hold strategy, (2) FSD/Robotaxi/Optimus reward categories, (3) patent moat covering inter-system tokenization, (4) halving curve for long-horizon scarcity. Preserved here as historical reference.'
);