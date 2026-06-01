## Goal

Lock **v3.1** as the permanent SSOT for mint-time distribution:

- **50%** user (always shown 1:1 in UI as `1 kWh = 1 $ZSOLAR`)
- **25%** LP direct (mint-time)
- **20%** burn (mint-time)
- **5%** treasury (mint-time)
- **3% transfer tax** — kept, but *fully separate*: applied only on transfers/swaps and recycled to LP. Not part of the mint split, not in `MINT_DISTRIBUTION`.

Preserve the 1:1 UX everywhere: the user always sees their 50% share displayed as if it equals the underlying kWh/miles (`tokens_minted` written to DB = the user's 50% share). Backend reconciliation still operates on the raw 100% mint via `tokens_minted / 0.5`.

## SSOT changes (src/lib/tokenomics.ts)

- `MODEL_VERSION = 3.1` (keep number) with a fresh header comment: "v3.1 LIVE — mint split 50/25/20/5 + separate 3% transfer tax".
- Replace `MINT_DISTRIBUTION` with:
  ```ts
  export const MINT_DISTRIBUTION = {
    user: 50,
    lpDirect: 25,
    burn: 20,
    treasury: 5,
  } as const;
  ```
- Replace `TRANSFER_TAX` with a single recycled-LP value:
  ```ts
  export const TRANSFER_TAX = {
    lpRecycle: 3,
    total: 3,
  } as const;
  ```
  (Drops the old 7% / 3-2-2 split. The 7% transfer tax narrative is retired; investor copy now reads "3% transfer tax → LP recycle".)
- Update `calculatePendingTokens`, `calculateUserTokens`, `calculateMintBurn` to read from the new fields (already keyed on `MINT_DISTRIBUTION.user` / `.burn`, so they keep working; verify no callers depend on `.lp` vs `.lpDirect`).
- Update the inline "401(k) match" comment example: 700 kWh user-share → protocol matches with 350 LP + 280 burn + 70 treasury (raw 1,400 = 100%).

## Consumers to update (mint logic)

Hooks
- `src/hooks/useLatestMintReceipt.ts` — `USER_SHARE` already 0.5, keep. Update header comment block to read "50/25/20/5 (v3.1)".
- `src/hooks/useOnChainMetrics.ts` — already keys off `MINT_DISTRIBUTION.burn / .user / .treasury`. Add `.lpDirect` rename (was `.lp`). Update derivations of `lpBalance` / `treasuryBalance`.
- `src/hooks/useBetaMetrics.ts` — uses `MINT_DISTRIBUTION.burn` and `.user`. No structural change, just verify after rename.
- `src/hooks/useFlywheelContribution.ts`, `src/hooks/useDashboardData.ts` (if it consumes any split) — sweep.

Components / UI
- `src/components/tokenomics/Tokenomics101Card.tsx` and any siblings — update split copy to 50/25/20/5 and 1:1 framing.
- `src/components/wallet/ReceiptDrawer.tsx` + 4-bucket split visualization → 4 buckets relabeled `User 50 · LP 25 · Burn 20 · Treasury 5`.
- `src/components/wallet/CashOutExplainer.tsx` — copy refresh.
- `src/components/investor/ThreeRevenueEngines.tsx` — Engine 2 panel: mint split = 50/25/20/5, transfer tax = 3% (separate). Explicitly call out independence.
- `src/components/EarningsCalculatorSection.tsx` (if present) — math uses `MINT_DISTRIBUTION.user`, verify.
- `src/components/wallet/RecentMintProofs.tsx` — already 1:1; verify.

Pages
- `src/pages/InvestorPitch.tsx`, `src/pages/InvestorOnePager.tsx`, `src/pages/learn/LearnTokenomics.tsx`, `/deck` slide content (`src/components/investor/pitch/*`) — surface the new 50/25/20/5 + separate 3% transfer tax wherever the split appears.
- Admin pages under `src/pages/admin/*` that show tokenomics breakdowns.

Edge functions
- `supabase/functions/cheetah-export/model.ts` (and any siblings) — these mirror subscription split, not mint split, so likely no change. Sweep for hardcoded `0.20` / `0.10` / `0.25` mint-split constants and remove drift.

Tests / fixtures
- `src/lib/__tests__/mintReconciliation.test.ts` — update fixture to assert the 50/100 invariant under 50/25/20/5 (sum check + per-bucket check).
- Any snapshot tests referencing percentages or `MINT_DISTRIBUTION.lp` → `.lpDirect`.

Archive
- Leave `src/lib/archive/tokenomics_v1_10B.ts` and `src/pages/archive/*` untouched (historical record).

## Memory updates

- `mem://features/mint-split-v3-locked.md` — rewrite to declare the new locked split:
  ```
  Mint Split v3.1 (LOCKED · LIVE)
  50% user / 25% LP direct / 20% burn / 5% treasury
  Transfer tax: 3% (separate mechanism, LP recycle only — NOT part of mint split)
  Supersedes: 50/20/20/10, 50/25/20/3/2 (proposed), 75/20/3/2 (legacy)
  ```
- `mem://index.md` Core line — replace existing mint-split sentence with: "Mint split v3.1 (LOCKED): 50% user · 25% LP direct · 20% burn · 5% treasury. Separate 3% transfer tax (LP recycle only). UI ALWAYS shows 1 kWh = 1 $ZSOLAR (user sees 50% share)."
- `mem://features/tokenomics.md`, `mem://features/tiered-subscriptions-flywheel.md`, `mem://features/cheetah-doomsday-rebuttal.md`, `mem://features/investor-pitch-v2.md`, `mem://features/launch-model.md` — sweep for the old split numbers and the old "7% transfer tax" claim; rewrite to 50/25/20/5 + 3% transfer tax.

## Verification

1. Read `tokenomics.ts` end-to-end after edit; confirm split sums to 100 and transfer-tax block stands alone.
2. `bunx vitest run src/lib/__tests__/mintReconciliation.test.ts` — must pass.
3. Grep the whole repo for stale strings: `50/20/20/10`, `50/25/20/3/2`, `75/20/3/2`, `MINT_DISTRIBUTION.lp` (no `Direct`), `TRANSFER_TAX.total` referenced as 7, "7% transfer tax", "20% to treasury". Fix every hit.
4. Visit `/investor/pitch`, `/investor/one-pager`, `/deck`, `/learn/tokenomics`, dashboard receipt drawer, mint history — confirm UI reads 50/25/20/5 mint + separate 3% transfer tax, and user-facing kWh/$ZSOLAR remains 1:1.

## Closing reply (verbatim, as user requested)

> "Full backend tokenomics alignment v3.1 (50/25/20/5 mint split + separate 3% transfer tax) complete — 1:1 UI preserved everywhere."
