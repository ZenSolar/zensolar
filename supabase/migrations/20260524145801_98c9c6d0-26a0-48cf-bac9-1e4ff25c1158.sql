
-- =====================================================================
-- Pillar 4: cross-source duplicate detector
-- =====================================================================
CREATE OR REPLACE FUNCTION public.detect_cross_source_duplicates()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  r record;
  v_since timestamptz := now() - interval '24 hours';
  v_window_min numeric := 15;
  v_kwh_tol numeric := 0.10;
BEGIN
  -- Unified view of recent events across the three raw event tables
  FOR r IN
    WITH unified AS (
      SELECT user_id, provider, device_id, start_time AS ts, total_session_kwh AS kwh,
             id::text AS row_id, 'home_charging_sessions' AS src
      FROM home_charging_sessions
      WHERE start_time >= v_since AND total_session_kwh > 0
      UNION ALL
      SELECT user_id, provider, device_id,
             (session_date::timestamp AT TIME ZONE 'UTC') AS ts,
             energy_kwh AS kwh, id::text, 'charging_sessions'
      FROM charging_sessions
      WHERE session_date >= (v_since::date) AND energy_kwh > 0
      UNION ALL
      SELECT user_id, provider, device_id, recorded_at AS ts,
             (production_wh / 1000.0) AS kwh, id::text, 'energy_production'
      FROM energy_production
      WHERE recorded_at >= v_since AND production_wh > 0
    )
    SELECT a.user_id, a.provider AS prov_a, b.provider AS prov_b,
           a.src AS src_a, b.src AS src_b,
           a.row_id AS row_a, b.row_id AS row_b,
           a.kwh AS kwh_a, b.kwh AS kwh_b,
           a.ts AS ts_a, b.ts AS ts_b,
           a.device_id AS dev_a, b.device_id AS dev_b,
           EXTRACT(EPOCH FROM (b.ts - a.ts)) / 60.0 AS delta_min
    FROM unified a
    JOIN unified b
      ON a.user_id = b.user_id
     AND a.row_id < b.row_id
     AND lower(a.provider) <> lower(b.provider)
     AND b.ts BETWEEN a.ts - (v_window_min || ' minutes')::interval
                  AND a.ts + (v_window_min || ' minutes')::interval
     AND abs(a.kwh - b.kwh) <= greatest(a.kwh, b.kwh, 0.0001) * v_kwh_tol
  LOOP
    -- Skip if an unresolved cross-source-dup already covers this pair
    IF EXISTS (
      SELECT 1 FROM user_invariant_violations
      WHERE check_name = 'cross_source_dup'
        AND user_id = r.user_id
        AND resolved_at IS NULL
        AND (details->>'row_a' = r.row_a AND details->>'row_b' = r.row_b)
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO user_invariant_violations
      (user_id, check_name, severity, expected, actual, diff_pct, details)
    VALUES (
      r.user_id, 'cross_source_dup', 'critical',
      r.kwh_a, r.kwh_b,
      CASE WHEN greatest(r.kwh_a, r.kwh_b) > 0
           THEN abs(r.kwh_a - r.kwh_b) / greatest(r.kwh_a, r.kwh_b) * 100
           ELSE 0 END,
      jsonb_build_object(
        'reason', 'time_window_collision',
        'provider_a', r.prov_a, 'provider_b', r.prov_b,
        'source_a', r.src_a, 'source_b', r.src_b,
        'row_a', r.row_a, 'row_b', r.row_b,
        'device_a', r.dev_a, 'device_b', r.dev_b,
        'kwh_a', r.kwh_a, 'kwh_b', r.kwh_b,
        'delta_minutes', round(r.delta_min::numeric, 2),
        'window_minutes', v_window_min,
        'kwh_tolerance_pct', v_kwh_tol * 100
      )
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- =====================================================================
-- Device handoff: archive + reset baseline on reclaim
-- =====================================================================
CREATE TABLE IF NOT EXISTS public._device_release_archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  device_id text NOT NULL,
  previous_user_id uuid NOT NULL,
  previous_lifetime_totals jsonb,
  previous_baseline_data jsonb,
  released_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_device_release_archive_lookup
  ON public._device_release_archive (provider, device_id, released_at DESC);

ALTER TABLE public._device_release_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages release archive" ON public._device_release_archive;
CREATE POLICY "Service role manages release archive"
  ON public._device_release_archive
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Staff view release archive" ON public._device_release_archive;
CREATE POLICY "Staff view release archive"
  ON public._device_release_archive
  FOR SELECT TO public
  USING (is_admin_or_editor(auth.uid()) OR has_role(auth.uid(), 'viewer'::app_role));

-- Capture release on DELETE
CREATE OR REPLACE FUNCTION public._device_release_capture()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public._device_release_archive
    (provider, device_id, previous_user_id, previous_lifetime_totals, previous_baseline_data)
  VALUES (OLD.provider, OLD.device_id, OLD.user_id, OLD.lifetime_totals, OLD.baseline_data);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_device_release_capture ON public.connected_devices;
CREATE TRIGGER trg_device_release_capture
  BEFORE DELETE ON public.connected_devices
  FOR EACH ROW EXECUTE FUNCTION public._device_release_capture();

-- On INSERT (reclaim), detect handoff, reset baseline, log
CREATE OR REPLACE FUNCTION public._device_handoff_on_claim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

    -- Informational integrity event (auto-resolved; not critical)
    INSERT INTO public.user_invariant_violations
      (user_id, check_name, severity, details, resolved_at, resolution_note)
    VALUES (
      NEW.user_id, 'device_handoff_baseline_reset', 'info',
      jsonb_build_object(
        'provider', NEW.provider,
        'device_id', NEW.device_id,
        'previous_user_id', v_prev.previous_user_id,
        'previous_lifetime_totals', v_prev.previous_lifetime_totals
      ),
      now(),
      'baseline auto-reset on reclaim'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_device_handoff_on_claim ON public.connected_devices;
CREATE TRIGGER trg_device_handoff_on_claim
  BEFORE INSERT ON public.connected_devices
  FOR EACH ROW EXECUTE FUNCTION public._device_handoff_on_claim();
