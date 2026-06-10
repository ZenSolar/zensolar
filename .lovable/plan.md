## Investor Data Room — Two-Part Seed Consistency

Surgical messaging updates to `src/pages/InvestorDataRoom.tsx` only. No new components or imports.

### 1. Hero (lines ~53–90)
- Update `<meta name="description">` to: "ZenSolar investor data room — Proof-of-Genesis™, VPP, aggregated data, traction, and IP. Two-part seed strategy ($2.5M–$3.5M Part 1)."
- Add eyebrow line "Seed Round — Part 1 of 2" (secondary color) above the existing "Confidential · Investor Data Room" line.
- Replace subhead paragraph with: "Deeper materials behind the seed deck — technology, revenue engines, raise milestones, traction, and IP. Part 1 launches the token and ignites the flywheel. Part 2 scales once traction is proven — designed to reach self-sustainability without a traditional Series A."

### 2. Round Overview (new row directly under the hero glow divider)
Three `StatTile`s in a `grid-cols-1 md:grid-cols-3 gap-3`:
- `$2.5M – $3.5M` / "Part 1 — now" (emphasized)
- `Convertible Note` / "Instrument"
- `Two-Part Seed` / "Path to self-sustainability"

### 3. Related materials (new small card just below the overview)
Subtle bordered card titled "Related materials" with 3 `Link`s (One-Pager, Why This Round, Full Deck), each with a one-line description tying to the two-part seed framing.

### 4. Section 04 · Use of Funds (lines ~227–252)
- Retitle to "Part 1 ($2.5M – $3.5M) — Use of Funds & Milestones".
- Replace the 4 percentage `StatTile`s with 5 bucket rows (name + dollar range, using simple bordered row divs — no new components):
  - Token Launch & Liquidity — $625K – $875K
  - Legal, Compliance & Audits — $500K – $700K
  - App Polish & Onboarding — $375K – $525K
  - Growth & User Acquisition — $375K – $525K
  - Operational Runway (18–24 months) — $625K – $875K
- Add footnote: "Indicative allocations across the $2.5M – $3.5M Part 1 range."
- Append milestone bullet: "Path to self-sustainability (no Series A required)."

### 5. Cleanup
- Remove all "$5M Seed" language.
- VPP, Aggregated Data, Traction, Legal & IP sections untouched.
- No new imports beyond existing `Link`, `ArrowRight`, `StatTile`, `DeckCard`, `CardKicker`.
