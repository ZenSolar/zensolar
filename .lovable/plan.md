# Fix: Enphase "producing now" stuck at 0 kW

## Problem
Tschida's Live cockpit shows `0.00 kW producing now` at 3:45 PM in full sun, even though Enphase reports 60.3 kWh produced today and the card refreshed 33s ago. Lifetime + today totals are correct; only the instantaneous wattage is wrong.

## Root cause
`enphase-data` (telemetry mode, lines 269–295) reads `current_power` from Enphase's `/systems/{id}/summary` endpoint. That endpoint updates only every ~15 minutes and routinely returns `0` between refreshes — it is not a real-time feed. We see the same behavior on Joseph's account intermittently; it has just been more visible on Tschida today because nothing else is masking it.

## Fix
In `supabase/functions/enphase-data/index.ts`, telemetry branch (`mode: 'telemetry'`, `capability: 'solar'`):

1. Call `/systems/{id}/telemetry/production_micro?granularity=5mins&start_at=<now-30min>` first.
2. Take the **last interval with `enwh > 0`** and compute `current_power_w = round(enwh * 12)` (5-min Wh × 12 = avg W over that interval). This is what the Enphase app itself shows.
3. If that endpoint returns 429 / empty / fails, fall back to the existing `/summary` `current_power` value (current behavior) so we never regress.
4. Keep `energy_today_wh` / `lifetime_energy_wh` sourced from `/summary` (those fields are accurate there).
5. Add `sample_at` from the chosen interval's `end_at` so `useDeviceTelemetry.extractSampleAt` picks it up and the "Updated Ns ago" pill reflects the real sample time, not the cache write.

No client changes needed — `SolarPlusCard` and `LiveEnergyMonitoringCard` already read `current_power_w` first.

## Cache
Solar telemetry TTL is already 60s (`useDeviceTelemetry`). Leave as-is — `production_micro` is rate-limit friendly when called once per minute per system.

## Verification
- `supabase--curl_edge_functions` POST to `enphase-data` with `x-target-user-id` = Tschida + `{ mode: 'telemetry', capability: 'solar', siteId: <his envoy id> }` and confirm `current_power_w > 0` while sun is up.
- Ask Tschida to pull-to-refresh; tile should show real kW.
- Smoke-check Joseph too (he has same code path) — make sure we don't regress when his summary is fresh.

## Out of scope
- No tokenomics, mint, or UI changes.
- No schema / migration.
- SolarEdge + Wallbox live wattage gaps remain (tracked separately in `live-energy-flow-beta-access.md`).
