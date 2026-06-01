---
name: Mint Split v3.1 (LOCKED · LIVE)
description: SSOT for the v3.1 mint distribution — 50% user / 25% LP direct / 20% burn / 5% treasury. Separate 3% transfer tax (LP recycle only). UI always shows 1 kWh = 1 $ZSOLAR; backend reconciles on raw 100% mint.
type: feature
---

# Mint Split v3.1 (LOCKED · LIVE)

## The split (LOCKED — mint-time, sums to 100%)
- **50% user**
- **25% LP direct** (added to pool at mint)
- **20% burn** (continuous deflation)
- **5% treasury** (runway, ops, future buyback)

## Transfer tax (SEPARATE mechanism)
- **3% on every transfer/swap → recycled to LP only.**
- NOT part of `MINT_DISTRIBUTION`. Independent of mint-time math.
- Previous 7% (3 burn / 2 LP / 2 treasury) is retired.

## UI rule (1:1 display)
- UI ALWAYS shows **1 kWh = 1 $ZSOLAR**.
- `tokens_minted` written to the DB = the user's **50% share**.
- Any "full mint" / pie visualization back-derives gross: `gross = tokens_minted / 0.5`.
- Never multiply user balances by 2 or by `1 / USER_SHARE` outside the explicit pie/visualization path.

## Code anchors
- `src/lib/tokenomics.ts` — `MINT_DISTRIBUTION = { user: 50, lp: 25, burn: 20, treasury: 5 }`, `TRANSFER_TAX = { lp: 3, total: 3 }`, `MODEL_VERSION = 3.1`.
- `src/hooks/useLatestMintReceipt.ts` — `USER_SHARE = 0.5`.
- `supabase/functions/calculate-rewards/index.ts` — mirrors split.

## "Matching contribution" UX framing
- The protocol's 50% share is framed as a **401(k)-style match** (25% LP + 20% burn + 5% treasury), never as a haircut.
- ReceiptDrawer 4-bucket split: You 50 · LP 25 · Burn 20 · Treasury 5.

## Supersedes
- **50/20/20/10** (v3.1 previous lock — replaced)
- **50/25/20/3/2** (v3.0 proposed — never live)
- **75/20/3/2** (legacy)
