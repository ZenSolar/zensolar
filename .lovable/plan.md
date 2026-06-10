## Update Full Seed Round Deck for Two-Part Seed Strategy

Surgical, messaging-only edits to four existing v3 slide files. No new slides, no new imports, no layout overhaul. Semantic tokens preserved.

### 1. `src/components/investor/pitch/slides/v3/S01Hero.tsx`
- Eyebrow → `Investor Pitch · v3 · Seed Round · Part 1 of 2 · Confidential`.
- Append a second paragraph under the existing PoG subhead: "Part 1 launches the token and ignites the flywheel. Part 2 scales once traction is proven — with the goal of reaching self-sustainability without needing a traditional Series A."
- Replace the 3-stat row with:
  - `$2.5M – $3.5M` / Part 1 — Now
  - `Two-Part` / Seed strategy
  - `Convertible Note` / Instrument
- Drop stat number size to `text-[44px]` so `$2.5M – $3.5M` fits.

### 2. `S03Opportunity.tsx`
- Insert a new non-emphasized `DeckCard` between the TAM grid and the existing "One patent · multiple markets" emphasized card.
- Kicker: `Proof-of-Work vs Proof-of-Genesis™`.
- Body (exact): "Bitcoin's Proof-of-Work consumes enormous amounts of energy to create digital scarcity with no direct environmental benefit. ZenSolar's Proof-of-Genesis™ rewards the actual creation of clean energy — one verified clean kilowatt-hour produced generates one $ZSOLAR token. We turn energy abundance into digital value instead of consuming massive energy to create artificial scarcity."

### 3. `S09ScaleOpportunity.tsx`
- Replace the closing italic line with a non-italic, soft-bordered `DeckCard`.
- Kicker: `The Long-Term Vision`.
- Body (exact): "With strong execution, the combination of real utility, a self-reinforcing 100% subscription-to-LP flywheel, and expanding rewardable behaviors positions ZenSolar to acquire millions of users and generate substantial recurring revenue. The tokenomics are designed so that success compounds — as user acquisition grows, the flywheel creates structural pressure toward significant long-term value creation, with the potential for $ZSOLAR to become one of the most important clean energy infrastructure tokens globally."

### 4. `S11Ask.tsx`
- Replace `useOfFunds` array (drop `amt`/`pct`/`note`, use range only):
  - Token Launch & Liquidity — $625K – $875K
  - Legal, Compliance & Audits — $500K – $700K
  - App Polish & Onboarding — $375K – $525K
  - Growth & User Acquisition — $375K – $525K
  - Operational Runway (18–24 months) — $625K – $875K
- Switch table row grid to 2 columns (bucket / range). Drop the Total/100% summary row and replace with a small italic footnote: "Indicative allocations across the $2.5M – $3.5M Part 1 range."
- Card kicker → `Use of Funds · Part 1 ($2.5M – $3.5M)`.
- `SectionHeader`:
  - title: `Seed Round — Part 1 of 2 · $2.5M – $3.5M · Convertible Note.`
  - subtitle: "Part 1 launches the token and ignites the flywheel. Part 2 scales once traction is proven — designed to reach self-sustainability without a traditional Series A."
- Milestones list: replace "Series A in 18–24 months" with "Path to self-sustainability (no Series A required)".
- Replace the `76%` Capital-efficiency card with a "What Part 2 unlocks" card — Kicker: `What Part 2 unlocks`; Body: "Scale user acquisition, deepen liquidity, and expand rewardable behaviors once Part 1 milestones are achieved and the flywheel is validated."
- Keep the closing flourish: "Bitcoin tokenized scarcity. We're tokenizing abundance."

### 5. `DeckPinGated.tsx`
No changes.

### Constraints
- Only the four slide files above. No new imports (`DeckCard`/`CardKicker`/`SectionHeader` are already imported in each).
- Preserve gradients, headers, footers, semantic color tokens.
- Verify deck at desktop and 390×844; confirm no slide overflows.
