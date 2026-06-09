## Plan: Build /investor/solarcoin-comparison

### Files
1. **Create `src/pages/InvestorSolarCoinComparison.tsx`** — full self-contained page styled to match `/investor/why-this-round` (same `max-w-3xl`, dark bg, back-link, header eyebrow, section spacing `mt-16 md:mt-20`).
2. **Edit `src/App.tsx`** — add lazy import next to `InvestorWhyThisRound` and register route `/investor/solarcoin-comparison`.

### Page structure
1. **Hero / Executive Summary** — H1 "ZenSolar vs SolarCoin: The Next Generation of Clean Energy Tokenization" + the exact 4-paragraph summary copy provided.
2. **At-a-Glance Strategic Advantages** — 4 icon cards (Proof-of-Genesis™, Embedded Wallet + Tap-to-Mint™, Multi-vertical TAM, 100% sub→LP flywheel).
3. **Detailed Comparison** — 8 side-by-side comparison cards rendered as 2-column grids with ✓/✗ icons, stacking on mobile. Covers: Blockchain & Technical History, UX & Friction, Reward Scope & TAM, NFT Strategy & Milestones, IP & Patents (calls out U.S. Patent App No. 19/634,402), Tokenomics & Flywheel (100% subs → LP, 1T cap, 20% burn), Ecosystem Reach (Tesla/Enphase/SolarEdge/Wallbox + Palmetto API), Additional Revenue Streams (VPP + data aggregator).
4. **Why ZenSolar Wins** — 5-bullet closing + CTA buttons to `/investor` and `/investor/why-this-round`.

### Constraints
- No new dependencies; lucide-react icons only.
- Semantic design tokens only (`bg-card`, `text-secondary`, `border-border`, etc.).
- Mobile-first; columns collapse cleanly at 390px.
- No changes to any other file.
