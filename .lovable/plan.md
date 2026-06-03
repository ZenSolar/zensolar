## Scope

Build only (2) backup-time estimator and (3) Outage Mode UI panel. No detection hook, no EnergyFlowScene changes.

## Files

**New: `src/lib/gridOutage.ts`** (estimator only — detection lands later in same file)

- `estimateBackupTime({ socPct, usableCapacityKwh, currentDischargeKw, reservePct = 20 }) → { hours, label }`
- Smooth discharge via a small module-level rolling buffer (last 5 samples, exponential weight) exposed through `estimateBackupTime` so callers don't manage state. Optional `smoothingKey` param so different battery sources keep separate buffers.
- Edge cases:
  - `socPct <= reservePct` → `{ hours: 0, label: "Reserve reached" }`
  - `currentDischargeKw < 0.05` (idle/charging) → `{ hours: Infinity, label: ">24 hours" }`
  - `hours > 24` → `">24 hours"`
  - `hours >= 1` → `~Xh` or `~Xh Ym` when minutes ≥ 15
  - `hours < 1` → `~N min` (rounded to nearest 5)
- Pure, deterministic given the smoothing buffer; exported helpers `formatBackupLabel(hours)` and `_resetBackupSmoothing()` for tests.

**New: `src/components/dashboard/OutageModePanel.tsx`** (presentational, no data fetching)

Props:
```ts
{
  socPct: number;
  usableCapacityKwh: number;
  dischargeKw: number;        // kW from battery to home
  reservePct?: number;        // default 20
  outageStartedAt: Date | string;
  solarProducingKw?: number;  // if > 0.1, show solar recharge footer
  className?: string;
}
```

Layout (dark theme, teal accents, calm — no red alarms):
- Top banner: subtle teal/amber border, icon + "Grid Outage Active", right-aligned "Since 7:42 PM" (formatted from `outageStartedAt`).
- Hero: large backup-time label from `estimateBackupTime(...)`, secondary "Estimated backup remaining".
- Metric row: "`0.4 kW` from Battery" (large numeric, muted unit).
- SOC chip: `{socPct}% • Providing Backup Power` with battery icon; color shifts to amber when within 10pp of reserve.
- Progress bar: `value = dischargeKw`, `max = maxBackupKw` (derived as `max(dischargeKw * 1.5, 5)` so the bar isn't pinned; label "Current load vs backup capacity").
- Footer (only if `solarProducingKw > 0.1`): muted "Solar will recharge the battery when available."

Uses existing tokens (`bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-primary` for teal). No new colors. Uses `Progress` from `@/components/ui/progress` and `lucide-react` icons (`BatteryCharging`, `AlertTriangle`, `Sun`).

**Edit: `src/components/dashboard/LiveEnergyMonitoringCard.tsx`**

- Import `OutageModePanel`.
- Accept new optional prop `outage?: { active: boolean; startedAt: Date | string }` (default undefined → normal view).
- When `outage?.active === true`, render `<OutageModePanel ... />` inside the card body in place of the normal flow scene, passing battery telemetry already available in the component (SOC, capacity, discharge kW, solar kW). Card header/title unchanged.
- No behavior change when `outage` is omitted — fully backward compatible. Detection wiring is deferred.

## Tests

**New: `src/test/gridOutage.test.ts`** — covers reserve reached, idle (Infinity label), >24h, ~Xh, ~Xh Ym, sub-hour minutes rounding, smoothing reduces jitter across successive calls with `_resetBackupSmoothing()` between cases.

**New: `src/test/OutageModePanel.test.tsx`** — renders banner + label + SOC chip + "from Battery" metric; shows solar footer only when `solarProducingKw > 0.1`; uses amber chip near reserve.

## Out of scope (next step)

- `useGridOutage` detection hook and `detectTeslaOutage`
- EnergyFlowScene `isOutage` styling
- Auto-wiring `outage` prop from telemetry in `LiveEnergyMonitoringCard` (still passed in by parent for now)
