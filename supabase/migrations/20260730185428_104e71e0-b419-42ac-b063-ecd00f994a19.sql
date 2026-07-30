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
  IF NEW.baseline_data IS NOT DISTINCT FROM OLD.baseline_data THEN
    RETURN NEW;
  END IF;

  IF NEW.baseline_data IS NULL OR NEW.baseline_data = '{}'::jsonb THEN
    _reason := 'baseline_blanked';
  END IF;

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

  RAISE WARNING 'baseline_write_refusal op=UPDATE device=% provider=% user=% db_role=% app=% reason=% attempted=% existing=%',
    NEW.device_id, NEW.provider, NEW.user_id, current_user,
    COALESCE(_appname,'-'), _reason, COALESCE(NEW.baseline_data::text,'NULL'),
    COALESCE(OLD.baseline_data::text,'NULL');

  RAISE EXCEPTION 'baseline_write_refused: device % (%): %',
    NEW.device_id, NEW.provider, _reason
    USING ERRCODE = 'check_violation';
END;
$fn$;

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

  RAISE WARNING 'baseline_write_refusal op=INSERT device=% provider=% user=% db_role=% app=% reason=empty_baseline_insert_with_release_history attempted=%',
    NEW.device_id, NEW.provider, NEW.user_id, current_user,
    COALESCE(_appname,'-'), COALESCE(NEW.baseline_data::text,'NULL');

  RAISE EXCEPTION 'baseline_write_refused: device % (%): empty_baseline_insert_with_release_history',
    NEW.device_id, NEW.provider
    USING ERRCODE = 'check_violation';
END;
$fn$;