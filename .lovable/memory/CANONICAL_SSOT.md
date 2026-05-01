---
name: ZenSolar Canonical Source of Truth
description: THE single source of truth for ZenSolar economics, allocations, halving, LP rounds, founder pact, vesting, equity vs token split, and open questions. Every other doc, slide, contract, and memory MUST defer to this file. If it conflicts with another file, this file wins until explicitly updated.
type: feature
---

# ZenSolar — Canonical Source of Truth (SSoT)

> **Read this first.** This file overrides every other memory, doc, slide, code comment, and contract draft. If something conflicts, fix the other file — never edit around this one. Last locked: 2026-04-29.

---

## 1. Token & Cap

| Item | Value |
|---|---|
| Token | **$ZSOLAR** |
| Chain | Base L2 |
| Hard cap | **1,000,000,000,000 (1T)** — contract-enforced |
| Decimals | 18 |
| Launch price (LP math) | **$0.10 USDC** per $ZSOLAR |
| Real-world floor narrative | kWh value (utility + carbon + REC) — **narrative-only at seed**, on-chain Energy Oracle parked for Series A |

**Rule:** Launch price ($0.10 LP math) and kWh-floor (real-world utility) are **two independent mechanisms**. Never conflate them in any deck, doc, or code.

---

## 2. Allocation Table (LOCKED)

| Bucket | % | Tokens | Notes |
|---|---|---|---|
| **Community (Mint-on-Proof)** | 70.00% | 700,000,000,000 | Subject to 4-yr halving schedule (§4) |
| **Joseph Maushart (Founder/CEO)** | 15.00% | 150,000,000,000 | **Pact-locked** until $6.67 crossover (§5) |
| **Michael Tschida (CFO/CRO)** | 5.00% | 50,000,000,000 | **Pact-locked** until $6.67 crossover (§5) |
| **Treasury (multisig)** | 7.50% | 75,000,000,000 | 2-yr vest |
| **Team Pool** (future hires/advisors) | 2.49% | 24,900,000,000 | Out of halving pool |
| **Strategic Introductions** | 0.01% | 100,000,000 | Carved from team pool. 1M default per Lyndon-tier intro, 12-mo linear vest, 3-mo cliff |
| **TOTAL** | 100.00% | 1,000,000,000,000 | |

Founder + co-founder = **200B pact-locked, never enters halving emissions**.

---

## 3. Per-Mint Distribution (LOCKED)

Every $ZSOLAR minted from a verified kWh splits as follows:

| Slice | % | Purpose |
|---|---|---|
| User wallet | **75%** | Producer reward |
| Burn | **20%** | Permanent supply destruction |
| LP injection | **3%** | Protocol-owned liquidity growth |
| Treasury | **2%** | Operational runway |

**Transfer tax** (on every $ZSOLAR transfer): 3% burn + 2% LP + 2% treasury = **7% total**.

**Redemption fee:** 5% burn on $ZSOLAR → fiat off-ramp.

---

## 4. Halving Schedule (LOCKED — corrected)

**4-year Bitcoin cadence** applied to the **700B community pool only** (treasury, team, founders are NOT subject to halving).

| Epoch | Years | Mintable | Annual rate | Cumulative | % of community pool |
|---|---|---|---|---|---|
| 1 | 0–4 | **350B** | 87.5B/yr | 350B | 50% |
| 2 | 4–8 | 175B | 43.75B/yr | 525B | 75% |
| 3 | 8–12 | 87.5B | 21.875B/yr | 612.5B | 87.5% |
| 4 | 12–16 | 43.75B | 10.94B/yr | 656.25B | 93.75% |
| 5 | 16–20 | 21.875B | 5.47B/yr | 678.125B | 96.875% |
| 6+ | 20→∞ | tail | … | →700B | →100% |

**Net-deflationary by Epoch 5** (~year 16): 20% burn-per-mint exceeds new issuance once epoch reward drops to 5.47B/yr.

Geometric series sums exactly to **700B** community pool. Bitcoin reaches its tail in ~116 years; ZenSolar in ~16.

---

## 5. Founder Pact-Lock (CURRENT POSTURE)

- **Joseph Maushart:** 150B locked. Cannot sell until **$6.67** $ZSOLAR price crossover (= $1T personal net worth at 150B).
- **Michael Tschida:** 50B locked. Cannot sell until **$20.00** $ZSOLAR price crossover (= $1T personal net worth at 50B).
- **Binding mechanism:** **TBD** — currently treated as voluntary public commitment + intent to enforce on-chain. Final choice (price-only / vest-only / both / both + 20-yr backstop) to be locked in a follow-up session.
- **Code state:** legacy 4-yr vest with 12-mo cliff still present in `src/lib/tokenomics.ts` — must be reconciled once §5 binding is decided.

**Always cite both crossover prices together** ($6.67 / $20). Never just one.

---

## 6. Liquidity Pool Strategy (Producer-Gated, Tranche-per-Round)

LP is **seeded per round, not as a single mainnet seed**. Each round is gated to verified energy producers first.

### Round model (working baseline — refine before Round 1)

| Round | User band | Indicative LP seed | Target $ZSOLAR seeded | Price |
|---|---|---|---|---|
| **OG** | Users 0–1,000 | **$50,000 USDC** | 500,000 $ZSOLAR | $0.10 |
| Round 2 | 1,000–10,000 | TBD (scales with verified kWh) | TBD | $0.10 floor |
| Round 3+ | 10,000+ | TBD | TBD | $0.10 floor |

Older docs cite `$200K / 2M` (memory) and `$300K / 3M` (`src/lib/tokenomics.ts` mainnet seed). **Both are deprecated** in favor of the tranche-per-round model above. The legacy single-seed numbers should only appear in archived contexts.

### Producer-gating mechanics (apply to every round)
1. **Proof-of-Genesis gate** — must have minted ≥ X kWh (suggested floor: 25 kWh / 30 days) to qualify
2. **Per-wallet cap per round** (e.g. $500 USDC)
3. **kWh-weighted ceiling:** `min($500, your_minted_kWh × $0.50)`
4. **24-hr producer-only window**, then opens to public
5. **Soulbound holding-period discount** for 90+ day holders

### Forbidden phrasings
- ❌ "Anyone can buy in the next round" → ✅ "Producers buy first. Everyone else gets the leftovers."
- ❌ "Launch at $1" → ✅ "Launch at $0.10, $1 is the first major target."

---

## 7. Scarcity Stack (always cite all 5)

| # | Mechanism | Bitcoin equivalent |
|---|---|---|
| 1 | 1T hard cap | ✅ |
| 2 | 20% burn-per-mint | ❌ |
| 3 | 4-yr halving (350B → 175B → …) | ✅ |
| 4 | Founder pact-lock (200B locked to $6.67/$20) | ❌ |
| 5 | Protocol-Owned Liquidity (POL) | ❌ |

Bitcoin = 1 mechanism. ZenSolar = 5 stacked. Net-deflationary 100 years sooner.

---

## 8. Tokens vs Equity — Critical Distinction

ZenSolar has **two cap tables**. Never mix them.

| | **Token cap table ($ZSOLAR)** | **Equity cap table (ZenCorp Inc)** |
|---|---|---|
| What | 1T protocol tokens | Company shares |
| Governs | On-chain protocol economics | Corporate decisions, exits, fundraising |
| Strategic intros get | **Tokens** (1M $ZSOLAR default) | Nothing automatically |
| Investors get | Tokens via SAFT/warrant (TBD per round) | Equity via SAFE/priced round |
| Voting | None (protocol is rules-based) | Standard corporate voting |

**Rule:** Externally always say "pre-launch token allocation" or "$ZSOLAR allocation" — **never** "equity" or "shares" — when describing token grants. Mixing the two creates securities-law and cap-table confusion.

---

## 9. Subscription Model (v2 — LOCKED 2026-05)

Three tiers, every dollar split **50% LP / 50% Treasury**. Dual-gate: community minting requires an active subscription.

| Tier | Price/mo | LP/mo | Treasury/mo | Assumed monthly sell-rate |
|---|---|---|---|---|
| **Base** | $9.99 | $4.995 | $4.995 | 90% (cash-out cohort) |
| **Regular** | $19.99 | $9.995 | $9.995 | 25% (default holders) |
| **Power** | $49.99 | $24.995 | $24.995 | 5% (prosumer/staker) |

- Optional Base-tier soft mint cap: **800–1,000 tokens/mo** (Regular + Power uncapped).
- Staking/locking multipliers (Regular + Power, future): 6-mo lock = 1.5×, 12-mo lock = 2.0×.
- Full model + per-tier flywheel math: `mem://features/tiered-subscriptions-halving-flywheel`.

## 9a. v2 Tokenomics & Flywheel Model (2026-05)

The v2 flywheel keeps **1 kWh = 1 $ZSOLAR** and **1T hard cap** intact. The LP-coverage gap is closed by three mechanisms working together:

1. **Tiered subscriptions** (§9 above) — Power tier is net-positive on day one.
2. **Genesis Halving** — first halving (50% mint-rate cut) is **pulled forward** to a user milestone instead of waiting 4 years.
   - **Primary trigger:** 250,000 paying subscribers.
   - **Fallback:** 4-year on-chain cadence if milestone not hit first.
   - **Comms:** Always called "Genesis Halving." Pre-announce 3–6 months out. Existing users get a bonus month at the pre-halving rate.
3. **Satoshi-Mirror v2** — EIA $/kWh × 2^epoch floor + treasury auto-buyback via POL. See `mem://features/satoshi-mirror-v2-oracle`.

**Mint mechanics unchanged from §3:** 75% user / 20% burn / 3% LP / 2% treasury. Genesis Halving multiplies the **per-kWh mint amount** by 0.5; the split percentages stay the same.

**Code:** `src/lib/tokenomics.ts` exports `SUBSCRIPTION_TIERS` and `GENESIS_HALVING`. `contracts/ZSOLAR.sol` is **not yet updated** (still legacy 10B model) — leave untouched until Michael signs off on full flywheel math.

**External phrasing:** Tier names are **Base / Regular / Power** (never "Tier-1/2/3"). The mint-rate cut is **Genesis Halving** (never "mint cut" or "ratio change").

---

## 10. Reward Rates (1:1 base, scarcity-preserving)

| Activity | Base rate |
|---|---|
| Solar production | 1 $ZSOLAR / kWh |
| Battery discharge | 1 $ZSOLAR / kWh |
| EV miles | 1 $ZSOLAR / mile |
| EV charging | 1 $ZSOLAR / kWh |
| FSD supervised miles | 1 $ZSOLAR / mile |
| FSD unsupervised miles | 1 $ZSOLAR / mile |

**Live Beta multiplier:** 10× (test mode only, never production).

---

## 11. Scaling Milestones (ARR ↔ Users, ~$250 ARPU)

| Milestone | Users | ARR |
|---|---|---|
| Tipping point | 25,000 | — |
| Scale target | 100,000 | — |
| $1M ARR | 4,000 | $1M |
| $10M ARR | 40,000 | $10M |
| $100M ARR | 400,000 | $100M |
| $1B ARR | 4,000,000 | $1B |
| $5B ARR | 20,000,000 | $5B |

---

## 12. Open Questions (must resolve before mainnet)

1. **Founder pact-lock binding mechanism** — price-only / vest-only / both / both + 20-yr backstop. Current code has legacy vest; current narrative is pact-only. Pick one.
2. **LP round sizing math** — formalize the per-round seed formula (USDC + $ZSOLAR) and per-wallet caps for OG, Round 2, Round 3+.
3. **kWh threshold for round eligibility** — suggested floor 25 kWh / 30 days; confirm.
4. **`ZSOLAR.sol` rewrite** — contract still reflects archived 10B model. Must be rebuilt to match this SSoT before mainnet.
5. **SAFT/warrant terms** for non-producer investors who can't qualify via energy production.
6. **Halving on-chain enforcement** — narrative is locked; Solidity logic not yet written.
7. **Energy Price Oracle** — parked for Series A. Confirm it stays parked through seed.
8. **Decentralized oracle migration timeline** — Chainlink Functions / DON in Phase 2 (Series A). Confirm trigger condition (user count? TVL? regulatory?). See `mem://features/proof-of-genesis-verification`.
9. **ZK-Proof-of-Genesis provisional filing** — file Patent Track 4 (ZEN-003) this quarter to secure priority date even though implementation is Series B / Phase 3.

---

## 13. Forbidden Statements (auto-fail any draft)

- ❌ "Launch at $1" (it's $0.10; $1 is a target)
- ❌ "10B supply" (deprecated; we are 1T)
- ❌ "Anyone can buy at launch" (producer-gated)
- ❌ Citing scarcity using fewer than all 5 stack layers
- ❌ Calling token grants "equity" or "shares"
- ❌ "$1T market cap crossover" when referring to founder net-worth crossovers ($6.67 / $20 are *individual founder* net-worth thresholds, not project market cap)
- ❌ Using `lovable.app` or `lovable.dev` in any shared URL — always `https://beta.zen.solar`

---

## 14. Change Protocol

To update this file:
1. Propose change in chat with explicit before/after.
2. Joseph approves.
3. Update this file + bump "Last locked" date at top.
4. Update `mem://index.md` Core if a Core rule changed.
5. Update or archive any conflicting downstream memory file in the same commit.

**Never** create a new "v2" or "draft" version of this file. There is one SSoT. Edit in place.
