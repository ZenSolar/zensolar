CREATE TABLE public.weekly_narratives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start_date date NOT NULL,
  week_end_date date NOT NULL,
  narrative_md text NOT NULL,
  teaser text,
  data_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_oem_priority jsonb NOT NULL DEFAULT '{}'::jsonb,
  model text NOT NULL DEFAULT 'google/gemini-2.5-pro',
  generated_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX weekly_narratives_user_week_uniq
  ON public.weekly_narratives(user_id, week_start_date);
CREATE INDEX weekly_narratives_user_generated_idx
  ON public.weekly_narratives(user_id, generated_at DESC);

GRANT SELECT ON public.weekly_narratives TO authenticated;
GRANT ALL ON public.weekly_narratives TO service_role;

ALTER TABLE public.weekly_narratives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own narratives"
  ON public.weekly_narratives FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Staff view all narratives"
  ON public.weekly_narratives FOR SELECT
  TO authenticated
  USING (is_admin_or_editor(auth.uid()) OR has_role(auth.uid(), 'viewer'::app_role));

CREATE POLICY "Service role manages narratives"
  ON public.weekly_narratives FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

CREATE TRIGGER update_weekly_narratives_updated_at
  BEFORE UPDATE ON public.weekly_narratives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();