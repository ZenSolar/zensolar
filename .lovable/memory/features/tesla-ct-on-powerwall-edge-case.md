---
name: Tesla CT-on-Powerwall edge case + Tesla Solar/PW card reference
description: Tesla Powerwall app reads Enphase solar via solar CTs clamped on the Powerwall gateway. Non-standard install; ZenSolar must detect via Enphase connection to avoid double-counting.
type: feature
---

# Tesla Solar/Battery/Grid Card — Reference + CT-on-Powerwall Edge Case

## Tesla card visual reference (ZenCasa, 2026-06-12 recording)
Frames: `src/assets/tesla-reference/tesla-solar-pw-ref-03.jpg.asset.json`, `tesla-solar-pw-ref-08.jpg.asset.json`

What Tesla renders on the unified Solar+PW+Grid card:
- 3D isometric house (dark, night sky), solar panels on roof
- Powerwall unit on side of house (green status LED visible)
- **Thin leader lines from each node to floating KPI label** — no overlapping
- KPI labels: `SOLAR 4.8 kW` (top-center), `HOME 1.7 kW` (top-right), `POWERWALL 0 kW · 100%` (bottom-left), `GRID 3.1 kW` (bottom-right)
- **Animated flow lines as colored conduits** running through/under the house:
  - Yellow line = solar flowing (to home + to grid in this frame)
  - Powerwall idle (gray/no flow)
- Below the diagram: `Energy / Impact / Settings / Go Off-Grid` row list (matches Tesla's per-OEM detail pattern)
- "8.6 kWh Generated Today" + "50% Self-Powered Today" as compact sub-stats

This is the canonical aesthetic to mirror for Tier 2 Tesla Solar/PW detail card AND informs Tier 1 unified composition (leader-lines + colored conduits + isometric house, NOT overlapping pills).

## The CT-on-Powerwall edge case (Joseph's ZenCasa install)
Joseph's installer clamped **solar CTs onto the Powerwall Gateway**, so the Tesla app *reads Enphase production* and reports it as "Solar 4.8 kW" — even though the panels/inverters are 100% Enphase.

### Why this matters for ZenSolar
**YES — ZenSolar would (and must) detect this when the user connects Enphase.** Here's how the SSOT resolver handles it:

Per `src/lib/dataSourcePriority.ts` and `mem://features/data-source-of-truth.md`:

| Connected | Solar source | Battery source | Risk if mis-resolved |
|---|---|---|---|
| Enphase only | Enphase | none | — |
| Tesla PW only | Tesla (CT reading) | Tesla | acceptable proxy |
| **Enphase + Tesla PW** (Joseph) | **Enphase (priority)** | **Tesla** | **Double-count if both summed** |

Resolver rule (already locked):
- **Solar KPI** = `solar_inverter_brand` priority → if Enphase connected, ALWAYS use Enphase. Tesla PW solar CT reading is **discarded** for KPI/mint purposes.
- **Battery KPI** = Powerwall > Enphase > SolarEdge → Tesla wins.
- **Powerwall CTs NEVER count as solar** (core memory line 21).

So Joseph's mint reads Enphase production (truth), and the Tesla PW card's "Solar 4.8 kW" is treated as a derived view — not a second solar source.

### Non-standard install flag
Most users don't have solar CTs on the Powerwall (standard installs put CTs at the main panel, and Tesla shows `Solar 0 kW` when no Tesla Solar is paired). We should:
1. **Detect mismatch:** if Tesla `solar_power > 0` AND Enphase is the resolved solar source, log `oem_diagnostic_log` entry `tesla_ct_clamp_detected` so Deason can explain it to the user.
2. **Surface in Energy Sources card:** "Tesla is reading your Enphase solar via CTs on the Powerwall — we're using Enphase as your source of truth to avoid double-counting."
3. **Never expose Tesla's solar number** in any KPI/mint surface when Enphase is connected.

## Implications for Tier 1 unified Flow Card (Remix)
- When BOTH Enphase + Tesla PW are connected → render ONE solar node (Enphase-labeled), ONE battery node (Tesla PW), connected to same house. No duplicate solar.
- Flow lines use Tesla's color language: yellow=solar-out, green=PW-charge, blue=PW-discharge, gray=grid-import, yellow=grid-export
- Adopt Tesla's leader-line label pattern (already in v4 prototype) — confirmed working visual

## Status
- ✅ Reference frames pinned
- ✅ CT-on-PW edge case documented; resolver already handles it correctly
- ⏳ Add `tesla_ct_clamp_detected` diagnostic + Energy Sources card copy (Remix v1)
