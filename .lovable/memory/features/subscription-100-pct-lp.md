---
name: Subscription Revenue → 100% LP
description: 100% of every $ZSOLAR subscription dollar (Spark/Flame/Inferno/Titan) routes to the LP. Treasury is funded ONLY by the 5% mint slice. Supersedes 50/50 sub split.
type: feature
---

# Subscription Revenue → 100% LP (v3.2 · LOCKED)

## Rule
- **100%** of every subscription dollar → **Liquidity Pool**
- **0%** → Treasury, Team, Founder, or anything else from subs
- Treasury is funded **only** by the 5% mint slice
- LP receives **two separate monthly inflows**:
  1. **100% of all subscription revenue**
  2. **25% of all newly minted tokens** (the LP slice of the 50/25/20/5 mint split)
  - PLUS the ongoing 3% transfer tax (separate mechanism)

## 4 Tiers (Spark/Flame/Inferno/Titan)
| Tier    | Price    | Token Multiplier | LP / mo |
|---------|----------|------------------|---------|
| Spark   | $9.99    | 1×               | $9.99   |
| Flame   | $19.99   | 2.5×             | $19.99  |
| Inferno | $49.99   | 5×               | $49.99  |
| Titan   | $99.99   | 10×              | $99.99  |

## Code anchors
- `src/lib/tokenomics.ts` — `SUBSCRIPTION.lpContribution = 100`, `treasuryContribution = 0`, `SUBSCRIPTION_TIERS.{base,regular,power,titan}` with `lpPerMonth = monthlyPrice`, `treasuryPerMonth = 0`, `tokenMultiplier` field.
- `src/hooks/useEcosystemStats.ts` — exposes `monthLpFromSubs`, `monthLpFromMintsUsd`, `monthLpTotalUsd` (both inflows stacked).
- `src/pages/Ecosystem.tsx` — LP card shows both lines: "From subscriptions" + "From mint reflows". Never names the 50/25/20/5 percentages in customer copy.

## UI rule
- Never expose 50/25/20/5 split percentages or "X% to treasury" copy on customer screens.
- Always use 1 kWh = 1 $ZSOLAR framing.
- LP card may show split between sub-inflow and mint-inflow because both feed LP.

## Supersedes
- 50/50 LP/treasury subscription split (v2/v3.1) — retired.
- 3-tier ladder (Base/Regular/Power) — renamed to Spark/Flame/Inferno + new Titan tier. Tier IDs in code remain `base/regular/power/titan` for back-compat.

## Out-of-scope follow-ups
- `src/lib/subscriptionSplitModel.ts` (investor cheetah PDF) still uses LP_SHARE=0.5 — needs separate review before flipping.
