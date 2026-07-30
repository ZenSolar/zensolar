UPDATE public.user_invariant_violations
SET severity = 'critical',
    resolved_at = NULL,
    resolved_by = NULL,
    resolution_note = NULL
WHERE id IN ('e6148cfe-28a4-4916-b7ee-b0b17ac4e343','79702b33-35a4-489d-817a-eb2309ddb011');