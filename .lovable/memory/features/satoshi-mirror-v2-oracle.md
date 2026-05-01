---
name: Satoshi-Mirror v2 — EIA Energy Floor Oracle & Treasury Auto-Buyback
description: Locked decisions for the Satoshi-mirror v2 economic model — EIA-anchored guaranteed floor price (mirrors Bitcoin's rising electricity-cost floor), monthly oracle cadence, and treasury auto-buyback as the floor defense mechanism. Pending Michael sign-off on SSoT lock.
type: feature
---

# Satoshi-Mirror v2 — EIA Floor Oracle & Treasury Auto-Buyback

Locked 2026-04-30 by Joseph. Pending Michael Tschida review before promotion to `CANONICAL_SSoT.md`.

## Core thesis (mirrors Bitcoin exactly)

Bitcoin has an implicit guaranteed floor: the marginal cost of electricity to mine one BTC. As global electricity prices rise, that floor rises with them — miners will not sell below cost for long.

$ZSOLAR makes this **explicit and on-chain**: the guaranteed floor price tracks the U.S. average residential $/kWh from the EIA. As electricity costs rise over time, the $ZSOLAR floor rises in lockstep — same mechanism as Bitcoin, just made transparent and auditable instead of implicit.

## Locked decisions

### 1. Oracle source
- **U.S. EIA** (Energy Information Administration) — average residential retail electricity price, all sectors, national
- Public, government-issued, audit-grade data
- Series: EIA average retail price of electricity (cents per kWh, residential)

### 2. Oracle cadence
- **Monthly** — matches EIA's official release schedule
- Floor price updates once per month after EIA publishes
- No intra-month adjustments (avoids manipulation surface)

### 3. Floor defense mechanism
- **Treasury auto-buyback** using Protocol-Owned Liquidity (POL)
- When market price ≤ EIA-derived floor, treasury automatically buys $ZSOLAR from the LP until price recovers above floor
- POL acts as the standing bid — no rented/mercenary liquidity, no rug risk
- Buyback caps and reserve thresholds: **TBD — Michael sign-off required**

### 4. Independence from launch price
- Launch price ($0.10 LP math) and EIA floor are **two independent mechanisms** — same SSoT rule applies here
- At seed: EIA floor is narrative + monitored, treasury buyback active above $0.10
- The two converge as electricity costs rise; never conflated in any deck or doc

## Required Michael sign-offs (before SSoT lock)

1. **Oracle scope** — confirm U.S. EIA residential national average is the right series (vs. industrial, vs. state-weighted, vs. multi-country basket)
2. **Scarcity Stack update** — promote EIA floor to a 6th layer in `mem://features/scarcity-stack` (Bitcoin-mirror floor) or keep as separate "guaranteed floor" mechanism
3. **Treasury buyback caps** — max % of treasury deployable per month, reserve floor that pauses buybacks, circuit breakers
4. **Burn vs. Reserve split** — when buyback executes, what % of repurchased $ZSOLAR is burned vs. held in treasury reserve

### 5. Mint ratio decision (kWh : $ZSOLAR)

**Locked: keep 1 kWh : 1 $ZSOLAR.** Do NOT compress to 10:1 at launch.

Reasoning:
- 10:1 ratio would mathematically eliminate the LP gap (5.3x surplus vs current 0.53x), but Satoshi-Mirror v2 (EIA floor + treasury auto-buyback) already solves the same problem without breaking the "1 kWh = 1 $ZSOLAR" narrative.
- A blunt ratio change collapses perceived reward at launch ($7.50/mo vs $75/mo at $0.10) and triggers churn before the floor mechanism has time to lift token value.
- Preferred path: let the **halving schedule** (`mem://features/halving-schedule`) compress issuance organically — first halving can be pulled forward to a user-count milestone (e.g., 250K users) and framed as "Genesis Halving" if extra dampening is needed.
- A one-time ratio compression remains a **belt-and-suspenders option** for Michael to consider, but only if framed as Genesis Halving — never as a silent ratio change.

Cross-ref: full 1:1 vs 10:1 vs Genesis Halving math is in the Michael memo (`/mnt/documents/satoshi-mirror-v2-michael-memo.pdf`).

## Cross-references
- Independent of: `mem://roadmap/energy-price-oracle` (that one is per-user verified $/kWh for minting; this one is national-average floor)
- Mirrors: Bitcoin's implicit electricity-cost floor
- Defends: launch price floor and all subsequent price floors as EIA $/kWh rises
- Updates pending: `CANONICAL_SSoT.md` §7 (Scarcity Stack), §12 (Open Questions)

## Status
**Decided in principle (Joseph). Awaiting Michael review.** Do not promote to SSoT or quote externally as locked until Michael signs off on the four items above.
