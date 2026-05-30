## Powerwall Discharge — Directional Flow + Node Glow

Tight, surgical pass. Only what's actually missing from the last two rounds. Text sizes, sign logic, minus-sign formatting, and amber status color already shipped — not touching those.

### Scope
**File:** `src/components/dashboard/AnimatedEnergyFlow.tsx` (only)
**Tests:** `src/components/dashboard/__tests__/powerwallFlow.test.tsx` (additions only)

Do NOT touch: `LiveEnergyMonitoringCard.tsx`, backend, telemetry, sign convention, text typography, other nodes.

### Changes

1. **Directional Powerwall → Home particle flow when discharging**
   - Trigger: `batteryPower < 0` (internal convention: negative = discharging).
   - Render particles on the Powerwall → Home path, flowing **toward Home**.
   - **Particle color: green** — same `hsl` token the Powerwall icon already uses (matches the node's existing green identity, keeps visual continuity with the icon). Amber is reserved for the node halo + status text only.
   - Particle count scales with discharge intensity: `count = Math.round(clamp(|batteryPower| / 5, 0.2, 1) * BASE_COUNT)`. Capped so we never exceed the existing solar-flow particle budget (battery/perf safety).
   - Reuse the existing particle primitive — no new animation library, no new SMIL/RAF loops.

2. **Amber pulsing halo on the Powerwall node when discharging**
   - SVG `filter: drop-shadow(0 0 12px #F59E0B)` on the Powerwall `<g>`, opacity animating 0.6 → 1.0 → 0.6 on a 2s loop via existing framer-motion pattern.
   - Idle/charging: no halo (charging keeps the existing green pulse if present).

3. **Stable hooks for testing**
   - Add `data-state="discharging|charging|idle|unknown"` to the Powerwall `<g>`.
   - Add `data-flow="powerwall-home"` to the discharge particle group.

### Tests (additions to existing file)
- Discharging payload (`batteryPower: -0.8`) renders a `[data-flow="powerwall-home"]` element.
- Powerwall group carries `data-state="discharging"` when `batteryPower < 0`.
- Charging payload (`batteryPower: +3.2`) does NOT render `[data-flow="powerwall-home"]` and node has `data-state="charging"`.
- Idle (`batteryPower: 0`) → `data-state="idle"`, no discharge flow.

### Out of scope (explicit)
- No text outlines/glows on numbers (last round handled legibility; outlines on AMOLED look cheap).
- No changes to Solar/Grid/EV flows.
- No `LiveEnergyMonitoringCard.tsx` edits.
- No new dependencies.

### Success criteria
- Night view (solar = 0, `batteryPower = -0.8`): green particles visibly flow Powerwall → Home, Powerwall node has amber halo pulse, status line still reads `100% · −0.8 kW` in amber.
- Daytime (solar high, battery charging): no Powerwall→Home flow, no amber halo, existing visuals unchanged.
- All 20 existing tests still pass + 4 new tests pass.
