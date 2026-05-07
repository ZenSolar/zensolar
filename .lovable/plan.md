## Goal
Make tokenomics content newbie-friendly across the app, with a single source-of-truth page and progressive disclosure everywhere else.

## 1. Single Source of Truth: `/how-it-works` hub
Extend the existing `src/pages/HowItWorks.tsx` with a new newbie-first section component:

**New component: `src/components/how-it-works/TokenomicsExplained.tsx`**
A long-form, plain-English section with 6 simple sub-cards (icons + 1-paragraph each):
1. **You earn tokens for clean energy** — 1 kWh = 1 $ZSOLAR (beta), 0.1 at mainnet (the 10:1 framing)
2. **Pick a plan** — 3 tiers (Base / Regular / Power) with one-line benefit each
3. **Half of every dollar strengthens the token** — 50/50 LP / treasury split, simple analogy
4. **Your tokens are locked for 12 months** — vesting in friendly terms ("locked so the price can grow stronger"), optional staking = bigger rewards
5. **Genesis Halving + Satoshi-Mirror floor defense** — "rewards get rarer over time, like Bitcoin" + "a built-in safety net keeps the price from crashing"
6. **100–200 year scarcity outlook** — short summary + link to full table

Reuse existing `ScarcityOutlookSection` at the bottom.

## 2. Reusable `Tokenomics101Card` component
**New: `src/components/tokenomics/Tokenomics101Card.tsx`**

Compact glassmorphism card with 4 stacked rows, each one short line + icon:
- 3 tiers shown as mini-pills (Base / Regular / Power)
- "Half of every subscription dollar strengthens the token"
- "New tokens lock for 12 months so the price can grow stronger"
- "Hold or stake longer = bigger rewards"

Footer: prominent CTA button → `/how-it-works`.

Drop into:
- `src/pages/Subscribe.tsx` (above or below tier selector)
- `src/components/ZenSolarDashboard.tsx` (replacing or complementing the existing `HowItWorks` mini-card section)
- Mint success screen (locate via search; likely `src/components/dashboard/` or onboarding/mint flow)

## 3. Progressive disclosure trims
Identify and shorten/remove duplicated long-form tokenomics blocks on:
- Subscription screen (`TierSelectionScreen`) — keep tier cards but strip any embedded LP/vesting paragraphs; replace with `Tokenomics101Card` link
- Dashboard — replace verbose explainers with the 101 card
- Mint flow / mint success — 1–2 sentence summary + "Learn more →" link
- Wallet screen — short blurb + link
- Learn / HelpCenter — short intros that link to the hub

For each, swap heavy copy for: 1 sentence + "Learn how ZenSolar works →" link.

## 4. Language pass
Search-and-replace on user-facing strings (NOT internal code/comments/founder/admin pages):
- "LP injection" / "liquidity injection" → "Half of every subscription dollar automatically strengthens the token"
- "Vesting" (user-facing) → "Locked for 12 months so the price can grow stronger"
- "Staking" (user-facing) → "Lock longer and earn extra rewards"

Skip founder/admin/whitepaper/SSOT pages — they're for technical audiences.

## Out of scope
- Founder/admin/SSOT/whitepaper pages (technical audiences keep precise terminology)
- Business logic, tokenomics math, ledger code
- New routes (reuse existing `/how-it-works`)

## Technical notes
- Reuse `Card`, `Button`, semantic tokens from index.css
- Use `lucide-react` icons already in the project
- `framer-motion` for entrance animations matching existing how-it-works sections
- Link component from `react-router-dom` with `useBasePath()` where applicable (demo route awareness)
