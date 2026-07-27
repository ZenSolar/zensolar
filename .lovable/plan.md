
## Scope
Harden OAuth → list → claim → first-proof → persistence for beta invites across Tesla, Enphase, SolarEdge, Wallbox. No dashboard redesign, no tokenomics changes, no genesis-mint work. Lifetime-baseline logic stays.

## Phase 1 — Audit (read-only)
Trace each OEM through `useEnergyOAuth`, provider `-auth` / `-devices` / `-data` edge functions, `claim-devices`, `OAuthCallback.tsx`, and beta screens (`BetaTesla`, `BetaSolar`, `BetaCharger`, `EnergyConnectionScreen`, `DevicePairingScreen`). For each: Connect CTA → callback → tokens under correct `user_id` → device list → claim rows → first-proof data → persistence after refresh/logout → reconnect → disconnect → honest failure states. Deliverable: PASS/FAIL table with exact failure line per OEM.

## Phase 2 — Fixes (only where audit shows a real defect)

### Tesla (priority 1)
- Verify multi-vehicle discovery/claim renders every VIN + energy product from `tesla-devices`, pre-checked, uncheck allowed; single `claim-devices` call handles the array with per-item error capture (no first-failure abort).
- Sleeping vehicle: baseline claim still writes the row; show "vehicle asleep — data will appear once it wakes" on the summary.
- Virtual-key pairing must not block other device claims — move pairing to a per-vehicle chip on the post-claim summary, not a full-screen blocker.
- `OAuthCallback` returns user to the in-progress claim step, not `/`. Tesla redirect stays pinned to `https://zensolar.com/oauth/callback`.
- Post-claim: fire a single `tesla-data` invocation so the KPI tile isn't empty for the cron interval.

### Enphase (priority 2)
- Verify systems list renders and multi-system claim works; per-item errors surfaced.
- Preserve shipped Enphase cadence (daily rewards + on-demand live production; no aggressive polling).
- Post-claim: one on-demand `enphase-data` call for first proof.

### SolarEdge (priority 3) — honesty pass
- Confirm actual auth mechanism in `solaredge-auth`. If installer API key rather than user OAuth, relabel the Connect CTA to "Connect with API key," show exact steps + where to paste, validate the key against at least one site before flipping `solaredge_connected=true`. Do not present as clean OAuth if it isn't.

### Wallbox (priority 4) — explicit consent + validated connect + disconnect
- New pre-form consent screen in `WallboxConnectDialog.tsx` (or a prior step), copy:
  - "To keep your Wallbox connected, ZenSolar stores your Wallbox email and password on our servers so we can refresh your access token when it expires."
  - "Credentials are stored server-side only, encrypted at rest, and never exposed to the app or shared with third parties."
  - "You can disconnect Wallbox at any time from Settings, which permanently deletes the stored credentials."
- Explicit "I understand and consent" checkbox required before password field is enabled.
- Rewrite `src/pages/beta/BetaCharger.tsx` Wallbox path: replace "coming soon" stub with the real consent → connect flow, keep skip.
- `wallbox-auth` already validates against Wallbox and only sets the profile flag after token verification — keep. Ensure any failure path leaves `wallbox_connected=false`. Replace the "we never store your password" copy in the dialog with the accurate server-side-only credentials copy above.
- Post-connect: invoke `wallbox-data` (or list-chargers) once to populate at least one charger's status/reading so Clean Energy Center / monitoring shows charging activity for the non-Tesla EV household. If no chargers found, show honest "connected, no chargers detected — check your Wallbox account" state and do NOT flip `wallbox_connected=true`.
- Disconnect path: extend the shared disconnect flow (below) to Wallbox — deletes `energy_tokens` row (which wipes stored credentials), removes `connected_devices` rows for `provider='wallbox'`, flips `wallbox_connected=false`. Surface in Settings/Profile.

### Cross-OEM
- `already_claimed` rows surface with "Claimed by another account — contact support" copy.
- Add a `disconnect-device` edge function (or extend admin path) usable for any provider: delete matching `connected_devices`, flip `<provider>_connected=false` when no rows remain, purge `energy_tokens` for that provider on full disconnect. Wire into Profile/Settings for Tesla, Enphase, SolarEdge, Wallbox.
- Post-claim first-proof kick for every provider.

## Phase 3 — Multi-device claim UX
Only if audit shows current screens don't meet spec: pre-checked list with uncheck, single confirm, single `claim-devices` call, per-row result screen (claimed / skipped / already-claimed / errored) with honest copy.

## Phase 4 — Verification (Playwright + read_query)
- `joe@zen.solar`: walk Tesla connect on preview, confirm VINs list, claim all, verify `connected_devices` rows + KPI populates within ~60s of first `tesla-data` invocation.
- Enphase claim sanity check on existing connected account.
- SolarEdge: render-only verification of honest connect states.
- Wallbox: sandbox-safe render-only verification of consent gate + disconnect UX. Live end-to-end validated connect + first-charger-reading confirmed against a real Wallbox account (`joe@zen.solar`'s or documented as pending if none available), with screenshot of Clean Energy Center showing the charger's status/reading for the non-Tesla EV scenario.
- Refresh + logout/login: assert claims persist and dashboard shows real data.
- Report per-OEM PASS/FAIL, what was fixed, what remains blocked (including support-risk gaps and whether multi-vehicle claim + claimed-only eligibility both hold).

## Explicitly out of scope
Dashboard visual redesign, tokenomics changes, founding-cohort genesis mint, changing lifetime-baseline logic.

## Final reply on completion
"Device connect reliability pass complete — Tesla/Enphase/SolarEdge/Wallbox connection paths verified and hardened for beta invites."
