---
name: Mint Split v4.0 (LOCKED · LIVE)
description: SSOT for the mint distribution — 1.25 tokens per verified unit, 1.0 to the member and 0.25 to treasury. No LP mint, no burn at mint. Separate 3% transfer tax (LP recycle only). 1 kWh = 1 $ZSOLAR.
type: feature
---

# Mint Split v4.0 (LOCKED · LIVE — 2026-07-31)

## The split (LOCKED — mint-time)
Every verified unit mints **1.25 $ZSOLAR**:
- **1.0 to the member**
- **0.25 to treasury**
- **0 LP** — there is no LP mint
- **0 burn** — there is no burn at mint

A burn at mint has **zero net supply effect** (minting then immediately burning
the same tokens changes nothing). It must not exist in code or in copy.

Expressed as a share of tokens minted: 80% member / 20% treasury.

## Conversion factors (SSOT)
`src/lib/mintFactors.ts` — mirrored at `supabase/functions/_shared/mintFactors.ts`.
- solar 1:1 · supercharging 1:1 · FSD miles 1:1 · battery export 1:1
- general EV miles **0.1:1** (not a direct energy measurement)
- home charging enters at 1:1, then **netted to 0.25:1 on solar-connected homes**
  so self-generated energy is not credited twice.

## Issuance pipeline (order is fixed)
`netting → stack_bonus → allowance_cap`, declared in
`ISSUANCE_PIPELINE_ORDER` and executed by `_shared/issuancePipeline.ts`.
Only **netting** is implemented. Stack Bonus is **not an adopted mechanism**.
The allowance cap needs plan and billing data that does not exist. Both are
typed no-op seams — do not implement either without an explicit decision.

## Issuance source (item 6, cutover 2026-07-31)
Issuance is the **sum of unminted `energy_production` rows**, never
`lifetime_totals − baseline_data`. Rows are consumed atomically by
`public.consume_energy_rows` inside the mint, so a row can never be consumed
twice. All rows predating the cutover are marked `consumed_reason = 'pre_cutover'`.
Audit + reversal: `public.issuance_cutovers` / `public.revert_issuance_cutover`.

## Transfer tax (SEPARATE mechanism — never conflate with the mint split)
- 3% on transfer/swap, recycled to LP only.
- `contracts/ZSOLAR.sol` as deployed still carries the retired 7% schedule
  (3% burn / 2% LP / 2% treasury). Unreconciled — see the fee-on-transfer note
  below before any LP deployment.

## Uniswap v3 note
Uniswap v3 has **no fee-on-transfer support**. Any transfer tax on ZSOLAR
breaks v3 liquidity provision unless the position manager, router and pool are
tax-exempt. Do not deploy a v3 range order without resolving this.

## Supersedes (never reintroduce)
- 50/25/20/5 · 50/20/20/10 · 50/25/20/3/2 · 75/20/3/2
