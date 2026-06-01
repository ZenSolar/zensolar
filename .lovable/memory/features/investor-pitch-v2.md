---
name: Investor Pitch v2
description: Canonical /investor/pitch + ThreeRevenueEngines module. Flywheel, engine order, ask, multi-OEM moat. Updated Jun 2026 video-feedback pass.
type: feature
---

# Investor Pitch v2 (SSOT)

## Canonical surfaces
- **`/investor/pitch`** (`src/pages/InvestorPitch.tsx`) — full canonical narrative page. Wired into the NDA-gated `/investor` flow.
- **`<ThreeRevenueEngines />`** (`src/components/investor/ThreeRevenueEngines.tsx`) — embedded inline on `/investor` (post-NDA) and on `/investor/pitch`.
- **Pitch deck** (`src/components/investor/pitch/slides/*`) — Slide 01 (Title), Slide 09 (Revenue), Slide 13 (The Ask) carry the locked numbers.

Don't add net-new investor narrative pages. Update these or archive them via the admin page-cleanup widget.

## Locked ask
$5M target · $20M post-money · $7M hard cap · Strategic Seed (SAFE, post-money).

## Locked revenue engine order (Jun 2026 — supersedes Feb 2026 lock)
1. **Subscription + Token Economics (combined)** — paid base sub is the price of entry to mint. Tiers $9.99 / $19.99 / $49.99. 50% LP / 50% treasury per sub dollar. Funds a 1T-cap token (75/20/3/2 split, $0.10 launch, 7% transfer tax compounds LP + treasury).
2. **Deason AI** — $4.99/mo **premium add-on / upgrade** layered on any base sub. Monthly Clean Energy Report, bill analysis, rate-plan optimization, device-aware advice. Highest-margin recurring revenue per user.
3. **Aggregated Energy Data** — anonymized multi-OEM telemetry to utilities/ISOs/REC registries/climate researchers.

Token Economics is no longer a standalone engine; it's the *asset* powered by Engine 01's subscription cash. Deason is its own engine but always framed as the premium upgrade — never standalone.

## Flywheel headline
Verified kWh → Data → AI → $ZSOLAR
(Mapped: Paid Sub → Verified kWh → Data + AI → Token Demand → Paid Sub.)

## Page flow on /investor/pitch
Hero → The Catalyst → Three Revenue Engines → The Ask → footer mailto (`joe@zensolar.com`).
**Removed (Jun 2026 video pass):** "Why Us" founder bio section, "Schedule a Call" button. Single quiet mailto in footer is the only contact path on-page.

## /investor (post-NDA) cards
Pitch v2 · Live Demo · Full Seed Pitch · Tokenomics. Founder Bios and Schedule a Call cards removed; single mailto sits under the card grid.

## Foundational moat
First-of-its-kind multi-OEM monitoring (Tesla + Enphase + SolarEdge + Wallbox in one UI). Surface in every framing — it's the prerequisite for all three engines.

## VPP
Out of scope at seed except as a future-milestone reference.

## Archived/superseded
Old investor pages (admin-investor-pitch v1, founders/spacex, founders/app-overhaul, founders/lyndon-pitch-v2, founders/seed-pitch-companion-deck, etc.) redirect to `/investor/pitch`. Flag any newly discovered legacy pitch pages via the admin floating widget for archive — do not delete.
