
# Full Seed Round Deck v3.1 — 11 Slides (ready to ship)

All code is staged. Switch to build mode and I'll write 16 files in parallel.

## Files to create

**Primitives** (`src/components/investor/pitch/v3/`):
- `SectionHeader.tsx` — kicker + title + the 1px secondary-glow divider motif
- `DeckCard.tsx` + `CardKicker` export — mirrors `CatalystCard` / `EngineCard`
- `StatPill.tsx` — stat row reused on hero + ask

**Slides** (`src/components/investor/pitch/slides/v3/`):
- `S01Hero.tsx` — variant="dark", `$5M / $7M / SAFE` stat row, founders byline
- `S02Catalyst.tsx` — 3 cards: $1.7T market · Patent-pending · Multi-OEM moat (emphasized)
- `S03Opportunity.tsx` — TAM/SAM/SOM stat cards + One Patent · Multiple Markets row
- `S04Traction.tsx` — 4 hero stats + 3-col OEMs/Protocol/IP grid
- `S05Solution.tsx` — `1 kWh = 1 $ZSOLAR` headline + Produce→Verify→Mint→Retire flow
- `S06FoundationalMoat.tsx` — 3 walls (IP · Multi-OEM · Verification stack)
- `S07Tech.tsx` — SEGI™ emphasized card + 4-layer stack (L1–L4)
- `S08ThreeEngines.tsx` — Flywheel headline + 3 engine cards (Engine 02 emphasized amber-400)
- `S09ScaleOpportunity.tsx` — Aggregated Data top + ZenSolar VPP bottom (emphasized) + Phase 2 anchor strip
- `S10Competition.tsx` — 4 threat cards with "Our wedge" callouts
- `S11Ask.tsx` — Use of Funds table (5 rows, verbatim from `/investor/pitch`) + milestones + capital efficiency

**Page wiring**:
- `src/pages/DeckPinGated.tsx` — swap to v3 imports and 11-slide labels. PIN flow, session storage, throttle behavior untouched.

**Memory updates**:
- `mem://features/investor-pitch-v2.md` — note v3.1 deck is canonical at /deck; VPP gets dedicated deck slide only
- `mem://features/vpp-settlement.md` — add "Deck positioning" section with Slide 09 framing + Phase 2 anchor copy
- `mem://index.md` — refresh Investor Pitch v2 description line

## Aesthetic system (locked across all 11 slides)

- Background: `variant="dark"` for Title + Solution + Competition + Ask · `variant="gradient"` for content slides
- Per-slide soft radial-gradient: `radial-gradient(ellipse at top, hsl(var(--secondary) / 0.14), transparent 55%)`
- Cards: `rounded-2xl border border-border/60 bg-card/40` · emphasized uses `border-secondary/40 bg-secondary/5`
- Accents: `text-eco` (Subscription) · `text-amber-400` (Token Economics + Capital efficiency) · `text-sky-400` (Data + Tech) · `text-secondary` (brand)
- Deck-wide motif: 1px secondary-glow horizontal divider under every `SectionHeader` title
- Icons: lucide-react only (CreditCard, Sparkles, Coins, Database, ArrowRight, Zap, Shield, Sun, Lock, Layers, FileLock2, Factory, Cpu, Fingerprint, FileCheck)

## Content locks honored

- Ask: `$5M target · $7M hard cap · SAFE (post-money)` · $20M post-money referenced on Slide 11 only
- Engine 02 framed as "Core product and primary long-term revenue driver" with amber-400 emphasis
- Multi-OEM moat names Tesla + Enphase + SolarEdge + Wallbox on Slides 02, 05, 06, 08, 09
- Mint split (50/25/20/5 + separate 3% transfer tax) on Slide 08 only
- VPP claim "first VPP that issues crypto rewards directly to participants via Proof-of-Genesis™" on Slide 09 only
- Founders: Joseph Maushart + Michael Tschida (Slide 01 byline)
- Old `slides/Slide*.tsx` files left on disk for diff; flag for archive via admin widget after v3.1 ships

## Final reply on completion

> Seed Round Deck v3.1 complete — 11 slides with dedicated Scale Opportunity slide for Aggregated Data + VPP.
