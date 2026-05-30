
## Live Energy Monitoring → Tesla-Grade Premium

Evolve the existing card. No rebuild — the data wiring, sign convention, tests, and node hooks (`data-state`, `data-flow`) all stay. Visual layer gets a major upgrade.

**Files touched (UI only):**
- `src/components/dashboard/AnimatedEnergyFlow.tsx` — SVG canvas, nodes, particles, numbers
- `src/components/dashboard/LiveEnergyMonitoringCard.tsx` — top status pill + outer chrome only
- `src/components/dashboard/__tests__/powerwallFlow.test.tsx` — keep all selectors green; add ≤3 small assertions for new test hooks

**Do NOT touch:** telemetry hooks, `batterySnapshot`, `derivePowerwallDisplay`, Supabase, Mint cards, other dashboard sections, light mode.

### 1. Isometric 3D house (centerpiece)

Replace the current flat front-elevation house with a true isometric block:
- 30° axonometric projection, three visible faces (roof, front, side) using layered `<polygon>`s with gradient fills (`houseRoof`, `houseFront`, `houseSide` gradients).
- Roof carries 6 glowing solar panel tiles. When `solarPower > 0.1`: panel fill animates a subtle blue→white shimmer; idle: dim slate.
- Front face has 2 windows that glow warm amber proportional to `homePower` (opacity 0.25–0.9, clamped). Sells "the home is alive".
- Soft elliptical ground shadow under the house (`<ellipse>` with radial gradient, low opacity).
- Drop-shadow filter on the whole house group for depth.

Stays pure SVG — no Three.js, no new deps. ~80 lines of geometry, all in `AnimatedEnergyFlow.tsx`.

### 2. Node layout (390px mobile-first)

```
           ┌──── Tesla status pill ────┐
           │  ● Tesla Charging · 11.0 kW · 37% │
           └─────────────┬─────────────┘
   ☀ Solar                                Grid ⚡
       \                                   /
        \         ╱▔▔▔▔▔▔╲                /
         \      ╱  HOME    ╲             /
   🔋 ────────[  1.1 kW    ]──────────
   Powerwall    ╲          ╱
                 ╲________╱
                      │
                  🚗 Tesla
                  11.0 kW · 37%
```

- 5 nodes preserved: Solar (top-left), Powerwall (left), Home (center, the 3D house), Grid (right), EV (below house, visually tethered with a short connector line, not a long arc).
- Connector lines redrawn as soft curved Bézier paths with subtle gradient strokes (currentColor → transparent), 1.5px.

### 3. Dramatic Powerwall discharge

Keep the existing `data-flow="powerwall-home"` group and green particle color (matches Powerwall icon — locked from last round). Upgrade:
- Particle count bumped to 8 (from 6) when discharging; size 2.2px with a 5px blur glow halo.
- Path widened slightly with a faint green underglow stroke (opacity 0.18) so the *channel* itself reads as energized, not just the dots.
- Existing amber pulsing node halo stays; add a second outer ring (16px drop-shadow, opacity 0.3 → 0.7 → 0.3, 2.4s loop) for "unmistakable at night".

### 4. Number legibility (the squint fix)

Currently kW labels are ~14–16px. New scale:
- **Home kW**: 30px, weight 700, `text-shadow: 0 0 12px hsl(var(--background))` for AMOLED separation.
- **Solar / Grid / EV kW**: 22px, weight 600.
- **Powerwall status (percent · kW)**: 18px, weight 600, amber/green per existing `statusColor`.
- Unit suffix (`kW`) stays 11px muted, baseline-aligned — gives the number room to breathe.
- All numbers use `font-variant-numeric: tabular-nums` so digits don't jitter as values tick.

### 5. Top status pill (`LiveEnergyMonitoringCard.tsx`)

Above the SVG canvas, a single dynamic pill that reflects the most important active state (priority: EV charging > Powerwall discharging > Solar producing > Grid importing > Idle):
- Rounded-full, dark glass background (`bg-white/5 backdrop-blur`), 1px border in state color.
- Pulsing dot + label + key metric. Example: `● Tesla Charging · 11.0 kW · 37% SOC`.
- Pure presentation — reads from the same `data` prop already passed in.

### 6. Polish

- Canvas background: subtle radial gradient (deep navy center → near-black edges) instead of flat fill — gives premium depth.
- Node icons get a soft outer glow in their state color when active.
- All animations use existing framer-motion patterns; target 60fps; no new RAF loops.

### Test plan

- All 24 existing tests in `powerwallFlow.test.tsx` must still pass (selectors `[data-flow="powerwall-home"]`, `[data-state="..."]`, text content `Full`, `+3.2 kW`, `−2.1 kW`, `13.5 kWh`, `State pending` are all preserved).
- Add 2 small assertions: status pill renders with `data-pill-state="discharging|charging|solar|grid|idle"`, and Home kW text is present at the new size class.

### Out of scope (explicit)

- No real 3D / WebGL / Three.js.
- No backend, telemetry, or sign-convention changes.
- No Mint card, wallet, or other dashboard edits.
- No light mode (project is dark-only per Core memory).
- No new npm dependencies.

### Success criteria

- At 390×844, night payload (`solar=0, battery=-0.8, home=1.1`): green particles stream visibly from Powerwall into a glowing isometric house with warm amber windows; amber halo pulses on Powerwall; status pill reads `● Powerwall · −0.8 kW · 64%`.
- Tesla-charging payload (`ev=11, battery=-1.2, solar=7.2`): pill reads `● Tesla Charging · 11.0 kW · 37%`; EV node tethered under the house with LIVE indicator; all kW numbers readable at arm's length without zooming.
- Daytime payload unchanged in behavior; just prettier.
- All tests pass.
