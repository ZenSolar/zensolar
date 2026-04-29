---
name: Cheetah Doomsday Scenario — Rebuttal
description: Math-backed refutation of "5K users + 30% sell 100% monthly = doomed". Three independent reasons the premise breaks.
type: feature
---

# Cheetah's Doomsday Premise vs. The Actual Model

**His claim:** "If we have 5,000 US users and 30% of them sell 100% of their tokens every month, we are doomed."

**Verdict:** False on three independent levels. Any one of them alone breaks the doomsday.

---

## The Math (run against SSoT — `FoundersFundedLP.tsx`)

**Inputs (locked SSoT):**
- 5,000 users (= Wave 2 cumulative)
- Net mint per user = 25 kWh × 0.5 ZSOLAR/kWh × 75% user share = **9.375 tokens/user/month**
- Subscription = $9.99/mo, 50% to LP = **$24,975/month into LP**
- Seed LP = $50K USDC + 500K ZSOLAR (k = 25,000,000,000)

**Pure AMM simulation, no lockups, 30% sell 100% every month:**
- Sell volume: 5,000 × 9.375 × 30% = **14,062 tokens/month dumped**
- Sub buys absorb: ~**16,521 tokens/month**
- **NET = LP gains 2,458 tokens/month even under doomsday**
- Spot price after 12 months: **$0.10 → $1.38** (still rises 13.8×)

The buy pressure from subs **mathematically exceeds** the sell pressure from doomsday-tier dumping at 5K users. Cheetah's intuition is wrong because he's not accounting for the **75/20/3/2 mint split** (only 75% of mints reach users) and the **$0.10 floor compounding** as USDC accumulates.

---

## Reason 1 — Lockups make Month 1-9 sell pressure literally zero

Wave 2 (the 5K-user wave) has a **9-month cliff + 9-month linear vest** (per `FoundersFundedLP.tsx` WAVES table).

- Months 1-9: zero tokens are liquid. **Sell pressure = 0.**
- LP grows by $24,975 × 9 = **$224,775 with zero outflow**
- New LP depth = $274,775 USDC (5.5× the seed)
- By the time anything CAN be sold, pool depth has 5×'d and floor price is well above $0.10

Cheetah's premise assumes liquid tokens that don't exist for the first 9 months.

---

## Reason 2 — The behavior is economically irrational (self-correcting)

At the $0.10 floor, a "30% sells 100% monthly" user nets:
- Sells 9.375 tokens × $0.10 = **$0.94 gross**
- Subscription cost: **$9.99**
- **Net loss: −$9.05/month**

Nobody pays $9.99 to earn $0.94. These users would **unsubscribe immediately**, not sell forever. The premise contains its own dissolution. The only rational subscriber at $0.10 is one with a long thesis (hold, or sell at >$1.07 break-even).

---

## Reason 3 — Sub buys structurally exceed seller dumps at scale

The buy/sell ratio at any user count N:
- Monthly buy pressure (USDC): N × $9.99 × 50% = **$5/user**
- Monthly sell pressure (tokens at floor): N × 9.375 × 30% × P = 2.81 × P × N USD

Set equal: 5 = 2.81 × P → **break-even price = $1.78/token**

So the model self-balances around ~$1.78 even with permanent 30% dumping. Far above the $0.10 floor. **The floor is structurally protected.**

---

## Communication points for Cheetah

1. **Show him the AMM math.** The k = x×y constant-product formula means buy pressure has compounding effect on price as USDC accumulates. He's reasoning linearly about a non-linear system.
2. **Show him the wave lockups.** The 9+9 cliff/vest on Wave 2 means his scenario can't even happen for 9 months.
3. **Show him the rationality test.** $9.99 sub for $0.94 in tokens = nobody does this. The "30% of 5K sell 100% monthly" cohort doesn't exist as paying subscribers.
4. **Live page proof:** `/founders/funded-lp` — built-in invariant tests, shows the full 10-wave ladder, math is auditable.

---

## When this comes up again

Reference this file. Don't re-derive. Show the AMM table:

| Mo | LP (USDC) | Spot Price |
|----|-----------|------------|
| 1  | $71,941   | $0.21      |
| 6  | $149,665  | $0.90      |
| 12 | $185,647  | **$1.38**  |

Even in Cheetah's scenario WITH NO LOCKUPS, price 13.8×'s in year 1.
