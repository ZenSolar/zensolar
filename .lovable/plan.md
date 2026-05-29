# Tesla Status Pill — Tests, Accessibility, and Home/Public Charging Fix

## 1. Fix the "Public L2" misclassification (your charger at home)

**Diagnosis.** In `deriveTeslaFlow` (`LiveEnergyMonitoringCard.tsx`), when Tesla's API reports `charging_state=charging` but there's no active `home_charging_sessions` row yet (the `tesla-charge-monitor` cron hasn't created it on this tick) AND `fast_charger_type` is empty, the code falls into:

```ts
} else if (phases && phases >= 1 && isCharging) {
  source = 'public';
  sourceLabel = 'Public L2';
}
```

That's why the pill/tile says **Public L2** while you're plugged in at home. The backend `tesla-charge-monitor` already uses the correct heuristic — "AC charging with home address on file = home" — but the UI doesn't mirror it, so there's a window where the card mislabels home sessions.

**Fix.** Match the backend's heuristic in `deriveTeslaFlow`:

- If `fast_charger_type` indicates Supercharger/DC fast → `supercharger`.
- Else if it's a Tesla Wall Connector string OR `sessionActive` → `home` (Wall Connector).
- Else if `isCharging` and it looks like AC (phases ≥ 1, kW ≤ ~12, voltage in ~110–250 V range when present) → **default to `home`** (same assumption the backend makes). Pill says "Tesla Charging" with sub-label "Wall Connector".
- Only label `public` when there is positive evidence it's away from home — e.g., a DC fast type, or a future hook into vehicle GPS distance from home. Until we have that signal, never default unknown AC to "Public L2".
- Idle/unplugged logic unchanged.

**Does the kWh go to the Home Charging KPI?** Yes — independently of this label. The `tesla-charge-monitor` edge function creates a `home_charging_sessions` row (based on GPS proximity to your home address, or AC-charging-with-home-address-on-file fallback) and on completion writes the totals into `charging_sessions` with `charging_type='home'`. That flows into the Clean Energy Center's **Home charging** KPI tile and into `useEVTotals().home_kwh`. The mislabel in the UI was cosmetic — it did not redirect kWh into the Supercharger KPI. (Worth double-checking after the fix that any in-flight session you started today landed under Home; if not, that's a `tesla-charge-monitor` GPS/home-address issue and a separate ticket.)

## 2. Accessibility — Tesla pill + LIVE indicator

`TeslaStatusPill` (button) and the `Live` chip inside `EVTile` need proper screen-reader semantics and visible focus.

**Tesla pill (`TeslaStatusPill`)**
- Keep `<button>` but add:
  - `aria-live="polite"` + `aria-atomic="true"` on an inner status `<span>` so SR users hear state transitions (Charging → Idle → Unplugged) without re-announcing the button name.
  - `aria-label` becomes a clean sentence per state, e.g. "Tesla charging at home, 7.4 kilowatts, 62 percent state of charge. Activate to view details."
  - `role="status"` on the inner live region (not on the button itself).
  - `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background` for keyboard focus.
  - `active:scale-[0.98]` + existing haptic `selection()` for press feedback.
  - Decorative dot/pulse marked `aria-hidden="true"`.
  - `min-h-11` to hit 44px tap target.
- When `tesla` is null, render nothing (current behavior preserved).
- Supercharger badge gets `aria-hidden` (info already in `aria-label`).

**LIVE chip in `EVTile`**
- Wrap the pulsing dot + "Live" text in `<span role="status" aria-live="polite">Live charging</span>` so the chip is announced once when it appears, not on every re-render. Dot itself `aria-hidden`.

**Ping-on-scroll target (`#tesla-ev-tile`)**
- Add `tabIndex={-1}` and `aria-label="Tesla details"` so `scrollIntoView()` can be followed by `.focus()` for keyboard users (move focus after smooth scroll completes via a short timeout, then blur on next interaction).

## 3. Unit tests

Add a Vitest spec next to the component. Pure-function tests for `deriveTeslaFlow` + a small RTL test for the pill render. No backend mocks needed — `deriveTeslaFlow` is pure.

**File:** `src/components/dashboard/__tests__/teslaStatusPill.test.tsx`

Coverage:

1. `deriveTeslaFlow`
   - returns `null` when telemetry is undefined or `oem !== 'tesla'`.
   - **charging at home (session active, no fast_charger_type)** → `state='charging'`, `source='home'`, `sourceLabel='Wall Connector'`, `isCharging=true`, `kW>0`.
   - **charging at home (Tesla API reports `charging`, NO session yet, phases=1)** → **post-fix**: `state='charging'`, `source='home'` (regression guard against the old "Public L2" branch). Asserts `sourceLabel !== 'Public L2'`.
   - **supercharging** (`fast_charger_type='Tesla'` + `charging_state='Charging'`) → `state='charging'`, `source='supercharger'`, `sourceLabel='Supercharger'`.
   - **plugged idle** (`charging_state='Stopped'`, session not active) → `state='idle'`.
   - **plugged idle — Complete** (`charging_state='Complete'`) → `state='idle'`.
   - **not plugged in** (`charging_state='Disconnected'`) → `state='unplugged'`.
   - **kW derivation** falls back to voltage × amps / 1000 when `charge_rate_kw` missing.

2. `TeslaStatusPill` (RTL render)
   - charging state → button `aria-label` includes "charging" and kW, has a visible "Tesla Charging" text, role=button.
   - idle state → `aria-label` includes "Plugged" and "Idle"; no pulse animation class.
   - unplugged state → `aria-label` includes "Not Plugged In"; renders muted styling.
   - click invokes `onClick` handler (jsdom).
   - null tesla → renders nothing.

**Test infra check.** `vitest.config.ts` currently uses `environment: "node"`. The RTL render test needs `jsdom`. Two options:
- Switch global env to `jsdom` (matches the guidance in the frontend-testing-setup doc, and other future RTL tests will need it).
- Or scope per-test with `// @vitest-environment jsdom` at the top of the new file.

We'll go with the per-file pragma to avoid touching global config and risking unrelated test changes. Will also add `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom` to devDependencies if not already present, plus a minimal `src/test/setup.ts` for `@testing-library/jest-dom` matchers (loaded only by the new file via a top-of-file `import '@testing-library/jest-dom/vitest'`).

To make `deriveTeslaFlow` and the `TeslaStatusPill` testable, export them from `LiveEnergyMonitoringCard.tsx` (named exports — no behavior change to the default card).

## Files touched

- `src/components/dashboard/LiveEnergyMonitoringCard.tsx`
  - Fix `deriveTeslaFlow` source detection (home as default for AC charging).
  - Export `deriveTeslaFlow`, `TeslaStatusPill`, and the `TeslaPillState`/`TeslaFlow` types.
  - A11y: pill aria-label/role/live region/focus-visible/min-h-11, ping-target `tabIndex`, LIVE chip role=status.
- `src/components/dashboard/__tests__/teslaStatusPill.test.tsx` (new) — all unit tests above.
- `package.json` — add testing-library deps if missing (no runtime deps).

## Out of scope

- Backend `tesla-charge-monitor` changes (already correctly classifies home via GPS/AC heuristic).
- AnimatedEnergyFlow visuals.
- Clean Energy Center KPI math — Home Charging KPI already receives this kWh through `home_charging_sessions` → `charging_sessions(charging_type='home')`.
