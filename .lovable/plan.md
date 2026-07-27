# Tesla P0/P1 — Ship-ready plan

Consolidated plan folding in every amendment. Land these in order, then verify and ship.

## Core changes (from earlier rounds, unchanged)

1. **Auth URL flags**: `require_requested_scopes=false`, `prompt_missing_scopes=true` so partial grants come back to us instead of being blocked at Tesla.
2. **Scope classification**: `missing_scopes` is a diff over data scopes only — `vehicle_device_data`, `vehicle_location`, `vehicle_charging_cmds`, `energy_device_data`. Offline access is inferred from `!!tokens.refresh_token`; if false, severity is `blocking` via a synthetic `no_refresh_token` reason, but it never appears in `missing_scopes`.
3. **Server-owned domain hop**: apex `/oauth/callback` looks up `tesla_oauth_states.return_to` by `state` and bounces to `https://<beta host>/oauth/callback?...&hopped=1` before token exchange. The `tesla_oauth_return_to` localStorage key is removed from `OAuthCallback.tsx` and `useEnergyOAuth.ts`.
4. **Expired / consumed link screen**: `exchange-code` returns standardized `state_expired | state_consumed | state_missing`; callback renders **"This link expired. Let's reconnect your Tesla."** with a button that restarts `startTeslaOAuth({ returnTo: '/onboarding/tesla' })` on beta.
5. **Consent copy**: always show Energy Product Information row, wording `"your solar production and Powerwall, if you have them"`. Recovery UI accepts `hasEnergyIntent` and suppresses the energy consequence when the user declared no solar/battery.
6. **Persist `granted_scope`** on `energy_tokens.extra_data` with `granted_at` and `has_refresh_token` alongside it.

## Post-connect state machine

After the 15 s connecting window, group Tesla `connected_devices` for the user into vehicles and energy sites, then check whether telemetry has landed (`last_known_state` non-empty on the respective rows).

| Vehicles | Energy sites | Vehicle telemetry | Energy telemetry | Screen |
| --- | --- | --- | --- | --- |
| ≥ 1 | 0 | none | — | **"Your Tesla is asleep. Data will update when it wakes."** Continue → background sync. |
| ≥ 1 | ≥ 1 | none | present | **"Your solar is producing right now. Your car is asleep and will sync when it wakes."** Continue. |
| ≥ 1 | ≥ 1 | none | none | Same asleep copy as row 1 (nothing to celebrate yet). |
| 0 | ≥ 1 | — | any | **"Your Powerwall and solar are connected. No vehicles found on this account."** Continue. Secondary: "Try a different Tesla account". |
| 0 | 0 | — | — | **"We didn't find any vehicles or energy products on this Tesla account."** Primary: "Try a different Tesla account". Secondary: "Skip for now". |
| ≥ 1 | any | present | any | Existing `snapshot` phase (unchanged). |

Implementation: new `post-connect-summary` phase in `src/pages/beta/BetaTesla.tsx` chosen from a single query result; `snapshot` becomes reachable only when vehicle telemetry actually arrives.

## `no_refresh_token` escape (with reset on recovery)

- Track `energy_tokens.extra_data.no_refresh_token_attempts` (integer).
- Increment on any `exchange-code` that lands without `refresh_token`.
- **Reset to 0 on any exchange that DOES return a `refresh_token`.** Prevents an old transient failure from immediately unlocking the escape hatch months later.
- Recovery UI:
  - `attempts <= 1` → single primary "Reauthorize with Tesla".
  - `attempts >= 2` → also reveal:
    - **Continue anyway** (you may need to reconnect later) → sets `degraded_no_refresh=true` on the profile for a future gentle nudge; advances to device-selection.
    - **Skip Tesla for now** → uses existing `skip()` handler.
- `TeslaScopeRecovery` props: `noRefreshTokenAttempts: number`, `onContinueAnyway?`, `onSkip?`.

## Branded apex splash — paint immediately

Two layers, so the "Connecting your Tesla…" moment is never blank:

- **Static pre-React fallback** in `index.html`: if the page loads with `pathname === '/oauth/callback'` and the URL has `?state=` but no `?hopped=1`, render an inline branded splash (logo + copy) inside `#root` via a tiny inline script. React unmounts it on hydrate. Keep it dependency-free and inline so it paints before the SPA bundle loads.
- **React layer** in `src/pages/OAuthCallback.tsx`: render `<BrandSplash message="Connecting your Tesla…" />` on the very first render, before any effect fires. `lookup-return-to`, the hop, and the token exchange all happen underneath the splash. Diagnostics still write to the ring buffer.

## Callback route reachable on every apex host

Confirm `/oauth/callback` resolves and returns the SPA on both `zensolar.com` and `zen.solar`. `App.tsx` mounts the route unconditionally; both hosts are in the custom-domain list. Verified in build mode.

## Cohort-analysis reference

Add `docs/tokenomics/granted-scope-shape.md` describing the `energy_tokens.extra_data` JSON contract (`granted_scope`, `granted_at`, `has_refresh_token`, optional `no_refresh_token_attempts`, optional `degraded_no_refresh`). Comment above the upsert in `tesla-auth/index.ts` points to that doc.

## Out of scope

Dashboard redesign, tokenomics changes, virtual key pairing, CDN-level 302 for `/oauth/callback`.

## Verification checklist (after build mode)

- `get-auth-url` URL contains `require_requested_scopes=false&prompt_missing_scopes=true`.
- Fresh incognito → uncheck Vehicle Location on Tesla → recovery lists only Vehicle Location; "Continue without it" advances to device-selection.
- Fresh incognito, all boxes checked, vehicles present → device-selection appears; `snapshot` renders once telemetry lands.
- Simulate two consecutive no-refresh exchanges → escape buttons appear on second recovery view. Then simulate a successful refresh-token exchange → counter is back at 0 (verified via psql).
- Energy-only Tesla account → energy-only success screen; empty account → empty screen; asleep + energy live → split copy.
- Let state row expire (> 10 min) → "This link expired" screen restarts OAuth on beta.
- **Callback route reachability** — use GET, not HEAD, because SPAs are picky:
  `curl -s -o /dev/null -w "%{http_code}\n" https://zensolar.com/oauth/callback`
  `curl -s -o /dev/null -w "%{http_code}\n" https://zen.solar/oauth/callback`
  Both must return `200`.
- **Hop happens exactly once, on beta**: run through the flow with devtools open on both apex and beta tabs; `window.__oauthDiag('dump')` on the beta tab must show one `callback:hop` entry with `hopped=1` set on the destination URL, and the `exchange-code` call must appear only in the beta-tab log (never in the apex-tab log).
- Branded splash paints on apex before React hydrates (throttle CPU in devtools and confirm no blank frame between paint and hop).
