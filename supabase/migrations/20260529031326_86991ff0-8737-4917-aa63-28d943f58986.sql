
-- ============================================================
-- Storage bucket: private per-user folder for energy documents
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('energy-docs', 'energy-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Customers can read their own files (folder = user_id)
CREATE POLICY "Users read own energy docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'energy-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own energy docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'energy-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own energy docs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'energy-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- energy_reports: one row per generated analysis
-- ============================================================
CREATE TABLE public.energy_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  thread_id UUID,  -- optional link to Deason conversation
  status TEXT NOT NULL DEFAULT 'processing', -- processing | ready | failed
  preview JSONB NOT NULL DEFAULT '{}'::jsonb,        -- always returned (free)
  full_report JSONB,                                  -- paywalled
  inputs_summary JSONB NOT NULL DEFAULT '{}'::jsonb,  -- which docs + live OEM totals were used
  error_message TEXT,
  pdf_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.energy_reports TO authenticated;
GRANT ALL ON public.energy_reports TO service_role;

ALTER TABLE public.energy_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own energy reports"
  ON public.energy_reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own energy reports"
  ON public.energy_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own energy reports"
  ON public.energy_reports FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own energy reports"
  ON public.energy_reports FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Staff view all energy reports"
  ON public.energy_reports FOR SELECT TO authenticated
  USING (is_admin_or_editor(auth.uid()) OR has_role(auth.uid(), 'viewer'::app_role));

CREATE INDEX idx_energy_reports_user ON public.energy_reports(user_id, created_at DESC);
CREATE INDEX idx_energy_reports_thread ON public.energy_reports(thread_id) WHERE thread_id IS NOT NULL;

CREATE TRIGGER update_energy_reports_updated_at
  BEFORE UPDATE ON public.energy_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- energy_documents: each file uploaded for an analysis
-- ============================================================
CREATE TABLE public.energy_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  report_id UUID REFERENCES public.energy_reports(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- 'utility_bill' | 'solar_contract' | 'loan' | 'other'
  storage_path TEXT NOT NULL, -- path inside energy-docs bucket
  original_filename TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  extracted_fields JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.energy_documents TO authenticated;
GRANT ALL ON public.energy_documents TO service_role;

ALTER TABLE public.energy_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own energy docs"
  ON public.energy_documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own energy docs"
  ON public.energy_documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own energy docs"
  ON public.energy_documents FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Staff view all energy docs"
  ON public.energy_documents FOR SELECT TO authenticated
  USING (is_admin_or_editor(auth.uid()) OR has_role(auth.uid(), 'viewer'::app_role));

CREATE INDEX idx_energy_documents_report ON public.energy_documents(report_id);
CREATE INDEX idx_energy_documents_user ON public.energy_documents(user_id, created_at DESC);

-- ============================================================
-- energy_subscriptions: $4.99/mo paid tier tracker
-- ============================================================
CREATE TABLE public.energy_subscriptions (
  user_id UUID PRIMARY KEY,
  active BOOLEAN NOT NULL DEFAULT false,
  provider TEXT, -- 'stripe' | 'paddle' | 'comp' (complimentary)
  provider_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.energy_subscriptions TO authenticated;
GRANT ALL ON public.energy_subscriptions TO service_role;

ALTER TABLE public.energy_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own energy subscription"
  ON public.energy_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Staff view all energy subscriptions"
  ON public.energy_subscriptions FOR SELECT TO authenticated
  USING (is_admin_or_editor(auth.uid()) OR has_role(auth.uid(), 'viewer'::app_role));
-- only service role writes (set by webhook / admin grant)

CREATE TRIGGER update_energy_subscriptions_updated_at
  BEFORE UPDATE ON public.energy_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
