## Scope
Ship Tesla onboarding P0/P1 reliability fixes. Read-only scopes only. No dashboard/tokenomics changes, no virtual key pairing.

## Current state (verified in `supabase/functions/tesla-auth/index.ts` 249–270)
Currently requesting: `openid offline_access user_data vehicle_device_data vehicle_charging_cmds energy_device_data energy_cmds`.
- Missing `vehicle_location` (needed for Home vs Supercharger).
- `energy_cmds` is a write scope — contradicts "we observe, never control".
- `user_data` has no concrete consumer.
- Token-response `scope` field is not captured or validated — silent partial grants possible.
- Callback runs token exchange on whichever origin Tesla lands on; no bounce back to `beta.*` before exchange.
- `BetaTesla.tsx` `connecting` phase polls to 90s before honest sleeping copy.

## Changes

### 1. Requested scopes (P0)
`supabase/functions/tesla-auth/index.ts` — replace scope list with exactly:
```
openid offline_access vehicle_device_data vehicle_location vehicle_charging_cmds energy_device_data
```
Drop `user_data` and `energy_cmds`. Keep `prompt_missing_scopes=true` and `require_requested_scopes=true`.

### 2. Capture and validate granted scopes (P0)
- In `exchange-code`, read `tokens.scope` from Tesla's token response.
- Add `granted_scope text` column to `energy_tokens` (migration; verify column absence first via read_query).
- Persist `granted_scope` on token upsert.
- Extend `check-tokens` and `exchange-code` responses with `{ granted_scope, missing_scopes: string[] }` diffed against the required set.
- Classify `missing_scopes` server-side:
  - `blocking`: `vehicle_device_data`
  - `degraded`: `vehicle_location`, `vehicle_charging_cmds`, `energy_device_data`
  - `openid`/`offline_access`: treated as blocking (no refresh token = disconnect).

### 3. Scope recovery UI (P0)
New `src/components/onboarding/TeslaScopeRecovery.tsx`, rendered by `BetaTesla.tsx` when `missing_scopes` non-empty.
- Header adapts to severity:
  - Blocking: "We can't continue without this permission."
  - Degraded: "You'll be missing some data."
- Per-missing-scope row with plain-language consequence:
  - `vehicle_device_data` → "Without this we can't read your miles or FSD miles."
  - `vehicle_location` → "Without this we can't tell home charging apart from Supercharging."
  - `vehicle_charging_cmds` → "Without this we can't count your charging sessions or kWh added."
  - `energy_device_data` → "Without this we can't read your solar production or Powerwall."
  - `offline_access` → "Without this you'll be disconnected in a few hours."
- Two buttons per case:
  - **Add this permission** — triggers a fresh `startTeslaOAuth` run (Tesla re-prompts thanks to existing flags).
  - **Continue without it** — allowed for degraded; hidden for blocking. Stores the accepted-degraded set on the profile so we don't nag on every load (banner surfacing is out of scope for this pass).
- No automatic OAuth retry.

### 4. Pre-Tesla consent screen (P1)
Rewrite the emerald callout in `src/pages/beta/BetaTesla.tsx`:
- Headline: **"Leave every box checked."**
- Sub: "Tesla will show a list of permissions. Each one unlocks a specific reward:"
- Rows (Tesla label → user benefit):
  - Vehicle Information → miles and FSD miles
  - Vehicle Location → tells home charging apart from Supercharging
  - Vehicle Charging Management → charging sessions and kWh added
  - Energy Product Information → solar production and Powerwall (only shown when battery/solar selected)
- Footer line: **"ZenSolar only reads this data. We never send commands to your car or change any settings."**

### 5. Callback domain hop (P1)
`src/pages/OAuthCallback.tsx`:
- Before calling `exchangeTeslaCode`, if `window.location.hostname` is a non-beta apex (`zensolar.com`/`zen.solar` and their `www.` variants) AND the persisted `return_to` targets a `beta.*` host, instantly `window.location.replace` to `https://beta.zensolar.com/oauth/callback?<same query>&hopped=1`.
- `hopped=1` prevents loops; if already present, proceed with exchange on current origin.
- Splash keeps Quiet Current copy: "Connecting your Tesla…".

### 6. State token hardening (P1)
- Confirm `tesla_oauth_states` row is marked `consumed_at` on successful exchange and reused rows are rejected.
- Reduce TTL from 15 min → 10 min in the auth-url writer.

### 7. Sleeping vehicle handling (P1)
`BetaTesla.tsx` `connecting` phase:
- If tokens present but no `connected_devices` rows after **15s**, render honest copy: "Your Tesla is asleep. Data will update the next time it wakes up (usually within a few hours)."
- Primary button: **Continue to dashboard** (calls existing `cont()`).
- Baseline claim path already writes rows on wake; no dashboard change needed.

## Out of scope
Dashboard redesign, tokenomics, virtual key pairing, dashboard-side degraded-data banner.

## Verification
- `read_query` `energy_tokens` schema before migration.
- Playwright incognito onboarding from `beta.zensolar.com`: consent copy correct → Tesla approval → callback bounces to beta before exchange (visible in `__oauthDiag('dump')`) → happy path lands on device selection.
- Simulate degraded grant by hand-editing Tesla scopes (or stubbing token response in a dev override): confirm recovery UI names the exact missing capability, blocking hides Continue, degraded shows both.
- Simulate sleep by pointing device fetch at an empty result: 15s cutoff renders honest copy + Continue works.

## Final reply
"Tesla onboarding P0/P1 fixes complete — offline_access verified, scope recovery added, callback hardened, consent + sleep handling improved."
