---
name: FSD Miles ingestion pipeline (hybrid HW3 + HW4)
description: Hybrid Tesla FSD miles — official SelfDrivingMilesSinceReset (HW4) + adaptive-polling sampler (HW3) → energy_production(fsd_miles) → useDashboardData
type: feature
---
FSD miles are populated via TWO complementary paths. They are NEVER summed —
the resolver picks one source per VIN and tags it via `connected_devices.last_known_state.fsd_source`.

## Primary path — Official (HW4 + recent firmware)
Tesla's `SelfDrivingMilesSinceReset` field (a.k.a. `self_driving_miles_since_reset`)
is read whenever it appears in `vehicle_state`. Three writers honor it:
1. `tesla-telemetry-webhook` — when Fleet Telemetry emits the field (mapped to
   `SelfDrivingMilesSinceReset` / `FSDMilesSinceReset` events).
2. `tesla-data` — opportunistically each dashboard refresh.
3. `tesla-fsd-sampler` — also checks each poll and prefers official when present.

All three set `last_known_state.fsd_source = 'official'` and tag
`proof_metadata.source = 'official'` on the resulting `energy_production` row.

## Fallback path — Calculated for HW3 (`tesla-fsd-sampler`)
`supabase/functions/tesla-fsd-sampler` runs every 5 min via pg_cron. Per VIN
it applies adaptive cadence (see `_shared/fsdSampler.ts → nextPollIntervalSec`):
- active driving (Drive + moving): poll every 5 min
- idle/awake:                      poll every 30 min
- asleep/offline:                  poll every 6 h (NEVER force-wakes)

It calls `/vehicles/{id}/vehicle_data?endpoints=vehicle_state;drive_state`
and credits an odometer delta to `lifetime_fsd_miles_calc` ONLY when:
- previous sample had `autopilot_state ∈ {Active, Engaged, FullSelfDriving, Autosteer, TrafficAwareCruiseControl}`
- current `shift_state === 'D'`
- current `speed > 0`
- delta ∈ (0, 5 mi] (glitch cap)

Live HW3 fallback: Tesla Fleet REST may return odometer while omitting
`autopilot_state`, `shift_state`, and `speed`. In that case, if the odometer
advanced since the previous sample, `tesla-fsd-sampler` tags the sample as
`InferredDriveMoving`, credits the odometer delta, and writes
`proof_metadata.autopilot_inferred = true` with `sampler_reason = 'credited_inferred'`.
This keeps live FSD drives from dropping to zero when Tesla withholds the REST
engagement flag; official HW4 / telemetry fields still win whenever present.

Skipped if `fsd_source='official'` was set in the last 7 days (avoids waste).

## Shared helpers — `supabase/functions/_shared/fsdSampler.ts`
`extractOfficialFsdMiles`, `extractAutopilotState`, `applyOdometerSample`,
`resolveFsdMiles`, `nextPollIntervalSec`. Used by sampler + webhook.

## Resolver
`resolveFsdMiles(official, samplerState)`:
- official present and > 0 → `{ miles: official, source: 'official' }`
- otherwise              → `{ miles: lifetime_fsd_miles_calc, source: 'calculated_hw3' }`

## State shape on `connected_devices`
- `lifetime_totals.lifetime_fsd_miles` — published cumulative (already gates Proof-of-Delta)
- `last_known_state.fsd_accumulator`   — webhook stream accumulator
- `last_known_state.fsd_sampler`       — poll-based HW3 accumulator (`FsdSamplerState`)
- `last_known_state.fsd_source`        — `'official' | 'calculated_hw3'`
- `last_known_state.fsd_source_meta`   — `{ first_sample_at, last_source, last_updated_at }`
- `last_known_state.last_shift_state`  — drives next-poll cadence
- `last_known_state.last_speed_mph`    — drives next-poll cadence
- `baseline_data.fsd_baseline_miles`   — Proof-of-Delta baseline (untouched by sampler)

## Dashboard surface
`tesla-data.totals` now exposes `fsd_source` and `fsd_since` alongside
`fsd_supervised_miles` / `pending_fsd_supervised_miles`. `useDashboardData`
maps them to `ActivityData.fsdSource` and `ActivityData.fsdSinceDate`. The
Clean Energy Center FSD tile renders a sub-label:
- official → "Tesla verified · since {Mon D, YYYY}"
- HW3      → "Calculated for HW3 · since {Mon D, YYYY}"

Tile layout, mint flow, 1:1 ratio, and Proof-of-Delta invariants unchanged.

## Cron registration (run once via SQL editor — service-role required)
```sql
select cron.schedule(
  'tesla-fsd-sampler-every-5min',
  '*/5 * * * *',
  $$ select net.http_post(
       url:='https://<PROJECT_REF>.supabase.co/functions/v1/tesla-fsd-sampler',
       headers:='{"Content-Type":"application/json","apikey":"<ANON_KEY>"}'::jsonb,
       body:='{}'::jsonb
     ); $$
);
```

## Invariants
- 1:1 mint ratio preserved (1 FSD mile = 1 $ZSOLAR).
- FSD miles are a SUBSET of EV miles — never summed into `evMiles`
  (`chargingSplitInvariants.test.ts`).
- Tesla-only (`pickSource('fsd_miles', …)`).
- Sources never summed — resolver picks one per VIN.
