---
name: FSD Miles ingestion pipeline
description: Tesla Fleet Telemetry stream → tesla-telemetry-webhook → energy_production(data_type=fsd_miles) → useDashboardData
type: feature
---
Real FSD miles come from Tesla Fleet Telemetry streaming, NOT polling (no `SelfDrivingMilesSinceReset` field exists).

Pipeline:
1. `tesla-telemetry-config` (per-VIN, one-shot, re-run on drift) POSTs Fleet Telemetry config: AutopilotState, AutosteerCmd, Gear, Odometer, VehicleSpeed @ 1Hz → webhook.
2. `tesla-telemetry-webhook` (verify_jwt=false, validates Tesla JWS via `TESLA_TELEMETRY_PUBLIC_KEY` or shared-secret `TESLA_TELEMETRY_SHARED_SECRET`) updates `connected_devices.last_known_state.fsd_accumulator` and writes cumulative `data_type='fsd_miles'` rows with Proof-of-Delta metadata. Engaged states: Active/Engaged/FullSelfDriving/Autosteer/TrafficAwareCruiseControl. Glitch cap: 5 mi/event.
3. `tesla-fsd-backfill` seeds `lifetime_fsd_miles=0` only — no historical AutopilotState exists, so any estimate would break Proof-of-Delta.
4. `tesla-data` reads `lifetime_fsd_miles` + `baseline_data.fsd_baseline_miles` and exposes `pending_fsd_supervised_miles` in totals payload (NEVER overwrites accumulator).
5. `useDashboardData` surfaces `fsdSupervisedMiles` / `pendingFsdSupervisedMiles` in both fast and slow paths.

Invariants: 1:1 mint ratio. FSD miles are a SUBSET of EV miles — never summed into `evMiles` (test in `chargingSplitInvariants.test.ts`). Tesla-only via `pickSource('fsd_miles', …)`.

`tesla-telemetry-config` + `tesla-fsd-backfill` are invoked fire-and-forget from `DeviceSelectionDialog` immediately after a Tesla vehicle is claimed.
