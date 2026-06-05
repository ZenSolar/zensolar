
## Plan — Investor Data Room (`/investor/data-room`)

Build one new page plus two tiny cross-links. Reuses the deck's PIN gate, design tokens, and existing components — no backend, no design-system changes.

### 1. New page: `src/pages/InvestorDataRoom.tsx`

- **PIN gate**: copy `DeckPinGated.tsx`'s pattern verbatim (sessionStorage key `zen.deck-pin-unlocked`, `readInvestorUnlocked()` bypass, `deck-pin-verify` edge function, throttle/shake/check states). When unlocked, render `<DataRoomContent />`.
- **Helmet** (both gated + content state): `<title>ZenSolar · Investor Data Room</title>`, `noindex,nofollow`, canonical `https://www.zensolar.com/investor/data-room`.
- **Layout**: `min-h-screen bg-[hsl(220,20%,6%)] text-white`, content in `mx-auto max-w-[1280px] px-6 md:px-10 py-12 md:py-16`.
- **Top chrome**:
  - Row of quiet back-links: `← Back to Pitch` (`/investor/pitch`) and `View Deck →` (`/deck`), mono uppercase white/45.
  - Kicker `CONFIDENTIAL · INVESTOR DATA ROOM` (secondary/80).
  - H1 "Investor Data Room" (48–56px, semibold).
  - Sub: "Deeper materials behind the seed deck — technology, revenue engines, raise milestones, traction, and IP."
  - Secondary-glow `hr` motif (same as `SectionHeader`).

### 2. Six sections — all `DeckCard` (1-column stack)

Group 1 (cards 1–3) → glow `hr` → Group 2 (cards 4–6).

1. **01 · Technology — Proof-of-Genesis™ Deep Dive**
   Short PoG description · 3 chips (Real-time, Multi-OEM Tesla/Enphase/SolarEdge/Wallbox, 30–60s minting) · embeds `<ProofOfGenesisArchitectureDiagram />` inside a quiet bordered well · prominent secondary-bordered button "See live PoG receipt example →" linking `/proof-of-genesis/preview` · muted footnote "Patent-pending · U.S. App. 19/634,402".

2. **02 · Virtual Power Plant** (`emphasized` DeckCard)
   "First Crypto-Rewarding VPP" framing · 4 stat tiles for settlement split (50% LP / 30% User Cash / 15% Ops / 5% Tokens) · Phase 2 strip `Leap → CAISO → OEM partner-tier APIs` · muted line on growing VPP TAM (DOE 80–160 GW by 2030).

3. **03 · Aggregated Data Opportunity**
   High-margin anonymized multi-OEM data business · target-buyer list (utilities, ISOs/RTOs, REC registries, climate platforms) · `$2B+` TAM stat tile · muted scale note.

4. **04 · Use of Funds & Milestones**
   Four stat tiles for $5M allocation (Eng 45 / GTM 30 / Ops 15 / Reserve 10) · 5 milestone bullets pulled from S11 (mainnet anchor + LP Round 1, 10k verified homes, VPP Phase 2 live, 3 utility data contracts, patent issuance + 2 continuations).

5. **05 · Traction & Metrics**
   3 stat tiles (active beta users, kWh verified, PoG mints) · 2 short italic beta quotes.

6. **06 · Legal & IP Summary**
   Patent status, trademark portfolio, entity, founders (Joseph Maushart + Michael Tschida), muted contact line `joe@zensolar.com`.

Page-level footer: "ZenSolar, LLC · Confidential under NDA".

### 3. Routing — `src/App.tsx`

- Add `const InvestorDataRoom = lazy(() => import("./pages/InvestorDataRoom"));` near the other investor lazy imports (line ~224).
- Add route directly under `/investor/one-pager` (~line 318):
  `<Route path="/investor/data-room" element={<Suspense fallback={<PageLoader />}><InvestorDataRoom /></Suspense>} />`
- No `ProtectedRoute` wrapper — PIN gate lives in the page (matches `/deck`).

### 4. Cross-links (tiny)

- **`src/components/investor/pitch/slides/v3/S07Tech.tsx`** (line 171–173): wrap the "Full PoG technology stack & architecture + real receipt example available in data room." line in a `<Link to="/investor/data-room" className="hover:text-white/70 transition">…</Link>`. Keep existing classes.
- **`src/pages/InvestorPitch.tsx`** (footer ~line 226): add a single quiet line above or beside the existing email line: `<Link to="/investor/data-room" className="text-[11px] uppercase tracking-[0.18em] text-secondary/80 hover:text-secondary">Data Room →</Link>`. No layout change.

### Tech notes

- Reuses `DeckCard`, `CardKicker`, `ProofOfGenesisArchitectureDiagram`, `readInvestorUnlocked`, `deck-pin-verify`.
- Local helper components `Kicker`, `StatTile`, `GlowDivider` defined inside the page file.
- Strictly uses semantic tokens (`secondary`, `border-border/*`, `bg-card/*`) plus the existing `text-white/XX` opacity scale already used across v3 slides.

### Out of scope

No new backend / edge functions / secrets, no design-system changes, no other slides, no memory updates.

### Final reply after build

`Investor Data Room created at /investor/data-room.`
