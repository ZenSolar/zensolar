---
name: Tiered Subscriptions Flywheel (v3.1)
description: Steady-state $ZSOLAR flywheel — v3.1 mint split (50/20/20/10) with continuous 20% burn replacing Genesis Halving. 3 subscription tiers (Base/Regular/Power), 10:1 mint ratio, Satoshi-Mirror floor.
type: feature
---

# v3.1 Tokenomics — Tiered Subscriptions Flywheel

Refreshed 2026-06-01. Supersedes `tiered-subscriptions-halving-flywheel.md`. Genesis Halving is **deprecated as a required mechanism** in v3.1 — continuous 20% burn per mint provides perpetual deflation without a UX cliff. Companion to `mem://features/satoshi-mirror-v2-oracle` and `CANONICAL_SSOT.md`.

## 1. Core principles (v2.1 ratio · v3.1 split — LOCKED)

- **10:1 mint ratio:** 10 verified kWh (or 10 EV miles) = 1 $ZSOLAR minted (raw). UI shows the user's 50% share as 1 kWh = 1 $ZSOLAR.
- **Mint split (v3.1 LIVE):** 50% user / 20% LP / 20% burn / 10% treasury. (Supersedes 75/20/3/2.)
- **Continuous deflation:** every mint burns 20% — no scheduled halving required.
- **1T hard cap unchanged.**
- **External phrasing:** "10 kWh = 1 $ZSOLAR" · "Satoshi-Mirror floor" · the protocol's 50% share is framed as a "matching contribution" (401(k)-style).

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

## 4. Per-tier flywheel math (steady-state, v3.1, $0.10 floor)

Assumes ~1,000 raw tokens minted/user/month → **500 to user (50% of mint)**. Remaining 500 = 200 LP + 200 burn + 100 treasury (the "matching contribution"). No halving regime; numbers hold across all phases.

| Tier | LP/user/mo | User tokens | Sold tokens | Sell pressure ($) | Net (LP − sells) |
|---|---|---|---|---|---|
| Base | $4.995 | 500 | 450 | $45.00 | **−$40.005** |
| Regular | $9.995 | 500 | 125 | $12.50 | **−$2.505** |
| Power | $24.995 | 500 | 25 | $2.50 | **+$22.495** |

**Key insight:** Power tier is strongly net-positive for LP; Regular sits near breakeven and improves as the cohort mix shifts upward; Base remains intentionally subsidized as the on-ramp. The 20% continuous burn on every mint provides perpetual scarcity — no halving cliff needed. Treasury auto-buyback (Satoshi-Mirror v2) absorbs residual Base-tier sell pressure.

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
- **Tiered subs + continuous 20% burn** = supply/demand balance at the cohort level.
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

- ❌ "1 kWh = 1 $ZSOLAR" (raw) → ✅ "10 kWh = 1 $ZSOLAR" (display ratio handled via 50% user share)
- ❌ "Tier-1/Tier-2/Tier-3" externally → ✅ "Base / Regular / Power"
- ❌ "75% user share" / "75/20/3/2" → ✅ "50% user share (v3.1)" / "50/20/20/10"
- ❌ "Genesis Halving" as a required v3.1 mechanism → ✅ "continuous 20% burn"

## 12. Why no halving in v3.1

- **Continuous 20% burn** is already perpetual deflation — smoother and more reliable than a one-time event.
- **Constant 20% LP allocation** deepens the pool every mint — no need to "force" scarcity via a mint-rate cut.
- **No UX cliff** — rewards stay predictable, no overnight 50% drop to explain to users.
- **Simpler model** — single steady-state regime, no pre/post-halving tables to maintain.
- Code constants (`GENESIS_HALVING`, `GenesisHalvingAnnouncementModal`, `FlywheelSimulation`) remain in the repo for optional future re-activation but should NOT be surfaced in new investor/user copy.
