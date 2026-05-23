-- Pass D · #4 — Saved view presets
-- Lets users persist named filter/view combinations per page
-- (e.g. "Last 7 days", "Solar only") and recall them with one click.

CREATE TABLE public.user_view_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  view_key TEXT NOT NULL,        -- e.g. 'energy-log', 'mint-history'
  name TEXT NOT NULL,            -- user-given label
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, view_key, name)
);

CREATE INDEX idx_user_view_presets_user_view
  ON public.user_view_presets (user_id, view_key);

ALTER TABLE public.user_view_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own presets"
  ON public.user_view_presets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own presets"
  ON public.user_view_presets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presets"
  ON public.user_view_presets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presets"
  ON public.user_view_presets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Reuse existing public.update_updated_at_column() trigger function
CREATE TRIGGER update_user_view_presets_updated_at
  BEFORE UPDATE ON public.user_view_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();