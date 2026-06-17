---
name: Live Energy Flow Card — Unified Hero Spec (REMIX)
description: Locked design + behavior spec for the unified Solar+Battery+EV+EV-status hero card. Built in remix only. Direction C "Stacked Flow" selected with dynamic-asset detection.
type: feature
---

# Live Energy Flow Card — Unified Hero (LOCKED for REMIX)

This is THE hero of the remix app — the moment that catches every investor and every user. Lives on `/app/cockpit` as the top card. Replaces the 3 separate cards (solar, battery, EV) in the current app.

## Direction selected: C — "Stacked Flow"
Reference prototype: see `.lovable/REMIX_MANIFEST_V2.md` decision history.
Prototype HTML archived at: `.lovable/prototypes/energy-flow-c-stacked.html` (paste from this spec's appendix when remix is scaffolded).

## Locked visual tokens
- Font: **Sora** 600/700 (headings + KPI numbers), **Manrope** 400/500/600 (body + labels)
- Bg `#05070a`, card `#0a0f1e`, border `hsl(160 40% 25% / 0.4)`, radius `32px`
- Emerald primary `#22c98a`, accent cyan/mint `#4ade80`, warning amber `#f5c84c`, danger `#ef4444`
- Live dot: ping animation @ 2s, emerald
- KPI numbers: Sora 32–40px tracking-tighter; labels Manrope 10–11px uppercase tracking-widest
- Multi-layered glass: `bg-white/5` + `backdrop-blur-xl` + thin `border-emerald-500/20` on every node card

## Structural moves (Stack Flow)
1. **Header** — "ZenEnergy Monitoring" + Home Energy Cockpit + LIVE pulse pill
2. **Solar node (top)** — large kW + OEM chip (Enphase/SolarEdge/Tesla) + "Producing at Peak"
3. **Central house + flow** — house glyph with radial energy distribution ring; Battery node (left) + Grid node (right) floating; vertical gradient flow line from Solar down through House; horizontal gradient between Battery↔House↔Grid; flowing particles
4. **EV node (bottom)** — glass card: vehicle name + status badge + kW + ETA + progress bar + battery% + range + driving-mode chip
5. **Footer** — Solar Daily kWh + Saved Today $

## Dynamic asset detection (THE differentiator)
The house illustration and node visuals MUST adapt to the user's connected assets — not a static graphic.

### Solar
- If user has Enphase / SolarEdge / Tesla Solar connected → render house WITH solar panels on roof (panel count proportional to system kW: ≤6kW = 12 panels, 6–10 = 20, 10+ = 28)
- No solar connected → render bare roof + ghosted "Connect Solar" CTA on the Solar node
- OEM logo chip below kW (small monochrome SVG)

### Battery
- If Powerwall / Enphase Encharge / SolarEdge Home Battery connected → render battery unit graphic NEXT TO house (Powerwall = vertical Tesla unit, Enphase = stacked cubes, SolarEdge = wall box). Show SOC% as fill animation on the unit itself.
- Multi-battery → stack glyphs (2× Powerwall = two units side by side, max 4 visible)
- No battery → hide unit, gray-out Battery node with "Add Battery" CTA

### EV (Tesla auto-detect)
- On Tesla connection, call `/vehicles` and pull: `model`, `trim`, `color` (paint code → hex), `wheels`, `has_fsd`
- Render 3/4 view EV graphic matching detected vehicle:
  - Model 3 / Model Y / Model S / Model X / Cybertruck (5 silhouettes shipped)
  - Body color from Tesla paint code (Pearl White, Solid Black, Midnight Silver, Deep Blue, Red Multi-Coat, Ultra Red, Stealth Grey)
  - Wheel style swap (Aero / Induction / Überturbine / Cyberstream)
- FSD badge ONLY when `has_fsd === true`
- Non-Tesla EV → generic EV silhouette + manufacturer name
- No EV connected → hide EV node, replace with "Connect Vehicle" tile

### Other OEMs roadmap
Reserve graphic slots for: Ford Lightning, Rivian R1T/R1S, Chevy Silverado EV, Hyundai Ioniq 5, Wallbox Pulsar (charger-only mode). Use generic silhouette + brand chip until illustration shipped.

## 3D perspective flow lines
- SVG paths with `transform: perspective(800px) rotateX(8deg)` on the flow group
- Stroke gradient + `stroke-dasharray` animation @ 1.2s ease-in-out
- Opacity tied to actual kW magnitude (0kW = 10%, peak = 100%)
- Particle dots ride the paths (3 particles per active line, staggered)
- Color logic: Solar→House emerald, Battery charging emerald-in, Battery discharging cyan-out, Grid import amber, Grid export emerald, EV charging mint

## Radial energy distribution ring (around house)
- 4-segment ring (Solar / Battery / Grid / EV) at the house perimeter
- Each segment length = % of total current power flow from/to that source
- Animates smoothly on data update (300ms tween)
- Tap segment → drawer with 24h sparkline for that source

## Interactive behavior
- Tap ANY node → bottom drawer: 24h sparkline + last-7d total + OEM raw payload (debug toggle)
- Long-press house → toggle between "Now" / "Today" / "This Week" aggregation
- Pull-to-refresh on card → force OEM repoll (rate-limited per OEM tier — see `mem://features/data-source-of-truth.md`)
- Outage detected (grid 0 + import attempted) → border flashes amber, "Grid Outage — Running on Battery" banner

## Data plumbing (remix)
- Hook: `useLiveEnergyFlow()` → polls `live_telemetry_snapshots` every 15s + Supabase realtime subscribe
- Source-of-truth per asset enforced via `mem://features/data-source-of-truth.md` (one OEM per Solar, one per Battery — no double-count)
- Demo fixture: `useInvestorDemoMode()` returns hard-coded 5.4kW solar / 87% PW / 7.2kW EV charging / Model Y Pearl White / FSD-on

## Performance
- Skip-frame strategy: render flow particles via CSS only (no JS rAF) to stay 60fps on mid-range mobile
- House + EV illustrations: inline SVG (no img tag) so colors theme live
- Bundle target: < 35kb gzipped for the card (illustrations + logic)

## Components to build (remix)
```
src/features/cockpit/LiveEnergyFlowCard/
  index.tsx                    # composition
  HouseGlyph.tsx               # asset-aware SVG
  EVGlyph.tsx                  # vehicle silhouette switcher
  BatteryGlyph.tsx             # OEM-specific battery unit
  FlowLines.tsx                # SVG paths + particles
  RadialRing.tsx               # 4-segment distribution ring
  NodeCard.tsx                 # glass node primitive
  hooks/useLiveEnergyFlow.ts
  hooks/useDetectedAssets.ts
  fixtures/investorDemo.ts
  glyphs/
    tesla-model-y.svg
    tesla-model-3.svg
    powerwall.svg
    enphase-encharge.svg
    enphase-panel.svg
    ... (all dynamic glyphs)
```

## Out of scope for this card
- Wallet / mint / NFT content (sibling cards)
- Historical charts beyond the 24h drawer sparkline
- Manual overrides / settings
- Per-Powerwall-count dedicated hero renders (use sprite overlay)
- Non-Tesla battery brands in v1 (Powerwall only)
- Time-of-day variants beyond outage in v1

## Hero variants (v4)
| Variant       | Asset                                     | Trigger                            |
| ------------- | ----------------------------------------- | ---------------------------------- |
| `default`     | `energy-flow-house-hero.jpg`              | `hasBattery && hasEV && !outage`   |
| `no-ev`       | `energy-flow-house-hero-no-ev.jpg`        | `hasBattery && !hasEV && !outage`  |
| `no-battery`  | `energy-flow-house-hero-no-battery.jpg`   | `!hasBattery && !outage`           |
| `outage`      | `energy-flow-house-hero-outage.jpg`       | `outage === true`                  |

Outage behavior: Solar→Standby, Grid→Offline (red, dimmed), Powerwall→Backup (faster 1.0s pulse), EV row "Charging paused", amber "GRID OUTAGE · ISLAND MODE" banner.

## KPI layout (overlap-safe)
- Solar: top-left  · Home: top-right
- Powerwall: mid-left (top:44%, translateY(-50%)) — only when `hasBattery`
- Grid: bottom-left  · EV: row list below hero (never overlay)

## Multi-Powerwall stacking (sprite overlay)
Asset: `powerwall-sprite.png`. Anchor `{left:46%, top:70%}`, width 7% of hero.
1=hidden under hero · 2=side-by-side · 3=row · 4=2×2 grid · 5+ caps at 4 + "+N" badge. Aggregate kWh = `units × 13.5`. Label `POWERWALL ×N` when N>1.

## Status
- ✅ Direction C, Stacked Flow
- ✅ Tokens locked (Sora/Manrope, emerald/cyan/amber)
- ✅ Dynamic asset detection scoped
- ✅ v4 — variants + multi-Powerwall sprite stack shipped to `/prototype/energy-flow`
- ⏳ Build in remix project

---

## v5 (Production Polish) — Final Ruleset

### Scene precedence (highest wins)
`outage` > `supercharging` > `tesla-only` > `no-battery` > `no-ev` > `default`

### Hero renders (all matched-perspective, 1024×1280)
- `energy-flow-house-hero.jpg` — glossy black PV w/ blue sheen + Wall Connector + Powerwall, empty driveway, dusk
- `energy-flow-house-hero-no-ev.jpg` — same w/ Powerwall, clean driveway
- `energy-flow-house-hero-no-battery.jpg` — same, no Powerwall, Wall Connector present
- `energy-flow-house-hero-outage.jpg` — night, panels dark/reflective, Powerwall faint green LED
- `energy-flow-house-hero-tesla-only.jpg` — minimal house silhouette far bg, foreground empty for hero car
- `energy-flow-supercharger-bg.jpg` — V4 stall, warm orange glow, distant home silhouette

### Wall Connector
Always visible. Baked into every house hero render. In `tesla-only` overlay sprite at `{70%, 44%}` smaller (5% width, opacity 0.85). Dimmed (opacity 0.3) in `outage`. Glow intensifies when charging.

### Cable arc (3 states)
- `unplugged` → hidden (only fully hidden state)
- `plugged-idle` → cyan `#7ce0ff` at 45% opacity, no particles, soft static glow — **always visible when plugged**
- `charging` → emerald `#22c98a`, full opacity, 3 staggered animated particles (1.2s loop), strong glow
- `supercharging` → home cable hidden; uses orange off-canvas flow instead

### Pull-forward animation
Car sprite: `idle` at `left: 36%` → `charging` at `left: 44%, top +2%`. Transition `1.4s cubic-bezier(0.4,0,0.2,1)`. Cable Bézier recalculates reactively. Respects `prefers-reduced-motion`.

### Multi-Powerwall stacking (1–5)
- 1 → center · 2 → side-by-side · 3 → row of 3 · 4 → 2×2 · 5 → 2×2 + 1 above
- 6+ → cap at 5 with `+N` badge
- Capacity: `units × 13.5 kWh`

### Tesla Status Card (`TeslaStatusCard.tsx`)
Always visible when Tesla connected, EXCEPT in `outage` (hidden or "Vehicle Offline" state).
- `variant: 'hero'` → used in `tesla-only` scene; full-width, 96px SOC ring, emerald glow border
- `variant: 'secondary'` → used in `default | no-ev | no-battery | supercharging`; compact, 64px ring
- Status pill colors: green=charging · amber=plugged-idle · slate=unplugged · orange=supercharging · red=offline

### Weather sky overlay (`WeatherSkyOverlay.tsx`)
- `clear` → no tint
- `clouds` → grey-blue `rgba(120,130,145,0.22)` multiply
- `rain` → grey tint + 18 animated SVG rain streaks (1.4s linear), respects reduced-motion
- `snow` → light blue tint + 14 falling flakes (4.5s linear)
- `night` → deep navy `rgba(10,15,30,0.55)` (forced when `outage`)

### Supercharging scene
- BG: `energy-flow-supercharger-bg.jpg`
- Top pill: `📍 {location}` (orange)
- Car centered at 50%, scale 72% width
- Orange/amber animated flow from off-canvas right → charge port
- KPI strip bottom-center: `Supercharging • {kW} kW` (large) + `SOC X% → Y%` + `+N mi` + `ETA Nm`
- Solar / Powerwall / Grid / Home KPIs hidden

### Tesla-Only scene
- BG: `energy-flow-house-hero-tesla-only.jpg`
- Wall Connector overlay sprite (smaller, 5% width)
- Large hero Tesla car (78% width, centered)
- Cable arc visible when plugged
- Tesla Status Card rendered as `hero` variant directly below hero
- Only the Tesla Status Card communicates status; no floating KPIs
