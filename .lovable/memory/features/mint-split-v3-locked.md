---
name: Mint Split v3.1 (LOCKED · LIVE)
description: SSOT for the v3.1 mint distribution — 50% user / 20% LP / 20% burn / 10% treasury. UI always shows 1 kWh = 1 $ZSOLAR; backend reconciles on raw 100% mint. Supersedes 50/25/20/3/2 (proposed, never live) and legacy 75/20/3/2.
type: feature
---

# Mint Split v3.1 (LOCKED · LIVE)

## The split (LOCKED)
- **50% user**
- **20% LP** (direct add)
- **20% burn** (continuous deflation — supersedes the deprecated Genesis Halving)
- **10% treasury** (runway, ops, future buyback)

## UI rule (1:1 display)
- UI ALWAYS shows **1 kWh = 1 $ZSOLAR**.
- `tokens_minted` written to the DB = the user's **50% share**.
- Any "full mint" / pie visualization back-derives the gross: `gross = tokens_minted / 0.5`.
- Never multiply user balances by 2 or by `1 / USER_SHARE` outside the explicit pie/visualization path.

## Code anchors
- `src/lib/tokenomics.ts` — `MINT_DISTRIBUTION = { user: 50, lp: 20, burn: 20, treasury: 10 }`, `MODEL_VERSION = 3.1`.
- `src/hooks/useLatestMintReceipt.ts` — `USER_SHARE = 0.5`.
- `src/lib/__tests__/mintReconciliation.test.ts` — fixture asserts the 50/100 invariant.

## "Matching contribution" UX framing
- The protocol's 50% share is framed as a **401(k)-style match** (20% LP + 20% burn + 10% treasury), never as a haircut.
- CashOutExplainer copy: *"No hidden splits — what you see is what swaps."*
- ReceiptDrawer uses 4-bucket split visualization with "matching contribution" description.

## Supersedes
- **75/20/3/2** (legacy)
- **50/25/20/3/2** (proposed v3.0 — never live)

## Cross-references
- `mem://features/tiered-subscriptions-flywheel.md` — steady-state flywheel math under v3.1 (no halving)
- `mem://features/tokenomics.md`
- `mem://index.md` Core block
