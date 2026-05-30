# ZenEnergy Live Card — Flow Polish + Multi-Battery

Scope: surgical updates to `HomeBlueprint.ts` and `EnergyFlowScene.tsx` only. No PNG regen, no halo/car-logic changes.

## 1. Roof-hugging bezier paths (`HomeBlueprint.ts`)

Rewrite each path in `BLUEPRINT_PATHS` as a multi-segment curve that tracks the silhouette instead of cutting diagonals:

- `solarToHome`: roof apex → down the right roof slope → vertical drop along right gable → into windows. Use an `M ... C ... S ...` chain so it bends at the eave (~ x=78, y=48) then drops straight down to windows.
- `solarToPowerwall`: same eave bend, continues vertically down the right wall to Powerwall.
- `powerwallToHome`: tight vertical arc hugging the right wall (small control-point x-offset, ≤2 units off the wall line).
- `homeToGrid` / `gridToHome`: hug the baseline — drop from windows down the wall first, then run horizontally along the ground to the meter (L-shape via two control points near y=72).
- `chargerToEv`: arc out the garage opening then sweep down the driveway curve to `carPark` (control points along the driveway diagonal, not a straight line).

## 2. Slower, calmer dot animation (`EnergyFlowScene.tsx`)

- Change `flowDur` from `Math.max(0.9, 2.0 - kw*0.13)` → `Math.max(2.0, 4.0 - kw*0.2)` so even high-power flows take ≥2s and idle flows ~4s (≈2× slower).
- Update `DottedFlow` default `dur` from `1.8` → `3.6`.
- Keep the existing `0;0.15;0.85;1` opacity keyTimes (fade-in/out preserved, naturally stretched by longer `dur`).

## 3. Multi-Powerwall support

`HomeBlueprint.ts`:
- Raise `windows` from `y: 58` → `y: 52` (closer to roof eave, frees the wall).
- Keep `powerwall` (top unit) at `{ x: 82, y: 65 }`.
- Add `powerwall2: { x: 82, y: 76 }` (stacked below, same x).
- Add `BLUEPRINT_PATHS.solarToPowerwall2` and `powerwall2ToHome` mirroring the single-unit paths but ending at the lower anchor.

`EnergyFlowScene.tsx`:
- Add an optional `batteryCount?: number` prop (default 1). When `≥ 2`, render a second `DeviceHalo` at `HOME_BLUEPRINT.powerwall2` using the same color/intensity as the first.
- When `batteryCount ≥ 2` and a Powerwall flow is active, render the corresponding flow to BOTH anchors (two `DottedFlow` elements, second uses the `…2` path id).
- Caller wiring: in the parent that mounts `EnergyFlowScene` (passes `teslaPayload` / `batteryPayload`), derive count from `useBatteryTelemetry().data.length` (each row = one connected battery site/unit). This single-line wiring is included so the feature is live, not dormant.

## 4. Verification

After build, screenshot at 390×844 for: solar+home (day), PW discharge (night), grid export, EV charging (day), ZenX disconnected. Confirm curves hug the house, dots crawl, windows sit higher, and a synthetic 2-battery scenario renders two halos.

## Files touched

- `src/components/dashboard/HomeBlueprint.ts` — paths, windows anchor, `powerwall2` + 2 new paths.
- `src/components/dashboard/EnergyFlowScene.tsx` — `flowDur`, `DottedFlow` default, optional `batteryCount` prop, second halo + duplicated flow rendering.
- Parent that mounts the scene (likely `AnimatedEnergyFlow.tsx` or dashboard wrapper) — pass `batteryCount` from telemetry hook.

No changes to: PNGs, halos, conditional-car logic, `EnergyFlowScene.scenes.ts`, telemetry hooks, tests.