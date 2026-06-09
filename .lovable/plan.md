Scope: add one new section to `src/pages/InvestorWhyThisRound.tsx`.

Placement
- Insert after the existing "02 · Already Live — Product capabilities shipping today" section.
- Insert before the existing "03 · Use of Funds — What this round will fund" section.
- Re-number subsequent kickers: "03 · Use of Funds", "04 · Round Structure", "05 · Go-to-Market", "06 · The Flywheel", "07 · Runway", "08 · The Opportunity".

Content
- Kicker: "02 · Technical Foundation"
- Title: "How Proof-of-Genesis Works"
- Body (bulleted cards, same style as "Where we are today"):
  - Direct OAuth2 integrations with Tesla, Enphase, SolarEdge, and Wallbox pull real hardware telemetry in real time — not self-reported data.
  - Proof-of-Delta™ serves as the cryptographic verification layer that validates energy production and sustainable behavior before any tokens are minted.
  - Verified events are immutably anchored on-chain, creating a tamper-proof record of clean energy activity.
  - Users can mint tokens with one tap inside the app using Coinbase Smart Wallet — no seed phrases or external wallet connection required.
  - The core Proof-of-Genesis architecture is protected by U.S. Patent Application No. 19/634,402 and is designed to scale globally as clean energy adoption accelerates.

Styling
- Reuse existing `Section` wrapper, `CheckCircle2` icon, and card styles (`rounded-2xl border border-border/60 bg-card/40`).
- No new dependencies.
- Keep mobile-first (390×844) spacing consistent with the rest of the page.

Verification
- Confirm the section renders cleanly at desktop and 390×844.
- Confirm no existing content or visuals are altered.
- Confirm kicker re-numbering is correct and consistent.