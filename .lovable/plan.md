## FSD Miles KPI — Plan

Add **FSD Miles** as a first-class verified KPI alongside Solar kWh, Battery Export, EV Miles, and Supercharging. Mints **1:1** (1 FSD mile = 1 $ZSOLAR), consistent with the locked mint-ratio SSOT. Sourced from Tesla Fleet telemetry streaming (Autopilot engagement + odometer delta), not from a non-existent `SelfDrivingMilesSinceReset` field.

### 1. Data model (migration)

- New `data_type` value: `fsd_miles` in `energy_production` (no schema change — column is text). Tesla writes rows with `data_type='fsd_miles'`, `kwh` field reused to store cumulative FSD miles (matches how `ev_miles` already uses the column).
- Extend `connected_devices.metadata` optional field `fsd_enabled` (no migration — JSONB).
- Extend `WATERMARK_NUMERIC_KEYS` in `src/lib/mintReconciliation.ts` with `fsd_miles` and `lifetime_fsd_miles` so Proof-of-Delta baseline≤lifetime invariants cover it.
- No new table needed. No new RLS.

### 2. Ingestion (Tesla telemetry streaming)

In `supabase/functions/tesla-data/index.ts` (and the streaming consumer if separate):
- Subscribe to / poll `vehicle_data` for `drive_state.shift_state`, `vehicle_state.odometer`, and the Autopilot fields available in `vehicle_state` (`autopark_state_v3`, `autopilot_state`) plus the Fleet Telemetry stream fields `AutopilotState` / `AutosteerCmd`.
- Maintain a per-vehicle in-memory accumulator: when `AutopilotState ∈ {Active, Engaged}` (FSD/Autosteer on), credit the odometer delta to `fsd_miles`. When disengaged, do not credit.
- Persist cumulative `fsd_miles` to `energy_production` (same cumulative-delta pattern as `ev_miles`) and to `connected_devices.last_known_state.lifetime_fsd_miles`.

### 3. Source-of-truth + KPI hooks

- `src/lib/dataSourcePriority.ts`: add `'fsd_miles'` capability, Tesla-only.
- `src/hooks/useDashboardData.ts`: add `fsdMiles` (cumulative odometer-delta math, same as `ev_miles`).
- `src/hooks/useEnergyLog.ts`: add an `FSD` tab mirroring the EV-miles math; update `mem://features/energy-log-kpi-parity.md` row table.
- `src/hooks/useKpiContributions.ts`: add FSD contribution slice.

### 4. Proof-of-Delta + mint pipeline

- `supabase/functions/mint-onchain/index.ts`: add `fsd_miles` to the categories iterated (same `verifyMintProof` call, 1:1 ratio, baseline-vs-lifetime watermark, three-way reconciliation).
- `src/lib/dailyMintBreakdown.ts` and `src/lib/originVerification.ts`: include FSD as a verifiable origin source.
- Mint receipts (`RecentMintProofs.tsx`, `useLatestMintReceipt.ts`): render FSD miles 1:1 (no `* 10`, no `/ USER_SHARE`).

### 5. UI

**Homepage showcase** — `src/components/home/CleanEnergyCenterShowcase.tsx`:
- Add a 5th KPI card: `FSD Miles` · icon `Sparkles` or `Navigation` · sample value (seeded, consistent with existing showcase pattern).
- Rebalance: the four-card list becomes five; spacing stays vertical-stack on mobile (no grid change needed since current layout is already a single column of `motion.button` rows).

**Live dashboard** — Clean Energy Center on `/dashboard`:
- Add a `MetricCard` (tone `accent`) for FSD Miles, wired to `useDashboardData().fsdMiles`.
- Add to the Tap-to-Mint pending breakdown so FSD miles count toward "X ready to mint".

### 6. Tests

- Extend `src/lib/__tests__/mintReconciliation.test.ts` with an FSD fixture (1:1 ratio, baseline≤lifetime).
- Extend `src/__tests__/chargingSplitInvariants.test.ts` style coverage for FSD (no double-count with `ev_miles`: FSD miles are a SUBSET of EV miles, so dashboard headlines must not sum them — show FSD as a sub-metric, not added to total miles).

### 7. Memory updates

- Append FSD row to `mem://features/energy-log-kpi-parity.md` (Tesla-only, cumulative delta math).
- Add note to `mem://features/mint-ratio-ssot.md`: "1 FSD mile = 1 $ZSOLAR; FSD miles are a subset of EV miles, never summed into EV-miles total."

### Out of scope

- No changes to Live Energy Monitoring card.
- No Deason changes.
- No new on-chain contract; reuses existing $ZSOLAR mint path.

### Open caveat

Tesla Fleet Telemetry streaming requires the `vehicle_device_data` scope (already granted) plus an active streaming subscription. If a user hasn't enabled streaming, FSD miles will read `0` and the card will display "Awaiting Tesla telemetry stream" — same fallback pattern as today's empty-state cards.
