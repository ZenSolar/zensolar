-- Tokenomics versioning table
CREATE TABLE public.tokenomics_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL UNIQUE,
  version INTEGER NOT NULL,
  max_supply NUMERIC NOT NULL,
  allocations JSONB NOT NULL DEFAULT '{}'::jsonb,
  mint_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  transfer_tax JSONB NOT NULL DEFAULT '{}'::jsonb,
  reward_rates JSONB NOT NULL DEFAULT '{}'::jsonb,
  prices JSONB NOT NULL DEFAULT '{}'::jsonb,
  lp_seed JSONB NOT NULL DEFAULT '{}'::jsonb,
  subscription JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tokenomics_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and editors can view all tokenomics models"
ON public.tokenomics_models FOR SELECT TO authenticated
USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Viewers can view tokenomics models"
ON public.tokenomics_models FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'viewer'::app_role));

CREATE POLICY "Admins can insert tokenomics models"
ON public.tokenomics_models FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update tokenomics models"
ON public.tokenomics_models FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete tokenomics models"
ON public.tokenomics_models FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE TRIGGER tokenomics_models_updated_at
BEFORE UPDATE ON public.tokenomics_models
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure only one active model at a time
CREATE OR REPLACE FUNCTION public.enforce_single_active_tokenomics_model()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.tokenomics_models SET is_active = false WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_single_active_tokenomics_model_trigger
BEFORE INSERT OR UPDATE ON public.tokenomics_models
FOR EACH ROW EXECUTE FUNCTION public.enforce_single_active_tokenomics_model();

-- Seed: archive the current 10B model
INSERT INTO public.tokenomics_models (
  model_name, version, max_supply, allocations, mint_distribution, transfer_tax,
  reward_rates, prices, lp_seed, subscription, is_active, notes
) VALUES (
  '10B Strategy ($0.10 Floor)', 1, 10000000000,
  '{"community":{"percentage":90,"amount":9000000000},"treasury":{"percentage":7.5,"amount":750000000,"vestingYears":2},"founder":{"percentage":2.5,"amount":250000000,"vestingYears":3,"cliffMonths":6}}'::jsonb,
  '{"user":75,"burn":20,"lp":3,"treasury":2}'::jsonb,
  '{"burn":3,"lp":2,"treasury":2,"total":7}'::jsonb,
  '{"solarProduction":1,"batteryDischarge":1,"evMiles":1,"evCharging":1}'::jsonb,
  '{"launchFloor":0.10,"target":1.00,"moonshotTargets":[5,10,20]}'::jsonb,
  '{"mainnet":{"usdcAmount":300000,"tokenAmount":3000000,"initialPrice":0.10}}'::jsonb,
  '{"monthlyPrice":9.99,"lpContribution":50}'::jsonb,
  false,
  'Original tokenomics model. 10B hard cap, $0.10 launch floor, 75/20/3/2 mint distribution. Superseded by 1T Trillionaire Strategy.'
);

-- Seed: the new 1T model (active)
INSERT INTO public.tokenomics_models (
  model_name, version, max_supply, allocations, mint_distribution, transfer_tax,
  reward_rates, prices, lp_seed, subscription, is_active, notes
) VALUES (
  '1T Trillionaire Strategy', 2, 1000000000000,
  '{"community":{"percentage":70,"amount":700000000000,"description":"Mint-on-Proof, dual-gated to subscribers"},"treasury":{"percentage":7.5,"amount":75000000000,"vestingYears":2},"team_pool":{"percentage":2.5,"amount":25000000000,"description":"Future hires & advisors"},"founder_joseph":{"percentage":15,"amount":150000000000,"vestingYears":4,"cliffMonths":12,"name":"Joseph Maushart"},"cofounder_michael":{"percentage":5,"amount":50000000000,"vestingYears":4,"cliffMonths":12,"name":"Michael Tschida"}}'::jsonb,
  '{"user":75,"burn":20,"lp":3,"treasury":2}'::jsonb,
  '{"burn":3,"lp":2,"treasury":2,"total":7}'::jsonb,
  '{"solarProduction":1,"batteryDischarge":1,"evMiles":1,"evCharging":1,"fsdSupervisedMiles":1,"fsdUnsupervisedMiles":1}'::jsonb,
  '{"launchFloor":0.10,"target":1.00,"moonshotTargets":[5,10,20,50,100]}'::jsonb,
  '{"mainnet":{"usdcAmount":300000,"tokenAmount":3000000,"initialPrice":0.10}}'::jsonb,
  '{"tier1Price":19.99,"tier2Price":29.99,"tier3Price":49.99,"lpContribution":50,"current":"tier1"}'::jsonb,
  true,
  '1 Trillion hard cap. Joseph 15% / Michael 5% / Treasury 7.5% / Team Pool 2.5% / Community 70%. Subscription ladder $19.99 → $29.99 → $49.99. Built for trillionaire founder outcomes at $1+ token price. Tesla/SpaceX tokenize-everything scope per Mint-on-Proof patent extension.'
);