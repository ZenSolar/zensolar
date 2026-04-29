---
name: Cheetah doomsday rebuttal — combined stack
description: The 4-protection model (tranche LP + sub auto-buy + 3% tx-tax recycle + 20% burn + 6-mo vest) and how it absorbs sell pressure across Seed → Series C.
type: feature
---

# Cheetah Doomsday — Combined Rebuttal Stack

## ALWAYS model these 4 protections together (never just subscription auto-buy)

1. **Tranche LP** — scales with funding rounds per `docs/FUNDRAISING_MODEL.md`:
   - Seed: $1.5M USDC + 15M ZSOLAR (locked 10 yrs)
   - Series A: +$6M → $7.5M
   - Series B: +$17.5M → $25M
   - Series C: +$25M → $50M
2. **Subscription auto-buy** — 50% of $12.99 blended ARPU → pool USDC
3. **Transfer-tax recycle** — 3% of every sell pumps back into the pool
4. **Mint burn + 6-month vest** — 20% burned at mint, remainder vests linearly over 6 months (only 1/6 sellable per month)

## Canonical scenarios

| Scenario | Sell rate | Vest? | Slippage range | Coverage |
|----------|-----------|-------|----------------|----------|
| Realistic | 5%/mo | 6-mo | 0.35% – 2.10% | 12.2x |
| Conservative | 10%/mo | 6-mo | 0.71% – 4.13% | 6.2x |
| Cheetah doomsday | 20%/mo | NONE | 8% – 36.6% | 0.56x |

## Key talking points

- LP scales with **FUNDING ROUNDS** (10-yr locked), NOT user growth → depth pre-positioned
- The 6-mo vest alone reduces single-month sell volume by **83%**
- Cheetah's 20% dump scenario only works if you simultaneously remove vesting AND assume 1-in-5 users dump 100% of mint EVERY month — neither is real
- Realistic case = protocol over-collateralized by **12x** at every funding stage

## Source files

- `docs/FUNDRAISING_MODEL.md` — canonical LP schedule (NOT subscriptionSplitModel.ts which uses simplified $200K/wave placeholder)
- `src/lib/tokenomics.ts` — burn/tax constants
- `docs/BOOTSTRAP_TOKENOMICS.md` — 6-month vest commitment

## Generated artifact

`/mnt/documents/zensolar_lyndon_inevitable_v4.pdf` — one-pager for Lyndon
