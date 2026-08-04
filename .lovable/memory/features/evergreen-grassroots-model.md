---
name: Evergreen Grassroots Model (ARCHIVED)
description: Historical subscription proposal. Superseded by current subscription and mint-split locks; never use its 5% treasury slice or v3.1 split.
type: feature
---

# ARCHIVED — Evergreen Grassroots Model

> This proposal is not current guidance. Its v3.1 mint split and 5% treasury
> assumptions conflict with mint split v4.0 (1.0 member + 0.25 treasury, no LP
> mint, no burn at mint). Retained for historical context only.

## 1. 100% to LP (literal, gross)
- Every gross subscription dollar — BEFORE Stripe fees — goes directly to the $ZSOLAR Liquidity Pool.
- ZenSolar Inc. takes **zero** cut from subscriptions.
- Stripe processing fees absorbed by ZenSolar treasury. LP receives the full sticker price.
- Ops funded by: 5% mint treasury slice + seed capital. NEVER subscription revenue.
- Every subscription surface (pricing, checkout, settings, receipts, emails) must state "100% to LP" with tooltip explaining ZenSolar covers processing fees.

## 2. Four Tiers + Mint Multipliers
| Tier | Price/mo | Multiplier |
|---|---|---|
| Spark | $9.99 | 1.0× |
| Flame | $19.99 | 2.5× |
| Inferno | $49.99 | 7× |
| Titan | $99.99 | 15× |

## 3. Weekly Tap-to-Claim
- Verified kWh accrue off-chain Mon 00:00 UTC → Sun 23:59 UTC (`weekly_accrual_ledger`).
- Mandatory "Tap to Claim This Week's Rewards" button opens Monday 00:00 UTC, 7-day window.
- Skipped weeks → accrual forfeited to LP. Anti-passive-farming, drives engagement.
- Claims mint on Base Sepolia (BETA label) → flip to Base mainnet at launch via single config switch.

## 4. 1-Year Rolling Lock
- Every claimed batch enters 365-day lock from claim timestamp.
- Wallet UI: Liquid balance / Locked balance / Next-unlock countdown.
- Enforced on-chain by vesting contract (Sepolia stub → mainnet real).

## 5. Investment-First Messaging
- BANNED copy: "earn rewards", "passive income", "free tokens", "get paid".
- REQUIRED framing: "Fund the flywheel you own", "Day-1 LP backer", "Your subscription strengthens the floor under every subscriber's tokens".
- Founding-member badge = "Day-1 LP backer".

## Scope
- Lives in the production remix (`zensolar-prod` → zensolar.com).
- R&D project (this one, beta.zen.solar) keeps existing 50/50 SubscriptionStatusCard / flywheelLedger UNTOUCHED unless explicitly asked.
- Historical note only; current mint economics are governed exclusively by the v4.0 SSOT.
