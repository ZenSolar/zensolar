## Goal
Make `/seed` and its sub-pages 100% consistent with the lean ask. Instrument everywhere: **Convertible Note + 10% Token Warrant (4-year vesting, 1-year cliff)**. Ask everywhere: **$1M Target · $2M Hard Cap**. No "SAFE", "Strategic Seed", "$2.5M", "$3.5M", "Part 1" anywhere on `/seed/*`.

## Files

### 1. `src/pages/Seed.tsx` (edit)
- Remove the green **Schedule a Call** button (and `Phone` import).
- Add a fourth CTA **One-Pager** → `/seed/one-pager` so the grid stays balanced.
- Re-point CTAs:
  - View Full Deck → `/seed/deck`
  - Enter Data Room → `/seed/data-room`
  - One-Pager → `/seed/one-pager`
  - See Live Demo → `/demo?demo=investor`
- Footer "Data Room →" link → `/seed/data-room`.
- Under hero stats add a single line: *"Instrument: Convertible Note + 10% Token Warrant · 4-year vesting · 1-year cliff."*
- Keep the existing use-of-funds table verbatim (Joseph $250K, LP $200K, Legal $55K, Audits $40K, Ops $15K, Buffer $440K).
- Keep flywheel line: "100% of every user subscription goes directly into the $ZSOLAR Liquidity Pool."

### 2. `src/pages/SeedOnePager.tsx` (new, route `/seed/one-pager`)
Single-page printable summary, dark theme, mirrors `InvestorOnePager` visual rhythm but contains ONLY:
- Hero: "ZenSolar — Lean Seed Round" · $1M / $2M / Convertible Note + 10% Token Warrant
- Three stat tiles: `$1M Target`, `$2M Hard Cap`, `Conv. Note + 10% Warrant`
- Flywheel one-liner (100% → LP)
- Use-of-funds table (identical 6 rows + Total)
- Two revenue-engine cards (Aggregated Data, Deason AI $4.99/mo)
- Footer CTAs back to `/seed`, `/seed/deck`, `/seed/data-room`
- Helmet title + canonical `https://www.zensolar.com/seed/one-pager`

### 3. `src/pages/SeedDeck.tsx` (new, route `/seed/deck`)
Long-form narrative deck, single scrollable page (not slide carousel) styled like `/investor/pitch` but lean-ask only. Sections:
1. Hero — "$1M / $2M · Convertible Note + 10% Token Warrant (4y vesting, 1y cliff)"
2. Why this round is different — lean, 100% subs → LP, no Series A required
3. The Flywheel (Subscribe → LP deepens → adoption)
4. Three revenue engines (Subscription+Deason, Token Economics, Aggregated Data)
5. Multi-OEM moat (Tesla + Enphase + SolarEdge + Wallbox)
6. Use of Funds — same 6-row table
7. Milestones funded by $1M (LP seeded at $0.10, audited mainnet TGE, first 1k paying subs)
8. Closing CTA row → `/seed/data-room`, `/seed/one-pager`, `/demo?demo=investor`
- No VPP slide, no post-money cap, no Part 1/Part 2.

### 4. `src/pages/SeedDataRoom.tsx` (new, route `/seed/data-room`)
Mirror of `InvestorDataRoom` visual cards, but ask block + use-of-funds replaced. Sections:
- Hero stat tiles: `$1M Target`, `$2M Hard Cap`, `Conv. Note + 10% Warrant`, `4y vest / 1y cliff`
- Round summary paragraph (lean, founder-led, 100% subs → LP)
- Use of Funds (same 6 rows)
- Milestones funded
- Proof-of-Genesis + multi-OEM moat + IP cards (re-use copy/components from existing data room where they don't mention numbers)
- Contact: `joe@zensolar.com`
- No SAFE / Strategic Seed / Part 1 / $2.5–3.5M anywhere.

### 5. `src/App.tsx` (edit)
Add three lazy imports next to existing `Seed` import and three `<Route>` entries inside the same `Routes` block as `/seed`:
- `/seed/one-pager` → `SeedOnePager`
- `/seed/deck` → `SeedDeck`
- `/seed/data-room` → `SeedDataRoom`

### 6. Memory
Append to `mem://features/investor-pitch-v2.md` (and update index entry): document that `/seed/*` is the **lean-ask surface** locked to $1M/$2M + Convertible Note + 10% Token Warrant, fully separate from `/investor/*` (Strategic Seed). Cross-linking between the two surfaces is forbidden — they describe different round structures.

## Out of scope
- No edits to `/investor/pitch`, `/investor/one-pager`, `/investor/data-room`, `/investor/why-this-round`, deck v3 slides, or `<ThreeRevenueEngines/>`.
- No new scheduling/Calendly integration.
- No edits to `/demo`.

## Final reply
After all six items land, reply EXACTLY:
"/seed ecosystem fully aligned — all pages now show $1M target / $2M hard cap + Convertible Note + token warrant, no legacy numbers remain."
