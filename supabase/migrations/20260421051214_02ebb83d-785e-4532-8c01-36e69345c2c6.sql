
CREATE TABLE public.lp_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number integer NOT NULL UNIQUE,
  usdc_injected numeric NOT NULL,
  tokens_released numeric NOT NULL,
  spot_price_usd numeric NOT NULL,
  notes text,
  executed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.lp_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founders read lp_rounds"
ON public.lp_rounds FOR SELECT
USING (public.is_founder(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Admins insert lp_rounds"
ON public.lp_rounds FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins update lp_rounds"
ON public.lp_rounds FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete lp_rounds"
ON public.lp_rounds FOR DELETE
USING (public.is_admin(auth.uid()));

INSERT INTO public.lp_rounds (round_number, usdc_injected, tokens_released, spot_price_usd, notes)
VALUES (1, 200000, 2000000, 0.10, 'Genesis LP seed: $200K USDC paired with 2M $ZSOLAR at $0.10 launch price');
