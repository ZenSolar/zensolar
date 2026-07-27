# Tesla callback failure path — stop the /demo redirect, add poll backoff

## Root cause

`tesla-auth` returns HTTP **401** for `state_expired | state_consumed | state_missing`. On non-2xx, `supabase-js` populates `response.error` (FunctionsHttpError) and leaves `response.data = null`. In `useEnergyOAuth.exchangeTeslaCode`:

```
const dataErr = response.data?.error;         // undefined — data is null on 401
if (dataErr === 'state_expired' | ...) { ... } // never runs
const errMsg = extractError(response);        // picks up FunctionsHttpError message
throw new Error(errMsg);                       // falls into catch → showOAuthError → returns { ok:false, errorCode:'unknown' }
```

Because the classified `link-expired` branch never fires, `OAuthCallback` lands on the generic error branch and executes `window.location.href = '/'`. On `zensolar.com` / `zen.solar` the root route is wrapped by the `/demo` gate, so the browser lands on `/demo`. This exactly matches Claude's repro.

Secondary issues confirmed by reading the code:

- Same `window.location.href = '/'` fallback exists in the `provider:error`, `no-code`, session-restore-failed, tokens-not-found, and `callback:unknown` branches — every one of them dumps the user onto `/demo` on apex.
- `RETURN_ORIGIN_HOSTS` (edge fn) and `isAllowedReturnTo` (client) both omit `www.beta.zen.solar`.
- `useDeviceTelemetry` polls tesla-data on a fixed `pollMs` interval with zero backoff or failure cap — that is the 84-consecutive-failures loop.

## Fix — Client callback failure path

1. `**src/hooks/useEnergyOAuth.ts` — parse Tesla error body from FunctionsHttpError.**
  Before the current `dataErr` check, read the response body when `response.error` is a `FunctionsHttpError`:
   Then keep the existing `state_expired | state_consumed | state_missing` branch, returning `{ ok:false, errorCode: dataErr, message: dataMsg ?? … }`. Do NOT call `showOAuthError` for these classified failures — they are handled by the callback UI.
2. `**src/pages/OAuthCallback.tsx` — never redirect to `/` on Tesla failure.**
  - Replace every `window.location.href = '/'` inside a Tesla-classified path (`provider:error` when `isTesla`, `no-code`, session-restore-failed, tokens-not-found, `callback:unknown`) with `setStatus('link-expired')`. The existing `link-expired` UI already exposes a `Reconnect Tesla` CTA that hits `/beta/tesla`.
  - For the truly-unknown case (state present but doesn't match any provider) still surface the same expired-link screen — safer than routing to apex root.
  - Keep Enphase fallbacks as-is.
  - Remove the `setTimeout(() => window.location.href = '/', …)` calls tied to Tesla; rely on the CTA.
3. `**isAllowedReturnTo` + edge-fn `RETURN_ORIGIN_HOSTS` — complete the beta allowlist.**
  Add `www.beta.zen.solar` to both sets so a beta.zen.solar user's `returnTo` and the server-side origin check both accept it.
4. `**link-expired` reconnect CTA — restart on correct beta host.**
  Today it does `window.location.href = '/beta/tesla'`. If the callback fired on apex (state expired before hop), the CTA lands on apex `/beta/tesla`, which under the apex gate would bounce to `/demo` too. Compute the target host: prefer the last stored beta host from `sessionStorage` (`oauth_beta_host` written by `startTeslaOAuth`), then fall back to `beta.zensolar.com`. Reconstruct as `https://<host>/beta/tesla`.
5. `**startTeslaOAuth` (`useEnergyOAuth.ts`) — remember the beta origin.**
  Write `sessionStorage.setItem('oauth_beta_host', safeCurrentOrigin())` when the current host is a beta host, so the recovery CTA has an authoritative target after the domain hop.

## Fix — Tesla poll backoff + hard stop

6. `**src/hooks/useDeviceTelemetry.ts` — exponential backoff + circuit breaker.**
  - Track a per-hook `failureCount` ref updated in `refresh` (increment on `catch`, reset to 0 on success).
  - In the polling `setInterval`, compute effective delay = `pollMs * Math.min(2 ** failureCount, 16)` and reset the interval when the multiplier changes.
  - Hard stop after **10** consecutive failures: `clearInterval`, set `error = 'Live data paused after repeated failures'`, expose a manual `retry()` (already returned as `refresh`).
  - Emit `oauthDiag('useDeviceTelemetry', 'poll:paused', { capability, failureCount })` on stop so the diagnostic buffer captures it.

## Verification

- Force `state_expired`: manually expire the `tesla_oauth_states` row (or wait > 10 min), reload `/oauth/callback?...` on `zensolar.com`. Expect the "This link expired" screen; DevTools shows no navigation to `/demo`; oauth diag buffer contains `tesla:link-expired`.
- Force `state_missing`: strip `state` from the callback URL. Same expected result.
- Force `state_consumed`: replay the same `?state=…&code=…` twice. Second load renders the expired screen (not `/demo`).
- Click **Reconnect Tesla** → lands on `https://beta.zensolar.com/beta/tesla` and `startTeslaOAuth` mints a fresh state row.
- Simulate 12 consecutive `tesla-data` failures (block the function in DevTools). Confirm the interval delay grows (2×, 4×, 8×, 16× cap) and stops after 10 failures with the paused message. Manual refresh resumes normally on next success.
- `curl -s -o /dev/null -w "%{http_code}\n" https://zensolar.com/oauth/callback` → `200`; same for `zen.solar` and `beta.zen.solar`.

## Out of scope

Dashboard redesign, tokenomics, virtual key pairing, edge-fn refactor of status codes (still 401 by design; client now reads the body).  
  
  
Canonical beta host decision:

- Primary invite URL is [https://beta.zensolar.com](https://beta.zensolar.com)

- Prefer keeping users on [beta.zensolar.com](http://beta.zensolar.com) end-to-end

- Allowlist may include [beta.zen.solar](http://beta.zen.solar) for safety, but all product links and reconnect CTAs should target [beta.zensolar.com](http://beta.zensolar.com)