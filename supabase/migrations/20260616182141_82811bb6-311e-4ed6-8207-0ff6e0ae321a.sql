
CREATE TABLE public.starlink_attestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  screenshot_path text,
  ocr_raw_text text,
  ocr_confidence numeric,
  reading_download_gb numeric NOT NULL CHECK (reading_download_gb >= 0),
  reading_upload_gb numeric NOT NULL DEFAULT 0 CHECK (reading_upload_gb >= 0),
  previous_total_gb numeric NOT NULL DEFAULT 0 CHECK (previous_total_gb >= 0),
  delta_gb numeric NOT NULL CHECK (delta_gb >= 0),
  tokens_credited numeric NOT NULL DEFAULT 0 CHECK (tokens_credited >= 0),
  reading_period_start timestamptz,
  reading_period_end timestamptz,
  notes text,
  status text NOT NULL DEFAULT 'credited',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_starlink_attestations_user_created
  ON public.starlink_attestations (user_id, created_at DESC);

GRANT SELECT, INSERT ON public.starlink_attestations TO authenticated;
GRANT ALL ON public.starlink_attestations TO service_role;

ALTER TABLE public.starlink_attestations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own starlink attestations"
  ON public.starlink_attestations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own starlink attestations"
  ON public.starlink_attestations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all starlink attestations"
  ON public.starlink_attestations FOR SELECT
  USING (is_admin_or_editor(auth.uid()));
