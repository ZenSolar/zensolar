
-- Add resolution tracking to violations + collusion signals
ALTER TABLE public.user_invariant_violations
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_by UUID,
  ADD COLUMN IF NOT EXISTS resolution_note TEXT;

ALTER TABLE public.collusion_signals
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_by UUID,
  ADD COLUMN IF NOT EXISTS resolution_note TEXT;

CREATE INDEX IF NOT EXISTS idx_uiv_open_critical
  ON public.user_invariant_violations (user_id)
  WHERE resolved_at IS NULL AND severity = 'critical';

CREATE INDEX IF NOT EXISTS idx_collusion_open_critical
  ON public.collusion_signals USING GIN (user_ids)
  WHERE resolved_at IS NULL AND severity = 'critical';

-- can_user_mint: returns jsonb { allowed: bool, reason: text|null, violations: [...], signals: [...] }
CREATE OR REPLACE FUNCTION public.can_user_mint(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_violations JSONB;
  v_signals JSONB;
  v_allowed BOOLEAN;
BEGIN
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id, 'check_name', check_name, 'detected_at', detected_at, 'details', details
  )), '[]'::jsonb)
  INTO v_violations
  FROM public.user_invariant_violations
  WHERE user_id = _user_id
    AND severity = 'critical'
    AND resolved_at IS NULL;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id, 'signal_key', signal_key, 'detected_at', detected_at, 'evidence', evidence
  )), '[]'::jsonb)
  INTO v_signals
  FROM public.collusion_signals
  WHERE _user_id = ANY(user_ids)
    AND severity = 'critical'
    AND resolved_at IS NULL;

  v_allowed := (jsonb_array_length(v_violations) = 0 AND jsonb_array_length(v_signals) = 0);

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'reason', CASE
      WHEN v_allowed THEN NULL
      WHEN jsonb_array_length(v_violations) > 0 AND jsonb_array_length(v_signals) > 0
        THEN 'open_invariant_violations_and_collusion_signals'
      WHEN jsonb_array_length(v_violations) > 0 THEN 'open_invariant_violations'
      ELSE 'open_collusion_signals'
    END,
    'violations', v_violations,
    'signals', v_signals,
    'checked_at', now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.can_user_mint(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.can_user_mint(UUID) TO authenticated, service_role;

-- Admin resolution RPCs
CREATE OR REPLACE FUNCTION public.resolve_invariant_violation(_id UUID, _note TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')) THEN
    RAISE EXCEPTION 'forbidden: admin or editor role required';
  END IF;

  UPDATE public.user_invariant_violations
  SET resolved_at = now(),
      resolved_by = auth.uid(),
      resolution_note = _note
  WHERE id = _id AND resolved_at IS NULL;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_collusion_signal(_id UUID, _note TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')) THEN
    RAISE EXCEPTION 'forbidden: admin or editor role required';
  END IF;

  UPDATE public.collusion_signals
  SET resolved_at = now(),
      resolved_by = auth.uid(),
      resolution_note = _note
  WHERE id = _id AND resolved_at IS NULL;

  RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.resolve_invariant_violation(UUID, TEXT) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.resolve_collusion_signal(UUID, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.resolve_invariant_violation(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_collusion_signal(UUID, TEXT) TO authenticated;
