-- Universal baseline_data write invariant.
-- Canonical keys that must never disappear once present.
CREATE OR REPLACE FUNCTION public._baseline_canonical_keys()
RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT ARRAY['odometer','charging_kwh','supercharger_kwh','solar_wh','battery_export_wh']::text[]
$$;

CREATE OR REPLACE FUNCTION public.guard_baseline_data_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  _override text;
  _ids uuid[];
  _appname text;
  _reason text := NULL;
  _lost text[];
  _k text;
BEGIN
  -- No-op updates are always allowed.
  IF NEW.baseline_data IS NOT DISTINCT FROM OLD.baseline_data THEN
    RETURN NEW;
  END IF;

  -- (1a) Blanking: setting baseline_data to NULL or {}
  IF NEW.baseline_data IS NULL OR NEW.baseline_data = '{}'::jsonb THEN
    _reason := 'baseline_blanked';
  END IF;

  -- (1b) Removal of a canonical key that was present before the write
  IF _reason IS NULL AND OLD.baseline_data IS NOT NULL THEN
    _lost := ARRAY[]::text[];
    FOREACH _k IN ARRAY public._baseline_canonical_keys() LOOP
      IF (OLD.baseline_data ? _k) AND NOT (COALESCE(NEW.baseline_data,'{}'::jsonb) ? _k) THEN
        _lost := _lost || _k;
      END IF;
    END LOOP;
    IF array_length(_lost, 1) > 0 THEN
      _reason := 'canonical_key_removed:' || array_to_string(_lost, ',');
    END IF;
  END IF;

  -- (1c) Existing containment: device carries an unresolved critical baseline_unreadable violation
  SELECT array_agg(v.id) INTO _ids
  FROM public.user_invariant_violations v
  WHERE v.check_name = 'baseline_unreadable'
    AND v.severity = 'critical'
    AND v.resolved_at IS NULL
    AND v.details->>'device_id' = NEW.device_id;

  IF _reason IS NULL AND (_ids IS NULL OR array_length(_ids, 1) = 0) THEN
    RETURN NEW;
  END IF;

  IF _reason IS NULL THEN
    _reason := 'baseline_containment_active';
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

  RAISE EXCEPTION 'baseline_write_refused: device % (%): %',
    NEW.device_id, NEW.provider, _reason
    USING ERRCODE = 'check_violation';
END;
$fn$;

-- INSERT-side guard. Named to sort BEFORE trg_device_handoff_on_claim so it
-- evaluates the CALLER-supplied baseline, not the handoff trigger's blanking.
-- This keeps first claim and re-claim working while catching a writer that
-- inserts an empty baseline for hardware with release-archive history.
CREATE OR REPLACE FUNCTION public.guard_baseline_data_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  _override text;
  _appname text;
  _has_history boolean;
BEGIN
  IF NEW.baseline_data IS NOT NULL AND NEW.baseline_data <> '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public._device_release_archive a
    WHERE a.provider = NEW.provider AND a.device_id = NEW.device_id
  ) INTO _has_history;

  -- Genuinely new hardware: first claim proceeds untouched.
  IF NOT _has_history THEN
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
    _appname, NEW.baseline_data, NULL, NULL
  );

  RAISE EXCEPTION 'baseline_write_refused: device % (%): empty_baseline_insert_with_release_history',
    NEW.device_id, NEW.provider
    USING ERRCODE = 'check_violation';
END;
$fn$;

DROP TRIGGER IF EXISTS trg_a_guard_baseline_data_insert ON public.connected_devices;
CREATE TRIGGER trg_a_guard_baseline_data_insert
  BEFORE INSERT ON public.connected_devices
  FOR EACH ROW EXECUTE FUNCTION public.guard_baseline_data_insert();