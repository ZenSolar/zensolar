/**
 * TESLA TOKEN BROKER — one refresh authority for the whole backend.
 *
 * WHY THIS EXISTS
 * ---------------
 * Tesla Fleet refresh tokens are SINGLE-USE and ROTATING. Every successful
 * refresh mints a new refresh token and immediately invalidates the one that
 * was presented. That makes concurrent refresh a correctness bug, not a
 * performance concern.
 *
 * Before this file, six functions (tesla-data, tesla-charge-monitor,
 * tesla-fsd-sampler, tesla-odometer-cron, tesla-historical,
 * refresh-provider-tokens) each carried a private copy of the refresh logic
 * with no coordination. The dashboard alone fans out three parallel
 * tesla-data invocations (solar, battery, EV lanes). When they raced:
 *
 *   worker A: presents RT1 -> Tesla returns RT2, A stores RT2   (winner)
 *   worker B: presents RT1 -> Tesla says "refresh_token invalid" (loser)
 *   worker C: presents RT1 -> Tesla says "refresh_token invalid" (loser)
 *
 * The losers then did two destructive things:
 *   1. Tesla answers a consumed token with `login_required`, which
 *      classifyGrantFailure() maps to `user_revoked` — so a race got reported
 *      as "the member withdrew consent". That is why a grant nobody touched
 *      appeared revoked.
 *   2. An unconditional UPDATE could clobber the winner's fresh RT2 with a
 *      stale value, killing a grant that was actually healthy.
 *
 * THE CONTRACT HERE
 * -----------------
 *  - ONE code path performs the refresh. Callers ask for a usable access
 *    token; they never touch refresh tokens themselves.
 *  - Compare-and-swap on write: the row is only updated while it still holds
 *    the exact refresh token we presented. A late writer cannot overwrite a
 *    newer grant.
 *  - Lost races are RECOVERED, not recorded as failures: if the stored token
 *    changed while we were in flight, another worker already succeeded, so we
 *    adopt its result and return it.
 *  - A grant is only reported as member-revoked once we have re-read the row
 *    and confirmed no concurrent rotation explains the rejection.
 *  - One host. Fleet API refreshes go to fleet-auth; the legacy owner-API host
 *    is not interchangeable for Fleet grants.
 */

import { recordGrantFailure, clearGrantFailure } from './grantHealth.ts';

/**
 * Fleet API token endpoint. tesla-fsd-sampler, tesla-odometer-cron and
 * refresh-provider-tokens previously pointed at the legacy owner-API host
 * `auth.tesla.com`; Fleet grants must refresh here.
 */
export const TESLA_TOKEN_URL =
  'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token';

/** Refresh this long before the stamped expiry so no caller races the clock. */
const RENEW_SKEW_MS = 10 * 60 * 1000;

interface MinimalClient {
  from: (t: string) => any;
}

export interface TeslaTokenRow {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
}

export type TeslaTokenResult =
  | { ok: true; accessToken: string; refreshed: boolean }
  | { ok: false; reason: 'no_grant' | 'no_credentials' | 'refresh_failed'; detail?: string };

function stillValid(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const t = new Date(expiresAt).getTime();
  if (!Number.isFinite(t)) return false;
  return t - Date.now() > RENEW_SKEW_MS;
}

async function readRow(
  client: MinimalClient,
  userId: string,
): Promise<TeslaTokenRow | null> {
  const { data } = await client
    .from('energy_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'tesla')
    .maybeSingle();
  return (data as TeslaTokenRow) ?? null;
}

/**
 * Resolve a usable Tesla access token for `userId`.
 *
 * Every Tesla-touching function must call this instead of refreshing inline.
 * Safe to call concurrently: losers of a refresh race adopt the winner's
 * token rather than reporting a revoked grant.
 */
export async function getTeslaAccessToken(
  client: MinimalClient,
  userId: string,
): Promise<TeslaTokenResult> {
  const row = await readRow(client, userId);
  if (!row?.refresh_token) return { ok: false, reason: 'no_grant' };

  // Fast path — the stored access token is still comfortably in date.
  if (row.access_token && stillValid(row.expires_at)) {
    return { ok: true, accessToken: row.access_token, refreshed: false };
  }

  const clientId = Deno.env.get('TESLA_CLIENT_ID');
  const clientSecret = Deno.env.get('TESLA_CLIENT_SECRET');
  if (!clientId || !clientSecret) return { ok: false, reason: 'no_credentials' };

  const presented = row.refresh_token;

  let response: Response;
  try {
    response = await fetch(TESLA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: presented,
      }),
    });
  } catch (e) {
    // Network shape failure is never evidence that a member revoked consent.
    return { ok: false, reason: 'refresh_failed', detail: String(e) };
  }

  if (!response.ok) {
    const body = await response.text();

    // RACE RECOVERY, BEFORE ANY BLAME.
    // Re-read the row. If the stored refresh token is no longer the one we
    // presented, a concurrent worker rotated it while we were in flight —
    // our rejection is the expected consequence of single-use rotation, not
    // a revoked grant. Adopt the winner's token and report success.
    const after = await readRow(client, userId);
    if (after?.refresh_token && after.refresh_token !== presented) {
      if (after.access_token && stillValid(after.expires_at)) {
        return { ok: true, accessToken: after.access_token, refreshed: false };
      }
    }

    // No rotation explains it — now the failure is real and worth recording.
    const cls = await recordGrantFailure(client, userId, 'tesla', response.status, body);
    console.error(`[teslaToken] refresh failed [${cls}] user=${userId.slice(0, 8)}: ${body}`);
    return { ok: false, reason: 'refresh_failed', detail: body };
  }

  const tokens = await response.json();
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  // COMPARE-AND-SWAP: only write while the row still holds the token we
  // presented. If another worker already rotated past us, its token is the
  // live one and ours is spent — leaving its row untouched is the correct
  // outcome. An unconditional UPDATE here is what killed healthy grants.
  const { data: swapped } = await client
    .from('energy_tokens')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || presented,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('provider', 'tesla')
    .eq('refresh_token', presented)
    .select('access_token');

  if (!swapped || swapped.length === 0) {
    const after = await readRow(client, userId);
    if (after?.access_token && stillValid(after.expires_at)) {
      return { ok: true, accessToken: after.access_token, refreshed: false };
    }
  }

  await clearGrantFailure(client, userId, 'tesla');
  return { ok: true, accessToken: tokens.access_token, refreshed: true };
}
