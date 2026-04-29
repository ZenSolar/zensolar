---
name: Halving Schedule
description: 4-year Bitcoin-cadence halving locked as ZenSolar's emission schedule. Applied to 700B community pool only (treasury/team/founders excluded). Epoch 1 mints 350B (87.5B/yr). 5 halvings inside 20-year founder pact-lock. Net-deflationary by epoch 5.
type: feature
---

# Halving Schedule (LOCKED)

> **Defers to `mem://CANONICAL_SSOT.md` §4.** If anything below conflicts with the SSoT, the SSoT wins.

## Decision
**Halve every 4 years**, applied to the **700B community pool only**. Treasury (75B), team (24.9B), strategic intros (100M), and founder pact-locked tokens (200B) are NOT subject to halving.

## Schedule (corrected 2026-04-29)

| Epoch | Years | Mintable | Annual rate | Cumulative | % of community pool |
|-------|-------|----------|-------------|------------|---------------------|
| 1 | 0–4 | **350B** | 87.5B/yr | 350B | 50% |
| 2 | 4–8 | 175B | 43.75B/yr | 525B | 75% |
| 3 | 8–12 | 87.5B | 21.875B/yr | 612.5B | 87.5% |
| 4 | 12–16 | 43.75B | 10.94B/yr | 656.25B | 93.75% |
| 5 | 16–20 | 21.875B | 5.47B/yr | 678.125B | 96.875% |
| 6+ | 20→∞ | tail | … | →700B | →100% |

## Math basis
- Hard cap: 1T $ZSOLAR
- Non-emission allocations: 300B (founders 200B + treasury 75B + team 24.9B + strategic intros 100M)
- Community emission pool: **700B**
- Epoch 1 = 50% of community pool = **350B** (geometric series sums exactly to 700B)
- Epoch 1 annual mint rate: **87.5B/yr** — saturatable against US residential solar + Tesla fleet addressable kWh, but scarcer than Bitcoin's flow at equivalent stage.

## Correction note
Earlier drafts (and an interim model run) cited Epoch 1 = 400B based on an 800B pool. That was wrong: it included treasury + team in the halving pool. The community pool is 700B. All emission numbers are now expressed against 700B.

## Why 4 years (vs 2 / 6 / milestone)
- **2-year:** epoch 1 = 200B/yr, far exceeds verifiable kWh today → schedule burns un-minted, 10 halvings creates narrative noise
- **6-year:** front-loads supply too long, only 3 halvings in 20yr (no excitement within VC fund cycle)
- **Milestone-based:** unpredictable, can't model price/supply curves, breaks Bitcoin pattern-match
- **4-year ✅:** instant Lyndon/Bitcoin recognition, 5 narrative events in founder hold window, saturatable at current global solar capacity, clean math

## Stacks with rest of scarcity engine
1. 1T hard cap (capped supply)
2. 20% burn-per-mint (every kWh shrinks float)
3. **4-year halving** (this) — issuance halves on schedule
4. Founder pact-lock (no cliff dumps)
5. Protocol-Owned Liquidity (no rented liquidity flight)

By **epoch 5 (years 16–20)**, only 6.25B/yr is being minted while 20% burn applies to all activity → ZenSolar becomes **net-deflationary** ~16 years after launch (vs Bitcoin's 116 years to its tail).

## The Lyndon line
*"Bitcoin halves every 4 years against wasted compute. ZenSolar halves every 4 years against productive clean energy. Same monetary discipline, real-world utility, net-deflationary inside 16 years instead of 116."*

## Status
- **Narrative:** locked (use everywhere — pitch, whitepaper, comparison tables)
- **On-chain enforcement:** not yet in `ZSOLAR.sol` — must be added before mainnet
- **Open governance Q (`supabase/migrations/20260427191530`):** "Bitcoin-style halving on LP injections?" — separate question about LP injection halving, NOT this emission halving. Can be answered post-Series A.

## Why
Established 2026-04-28 when Joseph asked for the mathematically optimized halving cadence ahead of the Lyndon Rive pitch. Modeled 2yr / 4yr / 6yr / milestone in `/tmp/halving_model.py`; 4-year won on every dimension. Joseph's instinct ("4 years like Bitcoin") matched the math.
