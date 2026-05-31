
-- Deason v1: hub, monthly reports, document library, weather cache, insights, progression, ESID

-- 1. Permanent per-user document library
CREATE TABLE public.deason_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('utility_bill','installer_contract','ppa','loan','other')),
  label text,
  storage_path text NOT NULL,
  mime_type text,
  size_bytes integer,
  source text NOT NULL DEFAULT 'upload' CHECK (source IN ('upload','monthly_ritual')),
  linked_analysis_id uuid,
  linked_report_id uuid,
  period_month date,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_deason_documents_user ON public.deason_documents(user_id, uploaded_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deason_documents TO authenticated;
GRANT ALL ON public.deason_documents TO service_role;
ALTER TABLE public.deason_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own deason documents" ON public.deason_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own deason documents" ON public.deason_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own deason documents" ON public.deason_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own deason documents" ON public.deason_documents FOR DELETE USING (auth.uid() = user_id);

-- 2. Monthly Clean Energy Reports
CREATE TABLE public.deason_monthly_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  period_month date NOT NULL,
  bill_doc_id uuid REFERENCES public.deason_documents(id) ON DELETE SET NULL,
  structured_report jsonb NOT NULL DEFAULT '{}'::jsonb,
  narrative text,
  dollars_saved numeric NOT NULL DEFAULT 0,
  bonus_tokens numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','ready','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_month)
);
CREATE INDEX idx_deason_monthly_user ON public.deason_monthly_reports(user_id, period_month DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deason_monthly_reports TO authenticated;
GRANT ALL ON public.deason_monthly_reports TO service_role;
ALTER TABLE public.deason_monthly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own monthly reports" ON public.deason_monthly_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own monthly reports" ON public.deason_monthly_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own monthly reports" ON public.deason_monthly_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own monthly reports" ON public.deason_monthly_reports FOR DELETE USING (auth.uid() = user_id);

-- 3. Progression
CREATE TABLE public.deason_progression (
  user_id uuid NOT NULL PRIMARY KEY,
  level integer NOT NULL DEFAULT 1,
  points integer NOT NULL DEFAULT 0,
  months_completed integer NOT NULL DEFAULT 0,
  total_saved_usd numeric NOT NULL DEFAULT 0,
  total_bonus_tokens numeric NOT NULL DEFAULT 0,
  streak_months integer NOT NULL DEFAULT 0,
  last_period_month date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.deason_progression TO authenticated;
GRANT ALL ON public.deason_progression TO service_role;
ALTER TABLE public.deason_progression ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own progression" ON public.deason_progression FOR SELECT USING (auth.uid() = user_id);

-- 4. Insights feed
CREATE TABLE public.deason_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('savings','risk','opportunity','seasonal')),
  title text NOT NULL,
  body text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warn','high')),
  source_report_id uuid,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_deason_insights_user ON public.deason_insights(user_id, created_at DESC) WHERE dismissed_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deason_insights TO authenticated;
GRANT ALL ON public.deason_insights TO service_role;
ALTER TABLE public.deason_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own insights" ON public.deason_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own insights" ON public.deason_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service inserts insights" ON public.deason_insights FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- 5. Weather cache
CREATE TABLE public.deason_weather_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  lat numeric NOT NULL,
  lon numeric NOT NULL,
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_deason_weather_user ON public.deason_weather_cache(user_id, fetched_at DESC);
GRANT SELECT ON public.deason_weather_cache TO authenticated;
GRANT ALL ON public.deason_weather_cache TO service_role;
ALTER TABLE public.deason_weather_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own weather cache" ON public.deason_weather_cache FOR SELECT USING (auth.uid() = user_id);

-- 6. Profile additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS esid text,
  ADD COLUMN IF NOT EXISTS state_code text,
  ADD COLUMN IF NOT EXISTS utility_name text;
