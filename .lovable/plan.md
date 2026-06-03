## Phase 3: Detection + EnergyFlowScene outage styling + full wiring

Builds on Phase 2 (estimator + `OutageModePanel` already shipped).

## 1. Detection — extend `src/lib/gridOutage.ts`

Add (preserves existing `estimateBackupTime` exports):

- `type OutageSource = 'tesla' | 'enphase' | 'solaredge' | 'unknown'`
- `detectTeslaOutage(payload: unknown): boolean`
  - True when `grid_status` ∈ `{ "OffGrid", "Islanded", "Inactive" }` (case-insensitive, also handles `island_status === "on_grid" | "off_grid"`).
  - Fallback heuristic: `grid_power` ≈ 0 AND battery discharging (`battery_power > 0` in Tesla convention) AND `load_power > 0.1 kW`. Used only when explicit `grid_status` is missing.
- `useGridOutage({ debounceMs = 45_000 } = {})` hook in a new `src/hooks/useGridOutage.ts`:
  - Reads `useBatteryTelemetry()` (Tesla payload lives on the battery telemetry row for Tesla Energy sites).
  - On every telemetry change, evaluates `detectTeslaOutage(primaryBattery?.payload)`.
  - Tracks `firstSeenAt: number | null` in a ref. Flips `isGridOutage = true` only after the off-grid signal has been continuously true for ≥ `debounceMs`. Clears immediately on recovery.
  - Returns `{ isGridOutage: boolean, since: Date | null, source: OutageSource }`.
  - Designed for OR-composition later: function signature `combineOutageSignals(...signals)` exported as a stub for Enphase/SolarEdge to hook into.

## 2. `EnergyFlowScene` — outage prop + visual treatment

Add `isOutage?: boolean` to `EnergyFlowSceneProps`. When `true`:

- **Grid meter**: muted red/amber halo (`AMBER` low-intensity) replaces sky/cyan; new tiny SVG `<g>` overlay draws an `×` glyph over the grid meter; `home-grid`/`grid-home` flows are suppressed (force-removed from `flows` set after `pickPrimaryFlows`).
- **Grid label (br)**: text becomes `Grid Offline`, sub `Disconnected`, accent `'muted'`, active=false, value greyed.
- **Battery → Home flow** becomes hero:
  - Force `pw-home` into `flows` whenever `battery < -0.05` (or even when 0 but home is drawing — show a low-intensity standby pulse so the visual story is unambiguous).
  - Render an additional thicker glow stroke under the existing `DottedFlow` (`<path d={BLUEPRINT_PATHS.powerwallToHome} stroke="hsl(38 95% 60% / 0.45)" stroke-width="1.4" filter="blur(1.2px)"/>`) plus a faster pulse (`pulseMs` halved on the Powerwall halo).
  - Powerwall halo color forced to `AMBER` with `radius` bumped (4.6 → 5.4) and `intensity` floored at 0.7.
- **Solar flows**: unchanged when `solarProducing` — keep `solar-home` and `solar-pw` lines. They remain emerald.
- **Tesla vehicle**: render parked, suppress charging glow (`chargingAtHome` short-circuits to false in outage), no warm garage bloom.
- **Home label**: sub becomes `On Backup` (amber) when outage and home is drawing.

All other coordinates and existing assets untouched — the outage view is the same scene with overrides.

## 3. Wire into `LiveEnergyMonitoringCard`

- Replace the stub `outage` prop wiring (currently `{ active, startedAt }` passed by callers) with internal detection:
  - Call `useGridOutage()` inside the component.
  - Build `outage = { active: isGridOutage, startedAt: since ?? new Date() }` locally.
  - Keep the optional `outage` prop as an **override** for testing/demo (`outage ?? autoOutage`).
- Render in the same cockpit slot we already added: `OutageModePanel` replaces the `EnergyFlowScene` block. **Refinement:** keep the scene rendered above the panel in a small inset preview (≈ 38% height) so the user still sees the live diagram with grid-offline styling, with `OutageModePanel` stacked below. Order:
  1. Banner (in panel)
  2. Compact `EnergyFlowScene` with `isOutage` (rounded inset)
  3. Hero estimate + metrics + progress (from panel)
- Smooth transition: wrap the swap in a 250ms opacity/translate fade using a tiny CSS class (no framer-motion dep needed); CSS variables already support it.

### OutageModePanel polish

- Replace ad-hoc progress label with the card-style metric tile header treatment (matches `MetricTile` typography in `LiveEnergyMonitoringCard`).
- Progress bar: cap `maxBackupKw` at a sensible household ceiling — `Math.max(5, dischargeKw * 1.5, usableCapacityKwh * 0.4)` — so the bar reflects real backup capacity, not just current load.
- Footer rules:
  - Solar producing > 0.1 kW → "Solar will recharge the battery when available." (existing).
  - SOC within 10pp of reserve → amber tone + add second line "Approaching reserve — non-essential loads will reduce automatically." (only when applicable).
  - Otherwise → existing calm copy.
- Banner timestamp uses relative form when < 1h ("Since 7:42 PM · 12 min ago").

## 4. Tests

- Extend `src/test/gridOutage.test.ts` with `detectTeslaOutage` cases: `OffGrid`, `Islanded`, `Inactive`, mixed casing, fallback heuristic, normal grid (`grid_status: "Active"`) → false.
- New `src/test/useGridOutage.test.tsx` (jsdom) using a mocked `useBatteryTelemetry`: verifies debounce (no flip before threshold, flips after, clears instantly on recovery).
- Smoke render of `EnergyFlowScene` with `isOutage` to confirm grid flows are removed and "Grid Offline" label renders.

## Out of scope

- Enphase / SolarEdge detection (interfaces ready, detectors stubbed).
- Push notifications, Deason proactive suggestions, outage history.
- Auto-recovery messaging beyond label state flip.
