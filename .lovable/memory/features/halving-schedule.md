---
name: Halving Schedule
description: 4-year Bitcoin-cadence halving locked as ZenSolar's emission schedule. Epoch 1 mints 400B (40% of 1T cap). 5 halvings inside 20-year founder pact-lock. Net-deflationary by epoch 5 as 20% burn-per-mint exceeds new issuance.
type: feature
---

# Halving Schedule (LOCKED)

## Decision
**Halve every 4 years.** Bitcoin-identical cadence. Mathematically optimal across saturatability, narrative cycles, and founder hold horizon.

## Schedule

| Epoch | Years | Mintable | Cumulative | % of 1T cap |
|-------|-------|----------|------------|-------------|
| 1 | 0–4 | **400B** | 400B | 40% |
| 2 | 4–8 | 200B | 600B | 60% |
| 3 | 8–12 | 100B | 700B | 70% |
| 4 | 12–16 | 50B | 750B | 75% |
| 5 | 16–20 | 25B | 775B | 77.5% |
| 6+ | 20→∞ | tail | →800B | →80% |

Remaining 200B = founder pact-locked (Joseph 150B + Michael 50B), never enters this schedule.

## Math basis
- Hard cap: 1T $ZSOLAR
- Founder locked: 200B (out of emission)
- Community emission pool: 800B
- Epoch 1 = 50% of community pool = 400B (geometric series sums exactly to 800B)
- Epoch 1 annual mint rate: **100B/yr ≈ 100B kWh/yr** — matches US residential solar + Tesla fleet addressable energy. Saturatable but not trivially.

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
