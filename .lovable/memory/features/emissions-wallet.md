---
name: ZenSolar Emissions Wallet (Gas Sponsorship)
description: Treasury or dedicated wallet covers ALL on-chain gas costs for user mints — users never pay gas. Core to Tap-to-Mint UX promise.
type: feature
---

# Emissions Wallet — Gas Sponsorship Architecture

## Promise
Users **never pay gas** to mint $ZSOLAR. Period. This is non-negotiable and central to the "Tap-to-Mint™" / "no crypto jargon" UX commitment.

## Mechanism
- ZenSolar operates either the **main treasury wallet** or a **dedicated Emissions Wallet** that sponsors every user mint transaction on Base L2.
- Implementation path: Coinbase Smart Wallet paymaster / ERC-4337 sponsored userOps, or relayer pattern.
- All mint txns are signed by the user but gas is paid by the Emissions Wallet.

## Funding Sources
1. **2% treasury allocation** of every mint (per protocol split: 75% user / 20% burn / 3% LP / 2% treasury)
2. **50% Company Ops side** of subscription revenue (Base $9.99 / Auto-Mint $19.99) — gas sponsorship is an explicit line item alongside engineering, legal, support
3. Future: Optional buffer from LP fees if needed

## Scale Math (for transparency panels)
- Base L2 cost: ~$0.001 per mint txn
- 1M users × daily Auto-Mint ≈ 30M txns/month
- Cost: ~$30K/mo at full scale — trivial vs $6.5M/mo company ops budget
- Even with 10× gas spike → still <0.5% of ops

## UI / Narrative Implications
- **Always include** "Includes gas sponsorship — users never pay to mint" in any "Company Ops" breakdown
- Turns an invisible operational cost into a **visible UX benefit**
- Reinforces the "Less is More" / "no crypto jargon" brand promise
- Investor framing: "Gas sponsorship is a CAC line, not a tax — keeps activation friction at zero"

## What this is NOT
- ❌ Not a token sink (doesn't affect $ZSOLAR supply)
- ❌ Not LP injection (separate from the 50% LP side of subs)
- ❌ Not a subsidy that runs out (funded by ongoing revenue, not seed capital)
