---
name: Tiered Subscriptions Flywheel (ARCHIVED — subscription tiers only)
description: Subscription-tier and sell-cohort scenario notes. All tokenomics figures it once carried (10:1 ratio, 50/25/20/5 split, 20% burn-per-mint) were WRONG and have been removed. Locked values live in mint-split-v3-locked.md.
type: feature
---

# ARCHIVED — subscription-tier scenario notes

> **This file no longer states any mint ratio, mint split, or burn rate.** The
> figures it previously carried were wrong and were labeled as "corrections to
> apply", which made them standing instructions to regenerate contradictions.
> They are deleted, not annotated.
>
> The canonical economics are in `mem://features/mint-split-v3-locked.md`:
> **1.25 $ZSOLAR per verified unit — 1.0 to the member, 0.25 to treasury.
> No LP mint. No burn at mint. No continuous burn.** Member ratio is 1 kWh =
> 1 $ZSOLAR.

Refreshed 2026-08-04. Supersedes `tiered-subscriptions-halving-flywheel.md`. Genesis Halving is **deprecated**. Companion to `mem://features/satoshi-mirror-v2-oracle` and `CANONICAL_SSOT.md`.

## 1. Core principles (locked — see mint-split-v3-locked.md)

- **Mint ratio:** 1 verified kWh = 1 $ZSOLAR to the member. Never 10:1.
- **Mint split:** 1.0 member / 0 LP / 0 burn / 0.25 treasury (1.25 issued per unit). Never 50/25/20/5, never 75/20/3/2.
- **Supply-side mechanism:** treasury-share step-down 0.25 → 0.10 once Store redemption exceeds 30% for two consecutive quarters. Mechanical and scheduled — **not** a burn, **not** "continuous deflation".
- **1T hard cap unchanged.**
- **External phrasing:** "1 kWh = 1 $ZSOLAR" · "Satoshi-Mirror floor" · the protocol's own slice is framed as a "matching contribution" (401(k)-style).

## 2. Three subscription tiers (50/50 LP/treasury split on every dollar)

| Tier | Price/mo | LP injection | Treasury | Target user | Mint cap |
|---|---|---|---|---|---|
| **Base** | $9.99 | $4.995 | $4.995 | Cash-out users, light producers | Soft cap optional: 800–1,000 tokens/mo |
| **Regular** | $19.99 | $9.995 | $9.995 | Default homeowner / EV driver | None |
| **Power** | $49.99 | $24.995 | $24.995 | Multi-device, prosumer, fleet | None + staking multipliers |

Every dollar of subscription revenue: **50% → LP, 50% → Treasury.** No exceptions.

## 3. Sell-rate assumptions per tier (cohort behavior)

| Tier | Monthly sell-rate of minted tokens | Rationale |
|---|---|---|
| Base | **90%** | Self-selected cash-out cohort |
| Regular | **25%** | Default holder behavior |
| Power | **5%** | Prosumer / believer / staker |

These are the assumptions we model against. Power-tier mix shift is the long-term flywheel win.

## 4. Per-tier flywheel math (steady-state, $0.10 floor)

Assumes ~1,000 verified units/user/month → **1,000 to the member** and 250 to treasury (1,250 issued, the "matching contribution"). No LP mint, no burn at mint, no halving regime.

| Tier | LP/user/mo | Member tokens | Sold tokens | Sell pressure ($) |
|---|---|---|---|---|
| Base | $9.99 | 1,000 | 900 | $90.00 |
| Regular | $19.99 | 1,000 | 250 | $25.00 |
| Power | $49.99 | 1,000 | 50 | $5.00 |

**Key insight:** Power tier is strongly net-positive for LP; Base remains intentionally subsidized as the on-ramp. Supply-side control comes from the treasury-share step-down (0.25 → 0.10 after Store redemption > 30% for two consecutive quarters), not from any burn. Treasury auto-buyback (Satoshi-Mirror v2) absorbs residual Base-tier sell pressure.

## 5. Cohort mix evolution (target)

| Phase | Users | Base | Regular | Power |
|---|---|---|---|---|
| Launch | 0–10k | 60% | 35% | 5% |
| Growth | 10k–100k | 40% | 45% | 15% |
| Mature | 250k+ | 25% | 50% | 25% |

Higher tiers grow as users accumulate token value and unlock staking multipliers. Flywheel strengthens linearly with mix shift — no regime change required.

## 6. Staking / locking incentives (Regular + Power, future)

- **6-month lock:** 1.5× mint multiplier + sell-rate assumed → halved
- **12-month lock:** 2.0× mint multiplier + minimal sell pressure
- Never offered to Base tier (preserves cash-out option).

## 7. Optional: soft mint cap on Base

- Base tier: optional **800–1,000 token/month soft cap** to prevent whales squatting on cheap tier.
- Regular + Power: **uncapped.**
- Implementation: enforce via subscription tier check at mint time.

## 8. How this interacts with Satoshi-Mirror v2

- **Satoshi-Mirror v2** = floor defense (EIA $/kWh anchor + treasury auto-buyback via POL).
- **Tiered subs + treasury-share step-down** = supply/demand balance at the cohort level. There is no burn component.
- The two are **complementary, independent mechanisms.** Floor catches what the flywheel doesn't absorb. Neither depends on a halving event.

## 9. Open questions (Michael sign-off needed)

1. Base tier soft cap: enable at launch (800/1000) or hold for later?
2. Staking multipliers: ship at v3.1 launch or as a fast-follow?
3. Burn vs. reserve split on treasury auto-buyback (still pending from Satoshi-Mirror v2 memo).

## 10. Cross-references

- `CANONICAL_SSOT.md` §"v2 Tokenomics & Flywheel Model"
- `mem://features/mint-split-v3-locked.md` — v3.1 split SSOT
- `mem://features/satoshi-mirror-v2-oracle` — floor mechanism
- `mem://features/halving-schedule` — **DEPRECATED in v3.1 narrative; kept as historical record**
- `src/lib/tokenomics.ts` — `SUBSCRIPTION_TIERS` (active), `GENESIS_HALVING` (retained but deprecated in narrative)

## 11. Forbidden phrasings

- ❌ "10 kWh = 1 $ZSOLAR" / any 10:1 ratio → ✅ "1 kWh = 1 $ZSOLAR"
- ❌ "Tier-1/Tier-2/Tier-3" externally → ✅ "Base / Regular / Power"
- ❌ "50/25/20/5" · "75/20/3/2" · "50/20/20/10" → ✅ "1.0 member / 0.25 treasury (1.25 per verified unit)"
- ❌ "continuous 20% burn" · "burn-per-mint" · "20% burned" → ✅ "treasury-share step-down 0.25 → 0.10"
- ❌ "Genesis Halving" as a current mechanism → ✅ deprecated, do not surface

## 12. Why no halving and no burn

- **There is no burn at mint** — minting then immediately burning the same tokens has zero net supply effect.
- **There is no LP mint** — LP is fed by subscriptions and the separate 3% transfer tax only.
- **Supply-side control is the treasury-share step-down**: 0.25 → 0.10 once Store redemption exceeds 30% for two consecutive quarters. Mechanical and scheduled.
- **No UX cliff** — rewards stay predictable, no overnight 50% drop to explain to users.
- Code constants (`GENESIS_HALVING`, `GenesisHalvingAnnouncementModal`, `FlywheelSimulation`) remain in the repo for optional future re-activation but must NOT be surfaced in any copy.
