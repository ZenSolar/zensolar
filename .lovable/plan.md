## Update One-Pager for Two-Part Seed Strategy & Consistency

Surgical, messaging-only update to `src/pages/InvestorOnePager.tsx`. No new files, no layout overhaul, design tokens preserved.

### 1. Header / Hero (top)
- Eyebrow above logo block: change `Strategic Seed · One-Pager · Confidential` → `Seed Round · Part 1 of 2 · One-Pager · Confidential`.
- Hero section: keep the "Bitcoin tokenized scarcity / ZenSolar tokenizes abundance" headline, keep the existing 1-line PoG subhead, and ADD a second short paragraph directly under it:

  "Part 1 launches the token and ignites the flywheel. Part 2 scales once traction is proven — with the goal of reaching self-sustainability without needing a traditional Series A."

### 2. The Ask section
Replace the existing 3-stat grid ($5M / $7M / Convertible Note) with two-part seed numbers and add a strategy note:
- Stats (3 tiles): `$2.5M – $3.5M` (Part 1 — now) · `Two-Part` (Seed strategy) · `Convertible Note` (Instrument)
- One-line note below the grid (small muted text): "Part 2 scales once Part 1 traction is proven — designed to reach self-sustainability without a traditional Series A."

### 3. NEW: Use of Funds section
Insert directly after "The Ask" (before "The Catalyst"). Same card style as other `op-card` sections. List with dollar ranges:
- Token Launch & Liquidity — $625K – $875K
- Legal, Compliance & Audits — $500K – $700K
- App Polish & Onboarding — $375K – $525K
- Growth & User Acquisition — $375K – $525K
- Operational Runway (18–24 months) — $625K – $875K

Footnote: "Indicative allocations across the $2.5M – $3.5M Part 1 range."

### 4. Bitcoin Comparison line
Add a compact callout block right below "The Catalyst" (or merged into Moat — placing under Catalyst for top-of-page impact), styled as a subtle bordered card with the exact paragraph:

"Bitcoin's Proof-of-Work consumes enormous amounts of energy to create digital scarcity with no direct environmental benefit. ZenSolar's Proof-of-Genesis™ rewards the actual creation of clean energy — one verified clean kilowatt-hour produced generates one $ZSOLAR token. We turn energy abundance into digital value instead of consuming massive energy to create artificial scarcity."

### 5. NEW: Long-Term Vision section
Insert as a new `op-card` section between "Founders" and the footer (so it closes the document on an ambitious note). Section label: `The Long-Term Vision`. Body uses the EXACT paragraph (no paraphrase):

"With strong execution, the combination of real utility, a self-reinforcing 100% subscription-to-LP flywheel, and expanding rewardable behaviors positions ZenSolar to acquire millions of users and generate substantial recurring revenue. The tokenomics are designed so that success compounds — as user acquisition grows, the flywheel creates structural pressure toward significant long-term value creation, with the potential for $ZSOLAR to become one of the most important clean energy infrastructure tokens globally."

### 6. Meta
- Update `<meta name="description">` to reflect the two-part seed framing: "ZenSolar one-page investor summary — Proof-of-Genesis™, three revenue engines, two-part seed ($2.5M–$3.5M Part 1)."

### Constraints / Technical notes
- Single file: `src/pages/InvestorOnePager.tsx`.
- Reuse existing `SectionLabel`, `Stat`, `Engine`, `Shot` helpers; no new components.
- Semantic tokens only (`text-secondary`, `bg-card/40`, `border-border/60`, etc.). No hardcoded colors.
- Print stylesheet untouched — new sections inherit `op-card` so they `break-inside: avoid`.
- Verify at desktop and 390×844 after build that no card overflows and print layout still fits Letter.
