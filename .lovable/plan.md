
# Live Energy Flow Card — Production Polish v5 (Final)

Builds on v4 spec. Adds glossy panels, animated Wall Connector cable, multi-Powerwall stacking, Tesla-Only + Supercharging scenes, Tesla Status Card, pull-forward animation, plus 4 final-pass refinements.

## 1. Asset Regeneration

| File | Notes |
|---|---|
| `energy-flow-house-hero.jpg` | **Re-render**: glossy black PV panels with blue sheen; Wall Connector mounted on garage wall; empty driveway |
| `energy-flow-house-hero-no-ev.jpg` | Re-render w/ glossy panels + Wall Connector |
| `energy-flow-house-hero-no-battery.jpg` | Re-render w/ glossy panels + Wall Connector, clean garage wall |
| `energy-flow-house-hero-outage.jpg` | Re-render night, panels dark/reflective, Wall Connector unlit |
| `energy-flow-house-hero-tesla-only.jpg` | **NEW**: minimal house silhouette, large foreground for hero car, Wall Connector still visible (smaller) |
| `energy-flow-supercharger-bg.jpg` | **NEW**: Supercharger stall, small house silhouette far background |
| `tesla-model-y-sprite.png` | **NEW**: transparent perspective-matched Model Y |
| `wall-connector-sprite.png` | **NEW**: transparent Gen3 Wall Connector |
| `powerwall-sprite.png` | **Existing**, re-tune stacking for 1–5 |

## 2. Component Refactor — `PrototypeEnergyFlow.tsx`

### Scene state machine
```text
sceneType =
  outage          → night, all flows recolored, Powerwall island
  supercharging   → supercharger bg, big car, orange flow, location pill
  tesla-only      → minimal house, hero car, full-width Tesla Status Card below
  no-battery      → variant render, no Powerwall KPI/flow
  no-ev           → variant render, no EV row
  default         → all assets
```
Precedence (highest wins): `outage` > `supercharging` > `tesla-only` > `no-battery` > `no-ev` > `default`.

### 2a. Glossy Solar Overlay
SVG `<defs>` gradient + masked rect on roof polygon. Animated shimmer sweep (3s linear). Paused when `solar_kW < 0.1` or `outage`. Reuses `ShimmerOverlay.tsx`.

### 2b. Weather-Tinted Sky **(NEW #2)**
- Reads existing `deason-weather` cache (`today.weather.main` + `clouds`).
- SVG `<rect>` overlay above hero, below sprites:
  - `clear` → no tint
  - `clouds` → `rgba(120,130,145, clouds_pct/200)` overlay
  - `rain`/`drizzle` → grey tint + animated SVG `<line>` rain streaks (10 lines, `translateY` 2s linear infinite, opacity 0.4)
  - `snow` → light blue-grey tint + 8 falling `<circle>` flakes
  - `night` (outage or `sunset < now`) → deep navy `rgba(10,15,30,0.55)`
- Respects `prefers-reduced-motion` (static tint, no streaks).
- Falls back to no-tint if weather data missing.

### 2c. Wall Connector — Always Visible **(NEW #4)**
- Sprite anchored at `{left: 28%, top: 62%}` (garage wall).
- Scale `1.0` in all scenes EXCEPT `tesla-only` (scale `0.65`, opacity `0.85`).
- Hidden only in `outage` (unlit, opacity `0.3`).
- Glow halo (SVG filter) intensifies when `charging`.

### 2d. Cable Arc — Always Visible When Plugged **(NEW #1)**
Extend `EvChargingCable.tsx`:
- Props: `state: 'unplugged' | 'plugged-idle' | 'charging'`, `carAnchor`, `wallAnchor`, `reducedMotion`.
- States:
  - `unplugged` → return `null` (only fully hidden state)
  - `plugged-idle` → cable rendered, muted grey-cyan `#7ce0ff` at 40% opacity, NO particles, soft static glow
  - `charging` → emerald gradient `#22c98a`, full opacity, animated particles (3 circles, `animateMotion` 1.2s staggered), strong glow
- SVG quadratic Bézier path, `stroke-width: 4`, gaussian-blur drop-shadow filter.
- `supercharging` scene → cable hidden (uses orange off-canvas flow instead).

### 2e. Pull-Forward Animation
- Car sprite: `idle` at `left: 22%`, `pulled-forward` at `left: 30%, top: +2%`.
- `transform 1.4s cubic-bezier(0.4,0,0.2,1)` on `charging: true`.
- Cable Bézier control point reactively recalculates → cable bends naturally.
- Respects `prefers-reduced-motion` (instant snap).

### 2f. Multi-Powerwall Stacking (1–5)
- 1: center · 2: side-by-side · 3: row of 3 (tight gap) · 4: 2×2 grid · 5: 2×2 + 1 centered above.
- 6+: cap at 4 with `+N` badge.
- Tuned anchor + spacing to avoid garage-door clipping at all counts.

### 2g. Supercharging Scene
- Bg: `energy-flow-supercharger-bg.jpg`.
- Hero car centered at 50%, scale 1.15×.
- Top-center pill: `📍 Harris Ranch, CA` (mock).
- Orange/amber glow flow from off-canvas right → charge port.
- KPI strip below: `Supercharging • 247 kW` (large) + `SOC 64% → 80%` + `+128 mi added` + `ETA 12 min`.
- Mini house icon top-left (8%).
- Solar/Powerwall/Grid KPIs hidden.

### 2h. Tesla-Only Scene
- Bg: `energy-flow-house-hero-tesla-only.jpg` (minimal house silhouette).
- Wall Connector visible but small (per 2c).
- Large hero Tesla car centered.
- Cable arc visible when plugged (per 2d).
- **Tesla Status Card rendered full-width directly below car** (per 3b below).
- Only Home KPI visible top-right; Solar/Battery/Grid hidden.

## 3. Tesla Status Card — `src/components/dashboard/TeslaStatusCard.tsx`

```text
┌─────────────────────────────────────────────┐
│  🚗 Model Y Performance  [FSD v13.2 ✓]      │
│   ╭────╮   Odometer:    24,481 mi           │
│   │ 64 │   Range:        198 mi             │
│   │ %  │   Charging:    11.5 kW (~3h 12m)   │
│   ╰────╯   Status:      🟢 Charging at home │
└─────────────────────────────────────────────┘
```

### 3a. Variants **(NEW #3)**
- Prop `variant: 'hero' | 'secondary'`.
- `hero` → full-width, larger SOC ring (96px), stronger glow, gradient border, used in `tesla-only` scene directly under car.
- `secondary` → compact, smaller ring (64px), clean card, used in `default` / `no-battery` / `no-ev` / `supercharging` scenes (below hero, above KPI strip).
- Hidden in `outage` (or dimmed to "Vehicle Offline" state if Tesla connected but grid down).

### 3b. Internals
- Animated SOC ring (SVG stroke-dashoffset, 1s ease).
- FSD badge: emerald pill if installed, slate if not.
- Status row color-coded: green=charging, amber=plugged-idle, slate=unplugged, orange=supercharging, red=offline.

## 4. Dev Control Panel
- Scene: `default | no-ev | no-battery | outage | tesla-only | supercharging`
- Powerwall count: `1–5`
- Charging state: `unplugged | plugged-idle | charging | supercharging`
- Weather: `clear | clouds | rain | snow | night`
- SOC slider: `0–100`

## 5. Spec Update — `.lovable/memory/features/live-energy-flow-card-spec.md`
Append **v5 ruleset** covering: scene precedence (6), glossy PV, Wall Connector always-visible rule + scale-in-tesla-only, cable 3-state rule (always visible when plugged), pull-forward timing, Tesla Status Card hero/secondary variants, weather-tinted sky rules, Supercharging scene, Tesla-Only scene, Powerwall counts 1–5.

## 6. Verification
- `browser--view_preview` at 393×844 across 6 scenes × 4 charging states × 5 powerwall counts × 5 weather states (spot-check matrix).
- Confirm no KPI overlap, no sprite clipping, cable always visible when plugged.
- `prefers-reduced-motion` honored on shimmer, particles, pull-forward, rain streaks.

## Out of Scope
- Wiring to live Tesla Fleet API / `connected_devices` data.
- Real Supercharger location lookup.
- Non-Tesla EV silhouettes.
- Audio/haptic feedback.

## Files Touched
- 6 hero images (4 re-rendered, 2 new) + 3 sprite PNGs
- `src/pages/PrototypeEnergyFlow.tsx`
- `src/components/dashboard/EvChargingCable.tsx` (extend)
- `src/components/dashboard/TeslaStatusCard.tsx` (new, with hero/secondary variants)
- `src/components/dashboard/WeatherSkyOverlay.tsx` (new)
- `.lovable/memory/features/live-energy-flow-card-spec.md` (v5 append)
