# Production Remix Plan — Evergreen Grassroots Edition (LOCKED)

## Core Philosophy (non-negotiable, baked in day 1)

**Literal promise to every subscriber:** "100% of your subscription — every gross dollar, before Stripe fees — goes directly into the $ZSOLAR Liquidity Pool. ZenSolar Inc. takes zero cut from your subscription."

- **Ops funding:** 5% mint treasury slice + seed capital. NOT subscription revenue.
- **Stripe fees:** Absorbed by ZenSolar (treasury), never netted from the LP transfer. The LP receives the full $9.99 / $19.99 / $49.99 / $99.99.
- **Messaging rule:** Every subscription surface (pricing page, checkout, settings, receipts, emails) must state "100% to LP" with a tooltip explaining ZenSolar covers processing fees.

## Subscription Tiers (4)

| Tier | Price | Mint Multiplier | Audience |
|---|---|---|---|
| Spark | $9.99/mo | 1.0× | Entry / friends & family |
| Flame | $19.99/mo | 2.5× | Standard household |
| Inferno | $49.99/mo | 7× | Power user / multi-asset |
| Titan | $99.99/mo | 15× | Whale / fleet / commercial |

## Weekly Tap-to-Claim Minting

- Verified kWh accrue **off-chain** in a `weekly_accrual_ledger` table, Mon 00:00 UTC → Sun 23:59 UTC.
- Users see live accrual counter on CEC dashboard all week.
- **Mandatory "Tap to Claim This Week's Rewards" button** unlocks Monday 00:00 UTC and stays open 7 days.
- Skipped weeks → accrual forfeited to LP (anti-passive-farming, drives engagement).
- Claim mints to user wallet on Base Sepolia (beta) → real Base mainnet at launch.

## 1-Year Rolling Lock

- Every claimed batch enters a 365-day lock from claim timestamp.
- Wallet UI shows: Liquid balance, Locked balance, "Next unlock" countdown ribbon.
- Enforced on-chain via vesting contract (Sepolia stub → mainnet real).
- Prevents dump-on-mint behavior, aligns subscribers with long-term LP health.

## Investment-First Messaging

Replace all "earn rewards / passive income / get tokens" copy with:
- "Fund the flywheel you own."
- "Your $9.99 is an investment in the LP that backs your own minted tokens."
- "Every subscriber strengthens the floor under every other subscriber."
- Founding-member badge framed as "Day-1 LP backer."

## Founding Member Pledge Flow (LLC-pending mode)

Unchanged from prior plan:
- Pledge form (email + wallet + tier + e-signature) → `founding_members` table.
- Auto-issues "Founding Member #001–100" badge.
- Phase B (after LLC + business checking): Stripe $1 pre-auth, then full billing at mainnet launch.

## Refinement Prompt (paste as first message in zensolar-prod remix)

```
This is the production-ready remix of ZenSolar (R&D project stays on beta.zen.solar).
Domain: zensolar.com (+ zen.solar). Mainnet launch is post-raise; we are in
Beta Sepolia mode with a Founding Member Pledge flow until LLC + business
checking are in place.

CORE PHILOSOPHY — EVERGREEN GRASSROOTS MODEL (LOCKED, NON-NEGOTIABLE):

1. 100% of EVERY subscription dollar (gross, before Stripe fees) goes
   directly to the $ZSOLAR Liquidity Pool. ZenSolar Inc. takes zero cut
   from subscriptions. Stripe processing fees are absorbed by ZenSolar
   treasury — the LP receives the full sticker price ($9.99/$19.99/
   $49.99/$99.99). Ops are funded by the 5% mint treasury slice + seed
   capital, never by subscription revenue.

2. Four subscription tiers with mint multipliers:
   - Spark   $9.99/mo  — 1.0× mint multiplier
   - Flame   $19.99/mo — 2.5× mint multiplier
   - Inferno $49.99/mo — 7×   mint multiplier
   - Titan   $99.99/mo — 15×  mint multiplier

3. Weekly accrual + mandatory Tap-to-Claim:
   - Verified kWh accrue off-chain Mon 00:00 UTC → Sun 23:59 UTC.
   - "Tap to Claim This Week's Rewards" button opens Monday 00:00 UTC
     for 7 days. Skipped weeks forfeit to LP.
   - Claims mint on Base Sepolia (labeled BETA) — flip to Base mainnet
     at launch via single config switch.

4. 1-year rolling lock on every claimed batch (365 days from claim
   timestamp). Wallet shows Liquid / Locked / Next-unlock countdown.
   Enforced on-chain by vesting contract.

5. Investment-first messaging everywhere. No "earn / passive income /
   free tokens" copy. Use "fund the flywheel you own", "Day-1 LP
   backer", "your subscription strengthens the floor under every
   subscriber's tokens".

PRUNE TO CORE FUNNEL + RETENTION HOOKS:
Keep: Home (consumer copy), Auth, Onboarding, OEM Connect (Tesla,
Enphase, SolarEdge, Wallbox), Clean Energy Center dashboard + Tap-to-
Mint, Wallet (Liquid/Locked/Unlock schedule), Receipts, Proof-of-
Genesis, NFT Milestones, Store Redemption, Subscribe (4 tiers + 100%-
to-LP messaging), Founding Member Pledge, Settings, Support.

Remove: all /admin/* tools, investor pitch pages, patent docs, Starlink
plan, future-projects pages, founder vault, Deason internal tools, all
simulator/demo/VIP gates, all experimental routes.

BACKEND: Fresh Lovable Cloud project. Migrate ~15 essential tables
(profiles, user_roles, connected_devices, energy_production, mint_
transactions, mint_idempotency_keys, user_rewards, bidirectional_mint_
events, home_charging_sessions, charging_sessions, referrals, feedback,
support_requests, kpi_tap_events + new founding_members + new weekly_
accrual_ledger + new locked_token_batches). No mainnet contracts. No
tokenomics changes — mint split v3.1 stays locked (50/25/20/5 + 3%
transfer tax).

FOUNDING MEMBER PLEDGE (LLC-pending):
Phase A: pledge form (email + wallet + tier + e-sig) → founding_members
table, auto-issues "Founding Member #001–100" badge, admin CSV export.
Phase B (after LLC): enable Stripe $1 pre-auth, convert pledges, full
billing at mainnet launch.

Confirm you understand the Evergreen Grassroots Model is locked and
will be enforced across every subscription surface, then start pruning.
```

## Memory writes (build mode)

When approved I will:
1. Save `mem://features/evergreen-grassroots-model.md` (full ruleset) and add a Core line to `mem://index.md`.
2. Reply exactly: "Evergreen Grassroots Model locked and refinement prompt updated for the production remix."

## Reminder
I cannot create the remix from here. After you approve, I save memory + you right-click the project → Remix → paste the prompt above into the new project's first message.
