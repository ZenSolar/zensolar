---
name: Investor Pitch v2
description: Canonical /investor/pitch page + ThreeRevenueEngines module. Flywheel, engine order, ask, multi-OEM moat.
type: feature
---

# Investor Pitch v2 (SSOT)

## Canonical surfaces
- **`/investor/pitch`** (`src/pages/InvestorPitch.tsx`) — full canonical narrative page. Wired into the NDA-gated `/investor` flow.
- **`<ThreeRevenueEngines />`** (`src/components/investor/ThreeRevenueEngines.tsx`) — embedded inline on `/investor` (post-NDA) and on `/investor/pitch`.
- **Pitch deck** (`src/components/investor/pitch/slides/*`) — Slide 01 (Title), Slide 09 (Revenue), Slide 13 (The Ask) carry the locked numbers.

Don't add net-new investor narrative pages. Update these or archive them via the admin page-cleanup widget.

## Locked ask (Feb 2026)
$5M target · $20M post-money · $7M hard cap · Strategic Seed (SAFE, post-money).

## Locked revenue engine order
1. **Token Economics** — primary driver (1T cap, 75/20/3/2, $0.10 launch, 7% transfer tax).
2. **Monthly Subscription** — $9.99 / $19.99 / $49.99 tiers, 50% LP / 50% treasury. **Deason AI = $4.99/mo premium add-on** delivering the Monthly Clean Energy Report.
3. **Aggregated Energy Data** — anonymized multi-OEM telemetry to utilities/ISOs/REC registries.

Deason is the premium add-on, never a standalone engine.

## Flywheel headline
Verified kWh → Data → AI → $ZSOLAR

## Foundational moat
First-of-its-kind multi-OEM monitoring (Tesla + Enphase + SolarEdge + Wallbox in one UI). Surface this in every investor framing — it's the prerequisite for all three engines.

## VPP
VPP stays out of the pitch except as a future milestone. Not in seed scope.

## Archived/superseded
Old investor pages (admin-investor-pitch v1, founders/spacex, founders/app-overhaul, founders/lyndon-pitch-v2, founders/seed-pitch-companion-deck, etc.) redirect to `/investor/pitch`. Flag any newly discovered legacy pitch pages via the admin floating widget (bottom-left) for archive — do not delete.
