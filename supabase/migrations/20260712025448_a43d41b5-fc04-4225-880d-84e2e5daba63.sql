UPDATE public.charging_sessions
SET charging_type = 'home',
    session_metadata = COALESCE(session_metadata, '{}'::jsonb) || jsonb_build_object(
      'reclassified_from', 'supercharger',
      'reclassified_at', now(),
      'reclassified_reason', 'Bishop Momo is L2 AC charging, not Tesla Supercharger'
    )
WHERE user_id = '2fd601d0-04a0-4ecc-8131-61ca8dd9a357'
  AND location = 'Bishop Momo'
  AND charging_type = 'supercharger';