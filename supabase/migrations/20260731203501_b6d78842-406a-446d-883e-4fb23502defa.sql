CREATE TABLE public.energy_production_quarantine (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_row_id uuid NOT NULL,
  reason text NOT NULL,
  row_snapshot jsonb NOT NULL,
  note text,
  archived_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_epq_source_row ON public.energy_production_quarantine(source_row_id);

GRANT SELECT ON public.energy_production_quarantine TO authenticated;
GRANT ALL ON public.energy_production_quarantine TO service_role;

ALTER TABLE public.energy_production_quarantine ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read quarantine archive"
ON public.energy_production_quarantine
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));