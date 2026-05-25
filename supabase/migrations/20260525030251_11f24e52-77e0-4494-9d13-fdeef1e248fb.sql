ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS solar_installer text CHECK (solar_installer IN ('tesla','other')),
  ADD COLUMN IF NOT EXISTS installer_name text,
  ADD COLUMN IF NOT EXISTS installer_company text,
  ADD COLUMN IF NOT EXISTS installer_phone text,
  ADD COLUMN IF NOT EXISTS installer_email text;