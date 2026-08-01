/**
 * GRANT HEALTH — separates churn from breakage.
 *
 * A refresh that fails because the member pressed "Revoke" in the Tesla app is
 * CHURN. A refresh that fails because our stored session was flushed, rotated
 * out from under us, or rejected by the token endpoint is OUR DEFECT. Reporting
 * them in one bucket is how a seven-week outage stayed invisible.
 *
 * The classification is stamped onto `energy_tokens.extra_data` so the
 * `connection_health` view can report the two counts distinctly without any
 * log retention (edge logs expire in <24h).
 */

export type GrantFailureClass = 'user_revoked' | 'technically_invalid';

/**
 * OAuth2 says `invalid_grant` covers both "revoked" and "expired/unknown".
 * Tesla additionally returns `login_required` / `consent_required` when the
 * member withdrew consent, which is the only signal that reliably means churn.
 */
export function classifyGrantFailure(status: number, body: string): GrantFailureClass {
  const b = (body || '').toLowerCase();
  if (
    b.includes('login_required') ||
    b.includes('consent_required') ||
    b.includes('access_denied') ||
    b.includes('revoked')
  ) {
    return 'user_revoked';
  }
  // 400 invalid_grant with no revocation marker, 401s, 5xx, network shape
  // failures: all "we could not keep a session we were given".
  void status;
  return 'technically_invalid';
}

interface MinimalClient {
  from: (t: string) => any;
}

/** Stamp a failure on the token row. First-seen time is preserved. */
export async function recordGrantFailure(
  client: MinimalClient,
  userId: string,
  provider: string,
  status: number,
  body: string,
): Promise<GrantFailureClass> {
  const cls = classifyGrantFailure(status, body);
  try {
    const { data } = await client
      .from('energy_tokens')
      .select('extra_data')
      .eq('user_id', userId)
      .eq('provider', provider)
      .maybeSingle();

    const prev = (data?.extra_data as Record<string, unknown>) || {};
    const firstSeen =
      (prev.grant_failure_class as string) === cls && prev.grant_failure_at
        ? (prev.grant_failure_at as string)
        : new Date().toISOString();

    await client
      .from('energy_tokens')
      .update({
        extra_data: {
          ...prev,
          grant_failure_class: cls,
          grant_failure_at: firstSeen,
          grant_failure_last_seen_at: new Date().toISOString(),
          grant_failure_status: status,
          grant_failure_detail: String(body || '').slice(0, 300),
        },
      })
      .eq('user_id', userId)
      .eq('provider', provider);
  } catch (_e) {
    // Never let health bookkeeping break a poll.
  }
  return cls;
}

/** Clear the failure stamp after a refresh succeeds. */
export async function clearGrantFailure(
  client: MinimalClient,
  userId: string,
  provider: string,
): Promise<void> {
  try {
    const { data } = await client
      .from('energy_tokens')
      .select('extra_data')
      .eq('user_id', userId)
      .eq('provider', provider)
      .maybeSingle();
    const prev = (data?.extra_data as Record<string, unknown>) || {};
    if (!prev.grant_failure_class) return;
    const next = { ...prev };
    delete next.grant_failure_class;
    delete next.grant_failure_at;
    delete next.grant_failure_last_seen_at;
    delete next.grant_failure_status;
    delete next.grant_failure_detail;
    next.grant_recovered_at = new Date().toISOString();
    await client
      .from('energy_tokens')
      .update({ extra_data: next })
      .eq('user_id', userId)
      .eq('provider', provider);
  } catch (_e) {
    // no-op
  }
}
