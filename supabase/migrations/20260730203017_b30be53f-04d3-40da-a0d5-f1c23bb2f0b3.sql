DROP TRIGGER IF EXISTS connected_devices_handoff_trigger ON public.connected_devices;

COMMENT ON FUNCTION public.handle_device_handoff() IS
'DORMANT (trigger dropped 2026-07-30). Implements the May-2026 in-place-reassignment handoff model: blanks baseline_data/lifetime_totals when connected_devices.user_id changes in place. Verified that no code path performs in-place user_id reassignment - claims INSERT and releases DELETE. It writes no user_invariant_violations row, so it MUST NOT be re-armed without adding one.';

-- Widen guard to BEFORE UPDATE (all columns) so it sees values assigned by earlier BEFORE triggers.
DROP TRIGGER IF EXISTS trg_guard_baseline_data_write ON public.connected_devices;
CREATE TRIGGER trg_guard_baseline_data_write
BEFORE UPDATE ON public.connected_devices
FOR EACH ROW EXECUTE FUNCTION public.guard_baseline_data_write();

-- Re-assert the guard body with the no-op short-circuit first, all other branches unchanged.
CREATE OR REPLACE FUNCTION public.guard_baseline_data_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _override text;
  _ids uuid[];
  _appname text;
  _reason text := NULL;
  _lost text[];
  _k text;
BEGIN
  -- REQUIRED FIRST: no baseline change => never refuse (keeps telemetry ingest alive
  -- for devices whose baseline is already '{}' or under containment).
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
$function$;