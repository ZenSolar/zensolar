# Investor Demo & Hub Upgrades — Phase 1 + Phase 2

Surgical, mobile-first (390×844), client-side fixtures only. No schema, route, or tokenomics changes. Cinematic intro is excluded per scope.

---

## PHASE 1 — Highest Impact

### 1. Guided Tour on /demo
- **New** `src/hooks/useGuidedTour.ts` — step state, `next/skip/finish`, persists "seen" in `localStorage` `zs:demo:tour:v1`.
- **New** `src/components/demo/GuidedTourOverlay.tsx` — dim backdrop with spotlight on the active step's element, caption card ("Next" / "Skip tour"), auto-advances every ~12s, smooth-scrolls target into view with `scrollIntoView({ behavior: 'smooth', block: 'center' })`.
- Steps target: Live Energy → KPI cards → MINT → Wallet → Proof-of-Genesis card. Anchors added via `data-tour="energy|kpi|mint|wallet|pog"` on the existing components (no visual change otherwise).
- **New** `src/components/demo/GuidedTourLauncher.tsx` — prominent "▶ Take the 60-second tour" CTA shown above the dashboard when investor demo is on and tour hasn't been seen yet (dismissible).
- Mounted from `DemoLayout` so it works across all /demo subroutes.

### 2. Persistent "← Back to Investor Hub" pill
- **New** `src/components/demo/BackToInvestorHubPill.tsx` — fixed pill, `Link` to `/investor`.
  - Desktop: vertically centered on the left edge, low-opacity until hover.
  - Mobile: top-left under safe-area, small compact pill (sized to not collide with `InvestorDemoChip` which is top-center).
- Rendered in `DemoLayout` only when `isInvestorDemoModeSync()` is true.

### 3. Seeded Mint History + NFT Collection
- **New** `src/data/investorDemo/mintHistory.ts` — 5 fixtures spanning the last ~14 days (timestamps, kWh, $ZSOLAR amounts, fake tx hashes, source = Tesla/Enphase mix).
- **New** `src/data/investorDemo/nftCollection.ts` — 2 milestone NFTs (e.g. "Centaurion" + early "Sunspark" progress NFT), pulling artwork from existing `nftArtwork.ts` / `nftMilestones.ts`.
- Wire into Mint History view and `/demo/nft-collection` via a `useInvestorDemoMode` gate that merges fixtures ahead of any real data (same seed-floor pattern already used in `DemoWallet`).

### 4. ?ref= Personalization
- **New** `src/lib/investorRef.ts` — reads `?ref=` once, persists to `localStorage` `zs:investor:ref:v1`, exports `useInvestorRef()` returning `{ raw, displayName }` (title-cased, sanitized).
- `src/pages/Investor.tsx` — when ref present, render "Welcome, Lyndon" line above the hero headline; pass `displayName` as default value into the NDA form's name field (find the existing input and add `defaultValue`).

---

## PHASE 2 — Polish

### 5. "What You're Seeing" Callout Overlays
- **New** `src/components/demo/DemoCallouts.tsx` — numbered 1/2/3 chips absolutely positioned over Live kWh, MINT, and Wallet (anchored via the same `data-tour` attributes from #1).
- Mounted when investor demo is on AND `zs:demo:callouts:seen:v1` unset. Auto-fade after 8s (`setTimeout`) or on first tap anywhere; sets seen flag.

### 6. Live Counter on /investor Hub
- **New** `src/components/investor/LiveVerifiedCounter.tsx` — "{n} kWh verified in the last 24h". Deterministic seed (~420 base) + `setInterval` increment every 2–4s by small random kWh; resets at midnight.
- Mounted near the top of `/investor` hub.

### 7. Investor FAQ Accordion
- **New** `src/components/investor/InvestorFAQ.tsx` using existing `Collapsible` primitive.
- 6 Q&As: regulatory (SAFE + utility token framing), custody (embedded Coinbase Wallet), token unlock (founder pact-locks, LP tranches), dilution (1T cap), exit (Series A milestones, TGE), competition (multi-OEM moat).
- Inserted in `src/pages/InvestorPitch.tsx` between "The Ask" and the footer.

### 8. PDF Combo Download
- New "Download Deck + One-Pager" button on `/investor`. Triggers two sequential anchor-clicks (deck PDF + one-pager PDF from `public/founder-docs/`) with a short delay to avoid browser blocking. Uses existing button styling alongside current CTAs.

### 9. $ZSOLAR Appreciation Calculator
- **New** `src/components/investor/AppreciationCalculator.tsx` — slider for sample stake size (default 10,000 $ZSOLAR), table of projected USD values at the canonical price points $0.10 / $1 / $6.67 / $20 (from locked tokenomics).
- Disclaimer: "Illustrative only — not a forecast or offer."
- Mounted on `/investor` below the live counter.

### 10. Outage Toggle in Investor Demo Chip
- Extend `src/components/demo/InvestorDemoChip.tsx` — add small `Zap` icon button next to Exit, wired to existing `useInvestorOutageSim()` toggle.
- Visual: dimmed when off, amber glow when on. Tooltip: "Toggle outage scene."

---

## Files

**New:**
- `src/hooks/useGuidedTour.ts`
- `src/components/demo/GuidedTourOverlay.tsx`
- `src/components/demo/GuidedTourLauncher.tsx`
- `src/components/demo/BackToInvestorHubPill.tsx`
- `src/components/demo/DemoCallouts.tsx`
- `src/components/investor/LiveVerifiedCounter.tsx`
- `src/components/investor/InvestorFAQ.tsx`
- `src/components/investor/AppreciationCalculator.tsx`
- `src/data/investorDemo/mintHistory.ts`
- `src/data/investorDemo/nftCollection.ts`
- `src/lib/investorRef.ts`

**Edited:**
- `src/components/demo/DemoLayout.tsx` — mount pill, tour launcher, overlay, callouts
- `src/components/demo/InvestorDemoChip.tsx` — outage toggle
- `src/pages/Investor.tsx` — ref greeting, NDA prefill, live counter, calculator, PDF combo button
- `src/pages/InvestorPitch.tsx` — FAQ section
- Mint History view + `/demo/nft-collection` page — fixture merge
- Dashboard children (Live Energy card, KPI row, MINT, Wallet, PoG card) — `data-tour` anchor attrs only

## Verification
- `/demo?demo=investor` at 390×844: tour launcher visible, tour walks all 5 steps, skippable; pill anchored without colliding with chip; chip outage toggle flips scene.
- Mint History shows 5 seeded rows; NFT collection shows 2 milestones.
- `/investor?ref=lyndon`: greeting + NDA name prefill.
- `/investor` live counter ticks; calculator updates; PDF combo downloads both files.
- `/investor/pitch` FAQ expands/collapses.
- No regression on MINT, wallet seed balance, header pill, or Deason bubble.