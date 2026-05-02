---
name: ZenSolar Canonical Source of Truth
description: THE single source of truth for ZenSolar economics, allocations, halving, LP rounds, founder pact, vesting, equity vs token split, and open questions. Every other doc, slide, contract, and memory MUST defer to this file.
type: feature
---

# ZenSolar — Canonical Source of Truth (SSoT)

> **Read this first.** This file overrides every other memory, doc, slide, code comment, and contract draft. If something conflicts, fix the other file — never edit around this one.

> **Last locked:** 2026-05-02 (v2.1 — 10:1 mint ratio, liquidity plan, dashboard UI rules)

---

## 0. v2.1 Mint Ratio Decision — Switched to 10:1 (Economic Win Model) — 2026-05-02

**Decision:** The mint ratio is officially **10 kWh = 1 $ZSOLAR** (and **10 EV miles = 1 $ZSOLAR**).

### Rationale

| Lever | 1:1 (old) | **10:1 (new)** | Effect |
|---|---|---|---|
| Tokens minted from 700 kWh/user/mo | 700 | **70** | 10× lower issuance |
| Tokens received (75% user share) | 525 | **52.5** | 10× lower sell pressure |
| Sell pressure at 100k users | very high | manageable from day one | flywheel positive immediately |

### Realistic baseline (use everywhere)

- Average user activity: **700 kWh/month**
- Tokens received per user/month: **52.5**
- At $0.10 launch price: ~$5.25/mo token value back to user

### Dashboard UI Rule (Locked)

- Clean Energy Center headline must show **"X tokens eligible for minting"** (10:1 ratio).
- Raw kWh remains visible as secondary text / tooltip.

### Code state

- `src/lib/tokenomics.ts` uses `MINT_RATIO_KWH_PER_TOKEN = 10`

---

## 1. Token & Cap

| Item | Value |
|---|---|
| Token | **$ZSOLAR** |
| Chain | Base L2 |
| Hard cap | **1,000,000,000,000 (1T)** — contract-enforced |
| Decimals | 18 |
| Launch price | **$0.10 USDC** per $ZSOLAR |

---

## 2. Allocation Table (LOCKED)

| Bucket | % | Tokens | Notes |
|---|---|---|---|
| Community (Mint-on-Proof) | 70.00% | 700,000,000,000 | Subject to halving |
| Joseph Maushart | 15.00% | 150,000,000,000 | Pact-locked until $6.67 |
| Michael Tschida | 5.00% | 50,000,000,000 | Pact-locked until $20 |
| Treasury | 7.50% | 75,000,000,000 | 2-yr vest |
| Team Pool | 2.49% | 24,900,000,000 | Future hires |
| Strategic Introductions | 0.01% | 100,000,000 | 12-mo vest, 3-mo cliff |
| **TOTAL** | 100% | 1T | |

---

## 3. Per-Mint Distribution (LOCKED)

| Slice | % | Purpose |
|---|---|---|
| User | 75% | Producer reward |
| Burn | 20% | Permanent destruction |
| LP | 3% | Liquidity growth |
| Treasury | 2% | Operations |

Transfer tax: 7%. Redemption burn: 5%.

---

## 4. Halving Schedule (LOCKED)

4-year cadence on the 700B community pool only.

---

## 5. Founder Pact-Lock (LOCKED)

Joseph: 150B locked until $6.67 crossover
Michael: 50B locked until $20 crossover

---

## 6. Liquidity Pool Strategy & Strategic Expansion (LOCKED 2026-05)

**Total liquidity reserve required in seed round: $1.7M**

| Round | Trigger | USDC to LP | Tokens to LP | Funding Source |
|-------|---------|------------|--------------|----------------|
| OG | Day 0 | $200,000 | 2,000,000 | Seed round |
| Round 2 | 25,000 users | $500,000 | 5,000,000 | Seed round |
| Round 3 | 100,000 users | $1,000,000 | 8,000,000 | Seed round |
| Round 4+ | 250,000+ users | $2M+ | Scaling | **100% self-funded from 50% subscription revenue** |

**Self-funding milestone:** By ~100k paying users the flywheel is fully self-sustaining. No further capital raises needed for liquidity.

---

## 7. Scarcity Stack (always cite all 5 + floor)

1. 1T hard cap
2. 20% burn-per-mint
3. Halving schedule
4. Founder pact-lock
5. Protocol-Owned Liquidity (POL)

**+ Satoshi-Mirror v2 floor** (6th layer)

---

## 8. Subscription Model (v2 — LOCKED)

| Tier | Price/mo | LP/mo | Treasury/mo | Sell-rate |
|---|---|---|---|---|
| Base | $9.99 | $4.995 | $4.995 | 90% |
| Regular | $19.99 | $9.995 | $9.995 | 25% |
| Power | $49.99 | $24.995 | $24.995 | 5% |

---

## 9. Sell Pressure Assumptions (LOCKED)

- Average activity: 700 kWh/user/month → 52.5 tokens received
- Tier sell rates: Base 90%, Regular 25%, Power 5%
- Cohort mix evolves from base-heavy → more Regular/Power

---

## 10. Dashboard / Clean Energy Center UI Rules

- Headline metric: **"X tokens eligible for minting"** (10:1)
- Raw kWh shown as secondary text/tooltip only

---

## 11. Staking / Locking Incentives (Planned)

Regular + Power tiers will offer:

- 3-month lock → 1.2× mint multiplier
- 6-month lock → 1.5×
- 12-month lock → 2.0×
- 24-month lock → 3.0×

---

## 12. Open Questions (Updated)

1. Final binding mechanism for founder pact-lock
2. Exact on-chain implementation details for Genesis Halving
3. ZK-Proof-of-Genesis provisional filing timeline

---

## 13. Forbidden Statements

- ❌ "1 kWh = 1 $ZSOLAR"
- ❌ "Launch at $1"
- ❌ "10B supply"
- ❌ "Anyone can buy at launch"

---

## 14. Change Protocol

Propose change → Joseph approves → edit in place → bump "Last locked" date.

**End of Canonical Source of Truth**
