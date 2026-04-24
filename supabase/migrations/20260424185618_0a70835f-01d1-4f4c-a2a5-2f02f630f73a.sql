-- Bi-directional EV mint events (Phase 3 / Patent claim anchor)
CREATE TABLE public.bidirectional_mint_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('import', 'export')),
  flow_type TEXT NOT NULL CHECK (flow_type IN ('charge', 'v2g', 'v2h', 'v2l')),
  energy_kwh NUMERIC NOT NULL DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  proof_hash TEXT,
  proof_metadata JSONB DEFAULT '{}'::jsonb,
  mint_status TEXT NOT NULL DEFAULT 'pending' CHECK (mint_status IN ('pending', 'minted', 'rejected')),
  tokens_minted NUMERIC DEFAULT 0,
  mint_tx_hash TEXT,
  patent_claim_ref TEXT DEFAULT 'ZSOLAR-BIDIR-V1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_bidir_user_session ON public.bidirectional_mint_events(user_id, session_id);
CREATE INDEX idx_bidir_direction_flow ON public.bidirectional_mint_events(direction, flow_type);
CREATE INDEX idx_bidir_recorded_at ON public.bidirectional_mint_events(recorded_at DESC);

ALTER TABLE public.bidirectional_mint_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bidir events"
  ON public.bidirectional_mint_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own bidir events"
  ON public.bidirectional_mint_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own bidir events"
  ON public.bidirectional_mint_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own bidir events"
  ON public.bidirectional_mint_events FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and editors view all bidir events"
  ON public.bidirectional_mint_events FOR SELECT
  USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Viewers view all bidir events"
  ON public.bidirectional_mint_events FOR SELECT
  USING (has_role(auth.uid(), 'viewer'::app_role));

CREATE TRIGGER update_bidir_mint_events_updated_at
  BEFORE UPDATE ON public.bidirectional_mint_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();