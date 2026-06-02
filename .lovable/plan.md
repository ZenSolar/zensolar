## Goal
Lock in the Telemetry Single Source of Truth rules with deterministic unit tests so future changes can't silently regress them.

## Files to add

### 1. `src/lib/__tests__/dataSourcePriority.test.ts`
Pure-function tests against `pickSource`, `detectSolarConflict`, and `detectChargingConflict` (no mocks needed).

Covered cases:
- **Tesla vehicle charging rule**
  - Tesla vehicle + Wallbox present → `pickSource('charging', …)` returns `tesla` with reason `tesla_vehicle_present`.
  - Wallbox only → returns wallbox.
  - `detectChargingConflict` flags `conflicting=true` when both exist.
- **Solar source rule**
  - `solar_installer='tesla'` + Enphase + Tesla solar devices → returns `tesla`.
  - `solar_installer='other'` + `solar_inverter_brand='enphase'` with Enphase + SolarEdge devices → returns `enphase`.
  - Only a Tesla `powerwall` device present (no PV) → solar returns `null` (Powerwall CTs never used as solar source).
  - Fallback order Enphase > SolarEdge > Tesla when profile unset.
  - `detectSolarConflict` flags multi-provider PV.
- **Anti-double-count rule (SSOT contract)**
  - For each capability (`solar`, `battery`, `charging`, `consumption`) with multiple competing providers, `pickSource` returns exactly ONE `SourceChoice` (never an array, never merged).
  - Parametrized loop asserts only one provider wins per capability.

### 2. `src/hooks/__tests__/useEnergyLog.teslaSkipGuard.test.ts`
Targeted test for the Tesla skip guard in `fetchHomeChargingRows`. Since the function is module-internal, we exercise it through a thin mock of `@/integrations/supabase/client` and re-import the hook module.

Approach (deterministic, no network):
- `vi.mock('@/integrations/supabase/client')` returning a chainable builder that records each `.from(table)` call.
- Drive the guard by calling the exported `useEnergyLog`'s `loadMonth` path is heavy; instead, refactor-free option: extract `fetchHomeChargingRows` is not exported. We will test indirectly by:
  - Mocking supabase so `from('connected_devices').select(...).eq(...).in(...).limit(1)` resolves with one Tesla vehicle row.
  - Rendering the hook with `@testing-library/react`'s `renderHook` wrapped in a `QueryClientProvider`, switching `activeTab` to `'home-charging'`, awaiting the query, and asserting that `home_charging_sessions` table was **never** queried (assert via the recorded `.from()` calls).
  - Second case: zero Tesla vehicles → `home_charging_sessions` IS queried.

If the indirect path proves flaky, fall back to exporting `fetchHomeChargingRows` from `useEnergyLog.ts` (named export only — no behavior change) and unit-test it directly. Plan picks the indirect path first.

### 3. `src/components/dashboard/__tests__/ssotContract.test.ts`
Lightweight static contract test that greps the repo to catch obvious double-count regressions:
- Reads `src/hooks/useEnergyLog.ts` and asserts the Tesla skip-guard comment + early-return block are still present (string match on `Tesla vehicle skip guard` and `return [];` inside `fetchHomeChargingRows`).
- Reads `src/lib/dataSourcePriority.ts` and asserts the `SOLAR_FALLBACK` array does not contain `'powerwall'` and that `pickSource('solar', …)` never returns a powerwall device.
- Acts as a tripwire: anyone deleting the guard or adding Powerwall to the solar fallback breaks CI.

## Test infrastructure
Existing setup is already in place (`vitest.config.ts`, `src/test/setup.ts`, sibling tests under `src/hooks/__tests__` and `src/components/dashboard/__tests__`). No new dev-deps, no config changes.

## Out of scope
- No production code changes (unless step 2's fallback export is needed; that's a 1-line `export` addition, no logic change).
- No edge-function tests (Deno mirror lives in `supabase/functions/_shared/`; covered by parity via shared rule table — can be added later if requested).

## Deliverable
Three new test files; running `vitest` passes locally. Final reply: "Automated regression tests for Telemetry SSOT rules added."
