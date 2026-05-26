---
name: Mint ratio (Single Source of Truth)
description: Mint ratio is strictly 1:1 across every source — 1 $ZSOLAR per kWh produced, 1 $ZSOLAR per mile driven. No 10:1, no gross/pre-split back-calc.
type: constraint
---
**Rule:** Every $ZSOLAR mint is **1:1** with its underlying physical unit.

- Solar production: 1 $ZSOLAR = 1 kWh
- Battery discharge: 1 $ZSOLAR = 1 kWh
- Home / Supercharger EV charging: 1 $ZSOLAR = 1 kWh
- EV driving: 1 $ZSOLAR = 1 mile

**Why:** Past code had two incorrect derivations:
1. `tokens * 10` in display layers (showed 1,042 mi for a 104 $ZSOLAR Supercharging mint).
2. `grossTokens = tokens / 0.75` then `miles = grossTokens` in `useLatestMintReceipt`
   (showed 139 mi for the same row by inflating to pre-split).

Both are wrong. The 75% / 20% / 3% / 2% split affects WHERE tokens go, not the
display ratio. The user-share figure on the receipt is what the user sees on
chain, and that figure equals the physical unit 1:1.

**How to apply:**
- Display kWh = `tokens_minted` (rounded to 1 decimal).
- Display miles = `tokens_minted` (rounded to 1 decimal).
- Never multiply tokens by 10 in any display.
- Never divide tokens by `USER_SHARE` to back-calc deltas. If `miles_delta` /
  `kwh_delta` are stored on the mint row, use them directly. Otherwise fall
  back to `tokens_minted` 1:1.
- Files known to enforce this: `src/components/wallet/RecentMintProofs.tsx`,
  `src/hooks/useLatestMintReceipt.ts`. Audit any new mint-display surface.
