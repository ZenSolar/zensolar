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
- Historical charts beyond the 24h drawer sparkline (lives on `/app/cockpit/history`)
- Manual overrides / settings (lives on `/app/cockpit/settings`)

## Status
- ✅ Direction picked (C, Stacked Flow)
- ✅ Tokens locked (Sora/Manrope, emerald/cyan)
- ✅ Dynamic asset detection scoped
- ⏳ Build in remix project only — do NOT implement in current app
