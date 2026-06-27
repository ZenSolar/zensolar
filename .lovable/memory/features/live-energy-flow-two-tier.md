---
name: Live Energy Flow — Two-Tier Architecture (LOCKED for REMIX)
description: Decision record. Unified multi-OEM Flow Card is the hero/moat; per-OEM detail cards are the drill-down. Both ship in Remix v1.
type: feature
---

# Two-Tier Live Energy Flow (LOCKED)

## Decision
Remix v1 ships BOTH surfaces. They are complementary, not alternatives.

### Tier 1 — Unified Whole-Home Flow Card (HERO / MOAT)
- ONE diagram, every connected OEM as a node on the same house
- Energy flows between nodes in real time across vendor boundaries
- Composition driven by `useDetectedAssets()` — onboarding tells us what user connected, card auto-composes only those nodes
- New device added later → asset detection re-runs → card re-composes automatically
- Spec: `mem://features/live-energy-flow-card-spec.md` (variants, multi-Powerwall sprite, 3D perspective flow lines, radial ring)
- **This is the investor moat.** Tesla can't render it (Tesla-only). Enphase can't (Enphase-only). SolarEdge can't. Nobody else combines cross-OEM into one live picture.

### Tier 2 — Per-OEM Detail Cards (Tesla-pattern drill-down)
- Individual card per device, modeled on Tesla app's separate Vehicle / Wall Connector / Solar cards
- Each card owns its OEM-specific depth: Powerwall reserve %, Enphase per-panel, vehicle climate/range, Wall Connector session log
- Tap any node in the Tier 1 unified card → scroll to / open matching Tier 2 detail card
- Wall Connector is its OWN card even when the car is plugged into it (matches Tesla's mental model). Auto-linked in Tier 1 flow via geofence + timing from `tesla-charge-monitor`.

## Canonical demo fixture (Joseph's house)
Hardest combo we render — if this works, every subset works:
- **Solar:** Enphase PV (installed by Tri Smart Solar)
- **Battery:** Tesla Powerwall 2 (installed by Smart Charge America)
- **EV:** Tesla Model X (ZenX) — real Tesla Fleet API
- **EV Charger:** ChargePoint Home Flex — NO ChargePoint API; charging data inferred from Model X onboard telemetry (geofence + charge session timing)

Use this in InvestorEnergyFlowCard fixture + `useInvestorDemoMode()`.

## Tesla reference frames (user-recorded 2026-06-26)
Pinned visual references for the Tier 2 per-card pattern:
- `src/assets/tesla-reference/tesla-card-ref-02.jpg.asset.json`
- `src/assets/tesla-reference/tesla-card-ref-05.jpg.asset.json`
- `src/assets/tesla-reference/tesla-card-ref-08.jpg.asset.json`
- `src/assets/tesla-reference/tesla-card-ref-11.jpg.asset.json`
Shows Tesla's separation of Wall Connector card vs Vehicle status card during an active charging session at user's second home.

## Build order in Remix
1. Unified Flow Card composition engine + Joseph's fixture (investor demo works day-1)
2. Per-OEM detail cards (Tesla Vehicle, Tesla Wall Connector, Tesla Powerwall, Enphase Solar, SolarEdge Solar, ChargePoint-via-Tesla)
3. Tap-to-drill-down wiring between the two tiers
4. Asset-change listener → re-compose Tier 1 + add/remove Tier 2 cards live

## Out of scope (do NOT pursue)
- Trying to make Tier 1 work WITHOUT Tier 2 ("one card for everything")
- Trying to ship Tier 2 WITHOUT Tier 1 ("just copy Tesla, give up on unified")
Both failures abandon the differentiator. Ship both.

## Status
- ✅ Decision locked
- ✅ Reference frames archived
- ⏳ Implement in Remix v1 (do NOT bolt onto legacy app)
