## Add Flywheel Forecasting + Secondary Revenue Streams to `/founders/simulator`

Additive refinement — no existing functionality removed.

### 1. Engine changes — `src/lib/founderSimulator.ts`

Extend `SimulatorConfig`:
```ts
secondaryRevenue: {
  enabled: boolean;
  monthlyUSD: number;          // projected $/mo from Deason AI, VPP, data sales, carbon credits
  allocationMode: "percent" | "fixed";
  allocationPct: number;       // 0..100 (when mode = percent)
  allocationFixedUSD: number;  // $ (when mode = fixed)
  priorityBeforeBuyback: boolean; // use this before tapping treasury for defense
  growthRatePerMonth: number;  // optional compounding, default 0
}
flywheelWindowMonths: number;  // default 3 (replaces selfSustainingWindowMonths default)
```

Per-month loop additions:
- Compute `secondaryUSD` (with optional compounding) and inject into `lpUSDC` after transfer-tax recycle.
- If `priorityBeforeBuyback` and `secondaryUSD` lifts price above `defenseFloorPrice`, skip/reduce buyback.
- Track `secondaryInjectedUSDC` per snapshot.
- Self-sustaining detection: positive `netLPChangeUSDC` (excluding tranche injections — secondary revenue counts as organic) for `flywheelWindowMonths` consecutive months.

New result fields:
- `selfSustainingMonthBaseline` — recomputed with `secondaryRevenue.enabled=false` (run engine twice internally to derive the "months saved" KPI).
- `monthsSavedBySecondary` — `selfSustainingMonthBaseline − selfSustainingMonth` (null-safe).
- `flywheelStrength`: `"Weak" | "Building" | "Strong" | "Self-Sustaining"` derived from rolling 3-mo net LP growth vs. monthly sell USDC at horizon end.

Per-`MonthSnapshot`: add `secondaryInjectedUSDC`.

### 2. UI changes — `src/pages/FoundersSimulator.tsx`

**A. New input card — "Secondary Revenue Streams"** (after Treasury Defense):
- Toggle: Include Secondary Revenue in LP
- Number: Monthly projected revenue (USD)
- Radio: Allocation mode (% of revenue / fixed $)
- Number: % or $ amount (conditional)
- Optional: monthly growth rate %
- Toggle: Use before treasury buyback
- Helper copy listing example streams (Deason AI, VPP, utility data, carbon credits)

**B. New prominent output section — "Flywheel Health & Self-Sustaining Forecast"** (above charts):
- Big KPI: Self-Sustaining Month (e.g. "Month 14 — Mar 2027")
- Strength badge: Weak / Building / Strong / Self-Sustaining (teal accent gradient by tier)
- KPI: "Months saved by secondary revenue" (delta with arrow)
- Explanatory card: "This is the point where organic LP growth from subscriptions + secondary revenue consistently exceeds sell pressure. No further external capital injections should be needed after this month."

**C. Real-time KPI panels strip** (top of outputs):
- Tokens Issued (circulating)
- Total Burned
- Locked Supply (staked + LP-locked)
- Runway Remaining (months of tranches left)
- Self-Sustaining? (badge)

**D. Chart updates:**
- LP Depth chart: add `ReferenceLine` at self-sustaining month with label "Self-Sustaining Flywheel Begins".
- New chart: "Secondary Revenue Contribution to LP" — stacked area (tranche / transfer-tax / secondary / buyback) per month.
- Net LP Growth chart: stack secondary revenue as a distinct band.

**E. "How it works" section update**: add bullets explaining self-sustaining definition, flywheel-strength formula, and secondary-revenue allocation/priority logic.

### 3. Files touched
- `src/lib/founderSimulator.ts` — extend types, engine, run-twice for baseline.
- `src/pages/FoundersSimulator.tsx` — new input card, KPI strip, flywheel section, chart additions, How-it-works copy.
- (No new files, no route changes, no backend, no migrations.)

### 4. Out of scope
- No changes to `tokenomics.ts` v3.1 constants.
- No backend persistence — scenarios still local-only.
- No nav-link additions.

### Success criteria
Joseph + Michael can toggle secondary revenue, see the self-sustaining month shift earlier, read the "months saved" KPI, and visually identify the flywheel inflection on the LP chart.