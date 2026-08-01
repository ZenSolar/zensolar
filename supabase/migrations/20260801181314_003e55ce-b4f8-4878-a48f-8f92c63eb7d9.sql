-- Write-time enforcement of the delta-not-cumulative rule.
--
-- WHY A TRIGGER AND NOT A CHECK CONSTRAINT:
--   1. `(proof_metadata->>'value')::numeric` raises a cast error on any
--      non-numeric text. In a CHECK that aborts the statement with an opaque
--      "invalid input syntax" instead of a named refusal; a trigger can guard
--      the cast and raise a specific, greppable error code.
--   2. A CHECK is validated against the whole table (or carries NOT VALID
--      forever, which then still fires on any UPDATE of a legacy row). 2,091
--      legacy rows match the pattern; a trigger lets us enforce going forward
--      without either rewriting history or leaving a permanently-invalid
--      constraint on the table.
--   3. The refusal message can name the device and the two values, which is
--      what makes the failure actionable in a function log.

CREATE OR REPLACE FUNCTION public.reject_cumulative_as_delta()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _v text := NEW.proof_metadata->>'value';
  _p text := NEW.proof_metadata->>'prev_value';
  _num text := '^-?[0-9]+(\.[0-9]+)?$';
BEGIN
  IF NEW.proof_metadata IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only judge rows that declare both readings numerically.
  IF _v IS NULL OR _p IS NULL OR _v !~ _num OR _p !~ _num THEN
    RETURN NEW;
  END IF;

  -- A device's legitimate FIRST reading has prev_value = 0, and there the
  -- delta genuinely equals the cumulative value. Exempt it.
  IF _p::numeric = 0 THEN
    RETURN NEW;
  END IF;

  IF NEW.production_wh = _v::numeric THEN
    RAISE EXCEPTION
      'cumulative_as_delta_refused: device % (%/%) wrote production_wh=% equal to its cumulative reading (prev_value=%). production_wh must be the delta.',
      NEW.device_id, NEW.provider, NEW.data_type, NEW.production_wh, _p
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.reject_cumulative_as_delta() IS
  'Write-time guard: refuses any energy_production row whose production_wh equals its own cumulative proof_metadata.value while prev_value is non-zero. Exempts a device first reading (prev_value = 0). Added 2026-08-01 after the cumulative-as-delta staging incident.';

DROP TRIGGER IF EXISTS trg_reject_cumulative_as_delta ON public.energy_production;
CREATE TRIGGER trg_reject_cumulative_as_delta
BEFORE INSERT OR UPDATE ON public.energy_production
FOR EACH ROW
EXECUTE FUNCTION public.reject_cumulative_as_delta();