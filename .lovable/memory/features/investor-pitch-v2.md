---
name: Investor Pitch v2
description: Canonical /investor/pitch + ThreeRevenueEngines. Full Seed Round Deck v3.1 (11 slides) is canonical at /deck and mirrors the /investor aesthetic. VPP gets a dedicated deck slide only — still excluded from /investor, /investor/pitch, and the one-pager.
type: feature
---

# Investor Pitch v2 (SSOT)

## Canonical surfaces
- **`/investor/pitch`** (`src/pages/InvestorPitch.tsx`) — full canonical narrative page. Wired into the NDA-gated `/investor` flow.
- **`<ThreeRevenueEngines />`** (`src/components/investor/ThreeRevenueEngines.tsx`) — embedded inline on `/investor` (post-NDA) and on `/investor/pitch`.
- **Full Seed Round Deck v3.1** (`/deck` → `src/pages/DeckPinGated.tsx` + `src/components/investor/pitch/slides/v3/*` + primitives in `src/components/investor/pitch/v3/`) — **11 slides**, refreshed Jun 2026 to mirror the /investor aesthetic (calm, card-based, dark, secondary-glow divider motif). Slide list: 01 Title · 02 Catalyst · 03 Opportunity · 04 Traction · 05 Solution · 06 Foundational Moat · 07 Tech & IP · 08 Three Revenue Engines · 09 Scale Opportunity (Data + VPP) · 10 Competition · 11 The Ask. Old 15-slide set (`slides/Slide*.tsx`) is on disk for one release for diffing — flag for archive via the admin page-cleanup widget after v3.1 ships. NEVER call this "Full Pitch Deck" — always "Full Seed Round Deck".
- **One-Pager** (`/investor/one-pager` → `src/pages/InvestorOnePager.tsx`) — single-screen leave-behind. NDA-gated. Real app screenshots (`public/investor/one-pager/zen-monitoring.png` + `tap-to-mint.png`). Print-friendly (`@page Letter portrait`). DOES NOT show `$20M post-money` — only `$5M target / $7M cap / SAFE` (post-money kept on Slide 11 of deck). Drops in Wallbox alongside Tesla/Enphase/SolarEdge in the moat copy.

Don't add net-new investor narrative pages. Update these or archive them via the admin page-cleanup widget.

## Locked ask
$5M target · $20M post-money · $7M hard cap · Strategic Seed (SAFE, post-money).

## Locked revenue engine order (Jun 2026 corrections — supersedes earlier locks)
1. **Monthly Subscription + Deason AI** — paid base sub is required to be a ZenSolar user and mint $ZSOLAR. Tiers $9.99 / $19.99 / $49.99. Deason AI = **$4.99/mo premium add-on** on top of any tier (Monthly Clean Energy Report, bill analysis, rate-plan optimization, device-aware advice). 50% LP / 50% treasury per sub dollar.
2. **Token Economics** — core product and primary long-term revenue driver. 1T hard cap, 50/25/20/5 mint split (50% user · 25% LP direct · 20% burn · 5% treasury), $0.10 LP-seeded launch on Base, separate 3% transfer tax (LP recycle only) compounds liquidity + treasury yield perpetually.
3. **Aggregated Energy Data** — anonymized multi-OEM telemetry to utilities/ISOs/REC registries/climate researchers.

Deason lives inside Engine 01 as the premium upgrade — never positioned as standalone. Token Economics is back as its own engine and framed as the long-term primary revenue driver.

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
**VPP gets a dedicated slide in the Full Seed Round Deck v3.1 only (Slide 09 — Scale Opportunity).** Framed as "the first Virtual Power Plant that issues crypto rewards directly to participants via Proof-of-Genesis™" with a Phase 2 anchor strip (Leap Energy → CAISO → OEM partner-tier APIs). **Still excluded from `/investor`, `/investor/pitch`, and the one-pager** — those surfaces keep VPP as a future-milestone reference only. Do not promote VPP to /investor/pitch without a separate, deliberate update to this memory.

## Archived/superseded
Old investor pages (admin-investor-pitch v1, founders/spacex, founders/app-overhaul, founders/lyndon-pitch-v2, founders/seed-pitch-companion-deck, etc.) redirect to `/investor/pitch`. Flag any newly discovered legacy pitch pages via the admin floating widget for archive — do not delete.
