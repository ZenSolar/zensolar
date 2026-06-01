---
name: Tiered Subscriptions + Genesis Halving Flywheel (v2.1 Tokenomics)
description: Final $ZSOLAR flywheel model — v2.1 mint ratio is 10 kWh = 1 $ZSOLAR (switched from 1:1 on 2026-05-02), 3 subscription tiers (Base/Regular/Power), Genesis Halving (Bitcoin-style 50% mint cut at 250K paying users or 4-yr cadence), and Satoshi-Mirror v2 EIA floor defense.
type: feature
---

# v2 Tokenomics — Tiered Subscriptions + Genesis Halving Flywheel

Locked 2026-05-01. Pitch-ready model for Lyndon Rive. Companion to `mem://features/satoshi-mirror-v2-oracle` and `CANONICAL_SSOT.md` §"v2 Tokenomics & Flywheel Model (2026-05)".

## 1. Core principles (v2.1 ratio · v3.1 split — math refreshed 2026-06-01)

- **10:1 mint ratio:** 10 verified kWh (or 10 EV miles) = 1 $ZSOLAR minted. (Switched from 1:1 on 2026-05-02 — see CANONICAL_SSOT §0.)
- **Mint split (v3.1 LIVE):** 50% user / 20% LP / 20% burn / 10% treasury. (Supersedes legacy 75/20/3/2.)
- **1T hard cap unchanged.**
- **External phrasing:** "10 kWh = 1 $ZSOLAR." "Genesis Halving." "Satoshi-Mirror floor." Protocol's 50% share is framed as a "matching contribution" (401(k)-style).

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

## 4. Genesis Halving (the flywheel fix)

**Definition:** A one-time 50% reduction in the per-kWh mint rate applied protocol-wide — exactly like Bitcoin's halving, but triggered by adoption rather than only time.

- **Trigger (primary):** **250,000 paying subscribers** reached.
- **Trigger (fallback):** 4-year on-chain cadence (Bitcoin-style) if user milestone not hit first.
- **Comms:** Always called **"Genesis Halving"** in all user-facing copy. Never "mint cut" or "rate change."
- **Pre-announcement:** **3–6 months in advance.** Existing users get a **bonus month at the pre-halving rate** before the cut.
- **Effect:** Average mint per user drops from ~1,000 → ~500/mo. LP injection per dollar of revenue stays the same → coverage ratio doubles overnight.

## 5. Per-tier flywheel math (illustrative, $0.10 floor)

Assumes ~1,000 raw tokens minted/user/month → **500 to user (50% of mint, v3.1)**. Remaining 500 = 200 LP + 200 burn + 100 treasury (the "matching contribution").

### Before Genesis Halving (1,000 raw tokens/user/mo)

| Tier | LP/user/mo | User tokens | Sold tokens | Sell pressure ($) | Net (LP − sells) |
|---|---|---|---|---|---|
| Base | $4.995 | 500 | 450 | $45.00 | **−$40.005** |
| Regular | $9.995 | 500 | 125 | $12.50 | **−$2.505** |
| Power | $24.995 | 500 | 25 | $2.50 | **+$22.495** |

### After Genesis Halving (500 raw tokens/user/mo)

| Tier | LP/user/mo | User tokens | Sold tokens | Sell pressure ($) | Net (LP − sells) |
|---|---|---|---|---|---|
| Base | $4.995 | 250 | 225 | $22.50 | **−$17.505** |
| Regular | $9.995 | 250 | 62.5 | $6.25 | **+$3.745** |
| Power | $24.995 | 250 | 12.5 | $1.25 | **+$23.745** |

**Key insight:** Regular tier flips net-positive immediately at halving (−$2.51 → +$3.75). Power tier compounds and is positive in both regimes. Base remains intentionally subsidized as the on-ramp — and the v3.1 split makes the underwater gap shallower than the legacy 75% model; treasury auto-buyback (Satoshi-Mirror v2) absorbs residual sell pressure.

## 6. Cohort mix evolution (target)

| Phase | Users | Base | Regular | Power |
|---|---|---|---|---|
| Launch | 0–10k | 60% | 35% | 5% |
| Growth | 10k–100k | 40% | 45% | 15% |
| Post-Halving | 250k+ | 25% | 50% | 25% |

Higher tiers grow as users accumulate token value and unlock staking multipliers.

## 7. Staking / locking incentives (Regular + Power, future)

- **6-month lock:** 1.5× mint multiplier + sell-rate assumed → halved
- **12-month lock:** 2.0× mint multiplier + minimal sell pressure
- Never offered to Base tier (preserves cash-out option).

## 8. Optional: soft mint cap on Base

- Base tier: optional **800–1,000 token/month soft cap** to prevent whales squatting on cheap tier.
- Regular + Power: **uncapped.**
- Implementation: enforce via subscription tier check at mint time.

## 9. How this interacts with Satoshi-Mirror v2

- **Satoshi-Mirror v2** = floor defense (EIA $/kWh × 2^epoch + treasury auto-buyback via POL).
- **Tiered subs + Genesis Halving** = supply/demand balance at the cohort level.
- The two are **complementary, independent mechanisms.** Floor catches what the flywheel doesn't absorb.

## 10. Open questions (Michael sign-off needed)

1. Genesis Halving trigger: **250K users** confirmed, or different milestone?
2. Base tier soft cap: enable at launch (800/1000) or hold for later?
3. Staking multipliers: ship at v2 or post-Halving?
4. Burn vs. reserve split on treasury auto-buyback (still pending from Satoshi-Mirror v2 memo).

## 11. Cross-references

- `CANONICAL_SSOT.md` §"v2 Tokenomics & Flywheel Model (2026-05)"
- `mem://features/satoshi-mirror-v2-oracle` — floor mechanism
- `mem://features/halving-schedule` — original 4-yr cadence (Genesis Halving is the user-count-triggered first halving)
- `src/lib/tokenomics.ts` — `SUBSCRIPTION_TIERS`, `GENESIS_HALVING` constants
- `/mnt/documents/satoshi-mirror-v2-michael-memo.pdf` — Michael narrative memo

## 12. Forbidden phrasings

- ❌ "1 kWh = 1 $ZSOLAR" → ✅ "10 kWh = 1 $ZSOLAR" (v2.1)
- ❌ "Mint cut" / "rate change" → ✅ "Genesis Halving"
- ❌ "Tier-1/Tier-2/Tier-3" externally → ✅ "Base / Regular / Power"

> **Note on §5 illustrative math:** the per-tier tables above were modeled at the old 1:1 ratio (1,000 raw tokens/user/mo). Under v2.1 (10:1) the equivalent baseline is ~70 raw tokens/user/mo from 700 kWh — directional conclusions (Power net-positive, Regular flips at halving, Base subsidized) still hold, but absolute dollar figures shrink ~10×. Refresh tables before next pitch.
