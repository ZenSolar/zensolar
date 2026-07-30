CREATE OR REPLACE FUNCTION public._device_handoff_on_claim()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_prev record;
BEGIN
  SELECT * INTO v_prev
  FROM public._device_release_archive
  WHERE provider = NEW.provider
    AND device_id = NEW.device_id
    AND previous_user_id <> NEW.user_id
  ORDER BY released_at DESC
  LIMIT 1;

  IF FOUND THEN
    -- Reset baseline + lifetime so the new owner starts at zero
    NEW.baseline_data := '{}'::jsonb;
    NEW.lifetime_totals := '{}'::jsonb;
    NEW.last_minted_at := NULL;

    INSERT INTO public.device_handoff_log
      (provider, device_id, previous_user_id, new_user_id, previous_lifetime_totals)
    VALUES (NEW.provider, NEW.device_id, v_prev.previous_user_id, NEW.user_id, v_prev.previous_lifetime_totals);

    -- Critical integrity event: baseline was wiped on reclaim, so lifetime
    -- totals would re-count as mintable delta. Must be cleared by a human.
    INSERT INTO public.user_invariant_violations
      (user_id, check_name, severity, details, resolved_at, resolution_note)
    VALUES (
      NEW.user_id, 'device_handoff_baseline_reset', 'critical',
      jsonb_build_object(
        'provider', NEW.provider,
        'device_id', NEW.device_id,
        'previous_user_id', v_prev.previous_user_id,
        'previous_lifetime_totals', v_prev.previous_lifetime_totals
      ),
      NULL,
      NULL
    );
  END IF;
  RETURN NEW;
END;
$function$;