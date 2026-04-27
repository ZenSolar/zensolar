-- Founder decisions awaiting async approval
CREATE TABLE public.founder_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  context TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendation TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','locked','dropped')),
  proposed_by UUID REFERENCES auth.users(id),
  locked_choice TEXT,
  locked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.founder_decision_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id UUID NOT NULL REFERENCES public.founder_decisions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('up','down','abstain')),
  choice TEXT,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (decision_id, user_id)
);

ALTER TABLE public.founder_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_decision_votes ENABLE ROW LEVEL SECURITY;

-- founder_decisions policies (founders + admins)
CREATE POLICY "Founders can view decisions"
  ON public.founder_decisions FOR SELECT
  TO authenticated
  USING (public.is_founder(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Founders can create decisions"
  ON public.founder_decisions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_founder(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Founders can update decisions"
  ON public.founder_decisions FOR UPDATE
  TO authenticated
  USING (public.is_founder(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Founders can delete decisions"
  ON public.founder_decisions FOR DELETE
  TO authenticated
  USING (public.is_founder(auth.uid()) OR public.is_admin(auth.uid()));

-- founder_decision_votes policies
CREATE POLICY "Founders can view votes"
  ON public.founder_decision_votes FOR SELECT
  TO authenticated
  USING (public.is_founder(auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Founders can cast own vote"
  ON public.founder_decision_votes FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (public.is_founder(auth.uid()) OR public.is_admin(auth.uid()))
  );

CREATE POLICY "Founders can update own vote"
  ON public.founder_decision_votes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Founders can delete own vote"
  ON public.founder_decision_votes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Auto-update updated_at
CREATE TRIGGER update_founder_decisions_updated_at
  BEFORE UPDATE ON public.founder_decisions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_founder_decision_votes_updated_at
  BEFORE UPDATE ON public.founder_decision_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_founder_decisions_status ON public.founder_decisions(status, created_at DESC);
CREATE INDEX idx_founder_decision_votes_decision ON public.founder_decision_votes(decision_id);

-- Seed a couple of starter pending decisions so the page isn't empty on first load
INSERT INTO public.founder_decisions (title, context, options, recommendation, status) VALUES
  (
    'Bitcoin-style halving on LP injections?',
    'Should we eventually slow or halve the % of subscription revenue that flows into the LP as the network matures (e.g., after 1M users or $5/token)? Current model: 50% of subs perpetually inject USDC into LP.',
    '["Yes — halve every N users","Yes — halve at price thresholds","No — keep linear forever","Decide post-Series A"]'::jsonb,
    'Defer until after seed. Floor-price math first.',
    'pending'
  ),
  (
    'Catchup page email cadence',
    'Should the weekly nudge email to Michael fire Friday end-of-day, or Monday morning?',
    '["Friday 5pm PT","Monday 7am PT","Both"]'::jsonb,
    'Friday 5pm PT — weekend reading window.',
    'pending'
  );
