# Backfill Enphase Devices for OAuth-Connected Users

## Problem

Michael Tschida has `profiles.enphase_connected = true` (OAuth token stored) but **zero Enphase rows in `connected_devices`** — only his Wallbox. Every SSOT consumer (`useSolarTelemetry`, `pickSource('solar', …)`, `LiveEnergyMonitoringCard`) reads `connected_devices`, so his Envoy/Enphase production silently disappears from the live energy flow. He currently renders as a Wallbox-only user (`ChargerOnlyLiveCard`).

Root cause: `enphase-auth` stores the OAuth token, then the UI is supposed to call `enphase-devices` → user picks systems → `claim-devices` inserts. Tschida never completed that selection step (likely because his account predates that screen).

## Fix — two parts

### 1. New edge function: `enphase-backfill-devices`

Server-side, idempotent, callable two ways:
- **Self-serve**: any authenticated user can POST `{}` and it backfills their own account.
- **Admin batch**: founder/admin can POST `{ user_ids: [...] }` (or `{ all_missing: true }`) to backfill many users.

Logic per user:
1. Read `energy_tokens` row where `provider='enphase'`. Skip if missing.
2. Call Enphase `/systems` with the stored access token (refresh if expired — reuse the same refresh logic that `enphase-data` uses).
3. For each returned system, `upsert` into `connected_devices` with:
   - `provider='enphase'`, `device_type='solar_system'`, `device_id=String(system_id)`, `device_name`, `device_metadata` (matching the shape `enphase-devices` already produces), and `baseline_data={ captured_at: now }`.
   - Skip if already claimed by another user (don't steal).
4. Ensure `profiles.enphase_connected=true` (defensive).
5. Return `{ user_id, claimed: [...], skipped_already_claimed: [...], errors: [...] }`.

Reuse existing `enphase-devices` Enphase fetch code; do not introduce new auth/refresh paths.

### 2. Admin trigger UI

Add a single button on `/admin` (or wherever device-ops live) labeled **"Backfill Enphase device rows"** that calls the function with `{ all_missing: true }` and shows a toast with results. No new pages.

### 3. One-shot run for Tschida

After the function deploys, invoke it once with `{ user_ids: ['2827d5b3-fbc6-4f3a-8369-ccc0116b6735'] }` so his live flow lights up immediately. Verify via:
```sql
SELECT provider, device_type, device_id, device_name
FROM connected_devices
WHERE user_id='2827d5b3-fbc6-4f3a-8369-ccc0116b6735';
```
Expect at least one `enphase / solar_system` row.

## Out of scope (explicitly)

- Enphase **IQ Battery** discovery — Tschida doesn't have one; tackle separately if/when a battery user surfaces this.
- The diagnostic-surface option (banner says "Enphase linked but no devices"). The new `OemDiagnosticsBanner` will naturally start passing for these users once devices exist, so the banner work isn't needed here.
- Touching `enphase-devices` / `claim-devices` — they keep their interactive role for new onboarding.

## Files

- **New**: `supabase/functions/enphase-backfill-devices/index.ts`
- **Edit**: `src/pages/Admin.tsx` (or nearest admin device-ops surface) — add the backfill button + handler.
- **No** schema migration required (`connected_devices` already supports these rows).

## Verification

1. SQL above shows the Enphase row exists for Tschida.
2. Loading his account in admin view-as mode renders the rich `EnergyFlowScene` (solar node + Wallbox), not `ChargerOnlyLiveCard`.
3. `OemDiagnosticsBanner` no longer flags "Enphase token without device" for him.
