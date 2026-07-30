CREATE TABLE public.baseline_write_refusals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  provider text,
  device_user_id uuid,
  attempted_by uuid,
  db_role text,
  application_name text,
  attempted_baseline jsonb,
  existing_baseline jsonb,
  violation_ids uuid[],
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.baseline_write_refusals TO authenticated;
GRANT ALL ON public.baseline_write_refusals TO service_role;

ALTER TABLE public.baseline_write_refusals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins editors viewers read baseline refusals"
ON public.baseline_write_refusals FOR SELECT
TO authenticated
USING (public.is_admin_or_editor(auth.uid()) OR public.has_role(auth.uid(), 'viewer'::app_role));

CREATE POLICY "Service role manages baseline refusals"
ON public.baseline_write_refusals FOR ALL
TO service_role
USING (true) WITH CHECK (true);

CREATE INDEX idx_baseline_write_refusals_device ON public.baseline_write_refusals (device_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.guard_baseline_data_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _override text;
  _ids uuid[];
  _appname text;
BEGIN
  -- No-op updates are always allowed.
  IF NEW.baseline_data IS NOT DISTINCT FROM OLD.baseline_data THEN
    RETURN NEW;
  END IF;

  SELECT array_agg(v.id) INTO _ids
  FROM public.user_invariant_violations v
  WHERE v.check_name = 'baseline_unreadable'
    AND v.severity = 'critical'
    AND v.resolved_at IS NULL
    AND v.details->>'device_id' = NEW.device_id;

  IF _ids IS NULL OR array_length(_ids, 1) = 0 THEN
    RETURN NEW;
  END IF;

  BEGIN
    _override := current_setting('zensolar.baseline_migration', true);
  EXCEPTION WHEN OTHERS THEN
    _override := NULL;
  END;

  IF _override = 'on' THEN
    RETURN NEW;
  END IF;

  BEGIN
    _appname := current_setting('application_name', true);
  EXCEPTION WHEN OTHERS THEN
    _appname := NULL;
  END;

  INSERT INTO public.baseline_write_refusals (
    device_id, provider, device_user_id, attempted_by, db_role,
    application_name, attempted_baseline, existing_baseline, violation_ids
  ) VALUES (
    NEW.device_id, NEW.provider, NEW.user_id, auth.uid(), current_user,
    _appname, NEW.baseline_data, OLD.baseline_data, _ids
  );

  RAISE EXCEPTION
    'baseline_write_refused: device % is under unresolved critical baseline_unreadable containment (violations: %). Set zensolar.baseline_migration=on for an audited remediation.',
    NEW.device_id, _ids
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_baseline_data_write ON public.connected_devices;

CREATE TRIGGER trg_guard_baseline_data_write
BEFORE UPDATE OF baseline_data ON public.connected_devices
FOR EACH ROW EXECUTE FUNCTION public.guard_baseline_data_write();