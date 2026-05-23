ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ui_density text NOT NULL DEFAULT 'comfortable'
CHECK (ui_density IN ('comfortable', 'compact'));