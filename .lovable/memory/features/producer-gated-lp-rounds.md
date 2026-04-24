---
name: Producer-Gated LP Rounds
description: Strategy for gating $ZSOLAR LP tranches by verified clean-energy production so day-traders and crypto whales (e.g. Saylor-tier) cannot dominate the round. Producers earn the right to buy.
type: feature
---

# Producer-Gated LP Rounds

## Principle
Every other token launch in history rewards the fastest wallet with the most capital. ZenSolar inverts this: **you earn the right to buy $ZSOLAR by producing clean energy, not by having the most USDC.**

Day-traders and Saylor-tier whales can technically participate, but only on terms that explicitly favor app users who have minted verified kWh.

## Mechanisms (mix-and-match per round)

1. **Proof-of-Genesis gate** — Each LP tranche is only buyable by wallets that have minted ≥ X kWh of verified clean energy in the prior 30 days. Whales with zero panels = zero access.

2. **Per-wallet purchase cap per round** — e.g., max $500 USDC per wallet per tranche. Forces sybil attacks (which we detect) or just opt-out.

3. **kWh-weighted allocation** — Purchase ceiling = `min($500, your_minted_kWh × $0.50)`. The more energy you've produced, the more you can buy.

4. **24-hour producer-only window, then open** — First day of each round is gated to verified producers. Whatever's left opens to the public. Whales can buy, but only the scraps the community didn't want.

5. **Holding-period soulbound discount** — Producers who held ≥ 90 days get the round at $0.10. Everyone else pays $0.15. Day-traders are structurally worse off than long-term believers.

## Why this is a moat (not a limitation)

> "ZenSolar is the first token that filters its own buyers by physical contribution to the grid. You don't buy your way in. You earn your way in by generating the very thing it represents."

- **Saylor tweets about it** → free marketing. He'll hate it publicly and respect it privately.
- **Crypto press writes 50 articles** → "the anti-pump-and-dump token launch."
- **Every solar installer becomes a recruiter** → "Get our system, qualify for the next $ZSOLAR tranche."
- **Regulators love it** → producer-aligned, not speculation-aligned.

## How to apply
- Always introduce LP rounds with the producer-gated framing first; the price/size second.
- Never describe rounds as "open to everyone" — they're "open to producers, then everyone else."
- The "24-hr producer window" is the public hook; mention it in every round announcement.
- Keep the math defensible: publish `total_minted_kWh_eligible` and `total_round_size_USDC` so the gating is auditable.

## Forbidden phrasings
- ❌ "Anyone can buy $ZSOLAR in the next round" → ✅ "Producers buy first. Everyone else gets the leftovers."
- ❌ "First-come, first-served" → ✅ "Earn first, buy first."

## Open question (decide before round 1)
- Exact kWh threshold for round eligibility (suggested floor: 25 kWh / 30 days).
- Whether to allow non-producer pre-purchase via referral from a verified producer (creates organic acquisition flywheel — possibly worth it).
