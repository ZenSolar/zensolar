# Dashboard Charging-State Redesign

The screen recording you shared is the Tesla app while ZenX is plugged in. That's the visual bar: a big vehicle hero with a live green charging cable, a calm icon strip, one dense data row, and a slim progress bar. Right now ZenSolar's `ZenDriveLiveCard` has all the same information but reads as several stacked pills + a small static car image + two square tiles. This plan brings it up to Tesla-app polish for the charging state specifically, without touching business logic.

## Scope
Frontend/presentation only. Files:
- `src/components/dashboard/ZenDriveLiveCard.tsx` — main restructure
- `src/components/dashboard/LiveEnergyMonitoringCard.tsx` — reuse/adjust `EVTile` where needed
- New: `src/components/dashboard/ChargingHero.tsx` — the Tesla-style vehicle + cable hero

No changes to telemetry hooks, detection logic, edge functions, or the Tesla AC/DC classification (that fix from earlier stays).

## What changes visually

**1. New charging hero (replaces current static image + separate pill)**
```text
┌──────────────────────────────────────────┐
│ ZenX  ⌄                    59%  ⚡        │  ← name, SOC%, charging bolt (green)
│ 3h 12m to 82% limit                       │  ← ETA line (muted)
│                                            │
│         ▄▄▄▄████████▄▄▄                   │
│      ██████████████████████               │  ← car hero, bigger (h-40)
│     ██████████████████████████            │
│        ●●●●●●●═════════════               │  ← animated green cable → port
│                                            │
│ ● Charging from your solar · 11.0 kW      │  ← single source line
└──────────────────────────────────────────┘
```
- Car image scaled up (~h-40 on mobile), centered, dramatic shadow.
- Animated SVG cable path with flowing green dots (respects `prefers-reduced-motion`).
- SOC% + charging bolt promoted to a top-right cluster, replacing the current standalone EVTile header.
- ETA to charge limit pulled from existing `charge_state` fields (`minutes_to_charge_limit`).

**2. Collapse the redundant data row into one dense line (Tesla-style)**
Current: multiple pills + tiles stacked. New: one `text-[13px] text-muted` row directly under the hero:
```
11.0 kW  ·  +36 mi/hr  ·  47/48 A  ·  246 V  ·  59% → 82%
```
Values already available in `primaryEv.payload.charge_state`.

**3. Slim progress bar**
Replace the current EVTile's 7d line-chart with a single Tesla-style progress bar showing current SOC → charge limit. The 7d Home/Super history moves down as a secondary collapsed section (tap to expand) so it doesn't compete with the live state.

**4. Charging source pill upgrade**
Keep the "Charging from your solar / Powerwall / grid / Supercharger" line — but move it *inside* the hero card, right under the ETA, as one calm line with the green pulsing dot. Remove the separate bordered green box.

**5. Home & AC / Supercharging tiles — condensed**
Today they're two chunky tiles below. Convert to a single 2-column strip with smaller type (h-14 instead of h-20), matching the density of Tesla's status row. Keep the blue/orange accent hairline on the left edge only.

**6. Idle vs charging states**
- `isCharging === true`: full hero with animated cable, ETA, live data row.
- `isCharging === false`: same layout but cable is static/dim, ETA replaced with "Ready · Last charged 2h ago", data row hidden.

## Technical notes
- All colors via semantic tokens (`--primary`, `--emerald`, `--muted-foreground`, etc.) — no hardcoded hex.
- Animation via CSS `@keyframes` (dashoffset on SVG path). No new dependencies.
- Respects `useSoundPreference` and existing reduced-motion handling.
- No changes to `deriveTeslaFlow`, `useActiveChargingSession`, or edge functions.
- No new routes, no new backend calls.

## Out of scope
- Live Energy Flow hero (solar/battery/grid) — untouched this pass.
- Solar Produced / Battery kWh Exported tiles — untouched.
- Dashboard section ordering — untouched.
- Any minting or business logic.

## Design directions
After you approve this plan, next step is to run design--create_directions against a screenshot of your current ZenDriveLiveCard (charging state) with the Tesla reference locked in, then show you 3 rendered variants of the hero to pick from before I build.
