# Fix Investor Demo Routing + Polish Outage Simulation

## Problem

1. `/demo?demo=investor` deep links from `InvestorPitch.tsx` (and any other investor surface that doesn't pre-flight PIN+NDA) hit `DemoAccessGate`, which only auto-grants when `hasInvestorPass()` is true. The "Live Investor Demo" CTA on `InvestorPitch.tsx` (line 212) sends visitors straight into the access-code wall.
2. Outage-sim UX still needs: a clearer "Demo: Outage Mode Active" affordance with a tooltip, guaranteed Deason auto-open + recovery on toggle off, and snapshot coverage.

## Routing fix (primary)

**File: `src/components/demo/DemoAccessGate.tsx`** — inside the `useState` initializer (around lines 282–314), add an early bypass:

- If `new URLSearchParams(window.location.search).get('demo') === 'investor'` (or `'outage'`), treat it as granted: write the same `LS_KEY` payload `{ ts, ndaSigned: true }` the investor-pass branch writes, and return `true`. No PIN prompt, no NDA modal.
- Run this check BEFORE `isPreviewDemoQaRoute()` and BEFORE `hasInvestorPass()` so it works on every host.
- Rationale: the investor demo is a marketing surface (already public via `/investor/pitch`, share links, etc.). The access-code gate exists for the private reviewer flow and should only trigger when no demo param is set.

**File: `src/pages/Investor.tsx`** — no functional change needed; the existing `Live Investor Demo` CTA continues to write the investor pass for PIN-cleared investors, which is still desirable.

**File: `src/pages/InvestorPitch.tsx`** — leave the `Link to="/demo?demo=investor"` as-is; the gate fix above is what unblocks it.

**Test: `src/components/demo/__tests__/DemoAccessGate.investorPass.test.tsx`** — add a sibling test case: mounting `DemoAccessGate` at `/demo?demo=investor` with NO investor pass in localStorage must still render children immediately (no PIN UI).

## Outage simulation polish

**File: `src/components/demo/InvestorEnergyFlowCard.tsx`**
- Wrap the "Simulate Grid Outage" / "End Outage Simulation" button in a shadcn `Tooltip` explaining what the toggle does ("Simulates a full grid outage so you can test Outage Mode UI + Deason context without waiting for a real one").
- Promote the small `Demo · Outage Mode Active` chip to a slightly bolder amber pill (already in place) and add `title` / `aria-label` text for non-tooltip surfaces.
- Confirm the existing `useEffect` already (a) dispatches `deason:nudge` + `deason:open` on enable and (b) sends the recovery `deason:nudge` on disable. Add an explicit `setShowAnnotations(false)` while sim is on (already handled by the render guard) and ensure that disabling the sim also closes the Deason outage banner by emitting a `deason:nudge` with `meta.kind: 'grid_outage', phase: 'recovery'` — already present; verify `DeasonChat` clears the amber banner when `phase === 'recovery'`.

**File: `src/components/deason/DeasonChat.tsx`** — confirm the amber banner only renders while `outageContext?.kind === 'grid_outage' && outageContext.phase !== 'recovery'`. Tighten the conditional if needed so toggling off immediately removes the banner.

## Snapshot / regression test

**New file: `src/test/InvestorOutageSim.snapshot.test.tsx`**
- Render `InvestorEnergyFlowCard` twice (sim off + sim on via `setInvestorOutageSim(true)`).
- Assert that with sim ON:
  - The amber `Demo · Outage Mode Active` chip is in the document.
  - The "Grid" readout tile shows `Offline`.
  - The card root has the amber border class signature.
  - The lazy `EnergyFlowScene` receives `isOutage={true}` (assert via a `vi.mock` of `@/components/dashboard/EnergyFlowScene` that captures props).
- Assert with sim OFF:
  - Chip reads `Live`, Grid tile shows `0.0 kW`, mocked scene receives `isOutage={false}`.

Use the existing pattern from `src/test/EnergyFlowScene.outage.test.ts` for prop-shape assertions; mock the heavy `EnergyFlowScene` to keep the test fast and stable.

## Acceptance

- Tapping "Live Investor Demo" or "See it live" from any investor page lands directly on `/demo` with the house diagram visible — no access-code screen.
- Toggling the outage sim opens Deason with the amber outage banner and a first message seeded from current sim state; toggling off restores normal Deason + EnergyFlow within one render.
- `bunx vitest run` passes including the new snapshot test and the new DemoAccessGate bypass test.

## Out of scope

- The private `/demo` access-code flow for non-investor visitors stays exactly as-is.
- No changes to `useInvestorDemoMode` storage keys or URL contract.
