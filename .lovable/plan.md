## Goal
Strip every visible reference to the 50 / 25 / 20 / 5 mint split (and any "75%", "matching contribution", "of X minted", "20% burn" copy) from user-facing surfaces. Backend math, hook constants, and contract code are untouched — only display copy and visualizations change. The split stays visible exclusively on `/investor*`, `/how-it-works`, `/white-paper`, the Learn shells, and `/admin*`.

## Surfaces to update (user-facing → 1:1 only)

### 1. `src/components/mint-history/ReceiptDrawer.tsx`
- Rewrite the `mint-rewards` description to a clean 1:1 line:
  `"Energy-backed mint — 1 kWh = 1 $ZSOLAR, verified on-chain."`
- Delete the entire **Mint Split** section (the stacked bar + 4-bucket list, lines ~279–329) and the `SPLIT` constant.
- Headline card: drop the `of {grandTotal} minted` sub-line; show only the user's $ZSOLAR.
- Remove `(50% user share)` from the share-text builder.
- Remove the now-stale `grandTotal` derivation and the Sparkles/Flame/ShieldCheck/Wallet imports that only powered the split viz.
- Keep the "split math" phrase out of the PoG CTA caption — replace with `"Verified kWh → CO₂ tons offset → device watermark"`.

### 2. `src/pages/MintHistory.tsx`
- Summary tile `Tokens Received` sub: change `'$ZSOLAR (75%)'` → `'$ZSOLAR earned'`.
- Pending Activity description: change to `"Activity since your last mint — every kWh becomes 1 $ZSOLAR."` (drop the "75%" + "20% burn" mention).
- Fix the stale comment + math at line 138–141: it says "50% user share" but multiplies by `0.75`. Use `MINT_DISTRIBUTION.user / 100` from `tokenomics.ts` so the pending estimate matches the locked v3.1 50% user share. (Internal-only change; user still just sees the resulting token number.)
- Remove `<Tokenomics101Card compact />` from this page — that card narrates the split.

### 3. `src/components/home/EarningsCalculatorSection.tsx`
- Already multiplies by `USER_SHARE` from `MINT_DISTRIBUTION` (correct for v3.1 = 0.5).
- Change the sub-line `"≈ N tokens/day · 75% to your wallet"` → `"≈ N tokens/day · 1 kWh = 1 $ZSOLAR"`.

### 4. `src/components/nft/NFTMintFlow.tsx`
- Remove `<Tokenomics101Card compact />` (line 613). This is a regular-user surface.

### 5. `src/components/demo/DemoDashboard.tsx`
- Remove `<Tokenomics101Card compact />` (line 315). Demo dashboard = user POV.

### 6. `src/components/wallet/RecentMintProofs.tsx` & `src/components/dashboard/WalletHoldingsCard.tsx`
- Already display tokens 1:1 with no split copy. **No changes needed** — verify only.

### 7. `src/hooks/useLatestMintReceipt.ts`
- Internal hook; user never sees it. **Keep `USER_SHARE = 0.5` and the comment** (correct per memory rule). No display changes here.

## Surfaces explicitly LEFT showing the split (allowlist)
- `src/pages/learn/LearnTokenomics.tsx` (uses `Tokenomics101Card` full mode)
- `src/pages/HowItWorks.tsx`, `src/pages/WhitePaper.tsx` and their components
- `/investor*` pages
- `/admin*` pages
- `src/components/tokenomics/Tokenomics101Card.tsx` itself — leave the component intact; just stop mounting it on user surfaces.

## Verification
- `rg -n "75%|50% user|25% LP|20% burn|5% treasury|matching|mint split|bucket"` across `src/components/dashboard`, `src/components/wallet`, `src/components/mint-history`, `src/components/home`, `src/components/nft`, `src/components/demo`, `src/pages/MintHistory.tsx`, `src/pages/Wallet.tsx`. Expect zero hits.
- Visually spot-check the receipt drawer in preview after change.

## Closing reply
`"Dashboard receipt + wallet polish complete — v3.1 split hidden from users, pure 1:1 UX preserved everywhere."`
