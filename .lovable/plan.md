# ZenSolar YC Application Reference (Summer 2025)

---

## ✅ Complete Question Checklist

| # | Section | Question | Status | Notes |
|---|---------|----------|--------|-------|
| 1 | Founders | Founder profiles | ✅ | Add via YC dashboard |
| 2 | Founders | Who writes code? | ✅ | See Q4 below |
| 3 | Founders | Founder video (1 min intro) | ⏳ | Record before submission |
| 4 | Company | Company name | ✅ | ZenSolar |
| 5 | Company | 50 chars or less | ✅ | See Q3 below |
| 6 | Company | Company URL | ✅ | https://zensolar.lovable.app |
| 7 | Company | Demo link | ✅ | See "Demo" section |
| 8 | Company | Tech stack (≤300 chars) | ✅ | See Q5 below |
| 9 | Company | Where to run long-term? | ✅ | See "Location" section |
| 10 | Company | What will you make? (≤300 words) | ✅ | See Q2 below |
| 11 | Company | 1-min unlisted YouTube video | ⏳ | Record before submission |
| 12 | Progress | How far along? | ✅ | See Q1 below |
| 13 | Progress | How long working on this? | ✅ | See "Timeline" section |
| 14 | Progress | Monthly spend / runway | ✅ | See "Financials" section |
| 15 | Progress | Other investors? | ✅ | See "Financials" section |
| 16 | Progress | Founder full-time commitment? | ✅ | See "Commitment" section |
| 17 | Progress | Do you have revenue? | ✅ | See "Financials" section |
| 18 | Progress | Gross margin per transaction? | ✅ | See "Financials" section |
| 19 | Progress | Rejected before? What's changed? | ✅ | See "History" section |
| 20 | Idea | Why did you pick this idea? | ✅ | See "Why This Idea" section |
| 21 | Idea | Domain expertise? | ✅ | In "Why This Idea" section |
| 22 | Idea | How do you know people need this? | ✅ | See "Validation" section |
| 23 | Idea | What's new about it? | ✅ | See "Innovation" section |
| 24 | Idea | What substitutes exist today? | ✅ | See "Competitors" section |
| 25 | Idea | Who are competitors? | ✅ | See "Competitors" section |
| 26 | Idea | How will you beat them? | ✅ | See "Competitors" section |
| 27 | Equity | Shares outstanding | ✅ | See "Equity" section |
| 28 | Equity | Equity to non-founders | ✅ | See "Equity" section |
| 29 | Curious | Something surprising learned? | ✅ | See "Surprising Insight" section |

**Legend:** ✅ = Answer ready | ⏳ = Needs video recording

---

## Part 1: Best 50-Character Description Analysis

### The Options

| Option | Characters | Analysis |
|--------|------------|----------|
| **"Earn crypto for your clean energy use."** | 39 | ✅ **RECOMMENDED** - Simple, clear, action-oriented. "Earn" is powerful. Universal appeal. |
| "Blockchain rewards for solar & EV owners." | 42 | Good but "blockchain" can scare mainstream users |
| "Turn solar & EV miles into crypto rewards." | 43 | Specific but excludes battery users |
| "Web3 rewards for clean energy production." | 41 | "Web3" is jargon, less accessible |
| "The clean energy rewards app for crypto." | 40 | Awkward phrasing |
| "Mint crypto tokens for clean energy use." | 40 | "Mint" requires crypto knowledge |

### Recommendation: **"Earn crypto for your clean energy use."** (39 chars)

**Why this wins:**
- **"Earn"** is the most powerful verb - implies passive income
- **"Crypto"** is now mainstream enough (post-Bitcoin ETFs)
- **"Clean energy use"** covers solar, EV, battery, charging - all verticals
- **39 characters** leaves room if YC has a hard 50-char limit
- No jargon ("Web3", "blockchain", "mint", "tokens")
- Works for both crypto-native and mainstream audiences

**Alternative if you want to emphasize uniqueness:**
- "First Web3 platform for clean energy rewards." (45 chars) - adds "first" for differentiation

---

## Part 2: SEGI → Mint-on-Proof Rebrand Plan

### Branding Architecture

| Context | Term | Example |
|---------|------|---------|
| Customer-facing UI | **Mint-on-Proof™** | Dashboard, Landing, Auth |
| Technical subtitle | **"powered by SEGI"** | Technology page, White Paper |
| Admin/Patent docs | **SEGI (Software-Enabled Gateway Interface)** | AdminPatentMapping, AdminCompetitiveIntel |

### Files to Update

#### 1. Dashboard Tagline (Highest Priority)
**File:** `src/components/ZenSolarDashboard.tsx` (line 175)

Current:
```
patent-pending SEGI technology
```

New:
```
patent-pending Mint-on-Proof™ technology
```

#### 2. Landing Page Badge
**File:** `src/pages/Landing.tsx` (line 307)

Current:
```
Patent-Pending SEGI Technology
```

New:
```
Patent-Pending Mint-on-Proof™
```

#### 3. SEGIFlowDiagram Component
**File:** `src/components/whitepaper/SEGIFlowDiagram.tsx`

Updates:
- Line 53: "Patent-Pending SEGI Technology" → "The Mint-on-Proof™ Architecture"
- Line 56: Keep "Software-Enabled Gateway Interface" as subtitle badge
- Line 145: "SEGI sends tokens" → "Mint-on-Proof sends tokens"

**Rename file:** `SEGIFlowDiagram.tsx` → `MintOnProofFlowDiagram.tsx`

#### 4. SEGIMintingInfographic Component
**File:** `src/components/landing/SEGIMintingInfographic.tsx`

Updates:
- Line 58: "Patent-Pending SEGI Technology" → "Patent-Pending Mint-on-Proof™"

**Rename file:** `SEGIMintingInfographic.tsx` → `MintOnProofInfographic.tsx`

#### 5. Technology Page
**File:** `src/pages/Technology.tsx`

Updates:
- Line 141 (SEO): "SEGI Technology" → "Mint-on-Proof™ Technology"
- Line 157: "Meet SEGI" → "Meet Mint-on-Proof™"
- Line 160: Keep "powered by SEGI (Software-Enabled Gateway Interface)" as technical context
- Line 177: "What is SEGI?" → "What is Mint-on-Proof™?"
- Lines 30-62 (segiLayers): Rename to `mintOnProofLayers` but keep SEGI mentions in descriptions

#### 6. White Paper
**File:** `src/pages/WhitePaper.tsx`

Updates:
- Line 346: Keep dual terminology: "Mint-on-Proof architecture powered by SEGI"
- Line 386-391: Keep technical explanation with both terms

#### 7. Import Updates Required

Files that import renamed components:
- `src/pages/Landing.tsx` - Update import for `MintOnProofFlowDiagram`
- `src/pages/WhitePaper.tsx` - Update import for `MintOnProofFlowDiagram`

#### 8. Files to KEEP UNCHANGED (Admin/Patent)
- `src/pages/AdminPatentMapping.tsx` - Keep SEGI (patent documentation)
- `src/pages/AdminCompetitiveIntel.tsx` - Keep SEGI (technical analysis)
- `docs/` folder - Keep SEGI for patent references

---

## Part 3: plan.md YC Application Section

### New Section to Add: "## YC Application Reference (Summer 2025)"

---

## Quick Reference Answers

### Company Name
**ZenSolar**

### Company URL
https://zensolar.lovable.app

### Demo Link
https://zensolar.lovable.app/demo (interactive demo mode with simulated data)

### Location (Where to run long-term?)
**San Francisco Bay Area, California** — Central to the cleantech ecosystem, Tesla HQ proximity, and crypto/Web3 talent pool.

---

## Founders Section

### Q4: Who writes code? Who has been building?

I'm a solo technical founder building with AI-assisted development. I write all code using Lovable (AI coding platform powered by Claude), with Grok (xAI) for strategy/tokenomics and Claude 3.5 Sonnet for code reviews.

No non-founder has written code. The codebase includes 50+ React components, 20+ Supabase edge functions, and 3 Solidity smart contracts—all built in 9 months while learning blockchain development from scratch. This is my first software product, built entirely with AI tools.

### Founder Video (1 min intro)
⏳ **TO RECORD** — 60-second intro covering: who I am, 14 years in cleantech (SolarCity/Tesla ecosystem), what ZenSolar does, why now (tax credit phase-out), and what we're building.

---

## Progress Section

### Q1: How far along are you? (200-300 words)

Live beta with 11 users on Base Sepolia testnet. Fully functional integrations with Tesla Fleet API, Enphase Monitoring API, SolarEdge Monitoring API, and Wallbox API for real-time energy data. Smart contracts deployed: $ZSOLAR (ERC-20) and ZenSolarNFT (ERC-1155 with 42 milestone achievement tiers).

Our patent-pending Mint-on-Proof™ architecture (provisional filed March 2025) enables one-tap minting directly from the app. Users connect their devices in 60 seconds via OAuth, see their real-time energy metrics on a dashboard, and mint tokens/NFTs without needing external wallets or blockchain knowledge.

Key milestones:
- Functional 4-layer gateway architecture (API Aggregation → Data Normalization → Verification Engine → Smart Contract Bridge)
- Multi-manufacturer OAuth flows working (Tesla, Enphase, SolarEdge, Wallbox)
- 42-tier NFT achievement system with category-specific milestones
- In-app dropshipping store where users can redeem tokens for Tesla gift cards, power stations, and merch

Next: Coinbase Smart Wallet integration (embedded wallets for frictionless onboarding), auto-minting subscriptions ($9.99-$19.99/month), and mainnet launch.

---

### Question 2: What is your company going to make? (300-400 words)

ZenSolar is a mobile/web app that rewards solar owners and EV drivers with $ZSOLAR tokens and collectible NFTs for their verified clean energy use.

**How it works:** Users connect their Tesla, Enphase, SolarEdge, or Wallbox devices via secure OAuth. Our patent-pending Mint-on-Proof™ technology pulls real-time production data from manufacturer APIs, verifies it cryptographically, and lets users mint blockchain rewards with a single tap—no external wallets or crypto knowledge required.

**Key features:**
- **Embedded wallet** (coming soon): Sign up with email/Google, wallet auto-created. No seed phrases, no MetaMask.
- **One-tap minting**: $ZSOLAR tokens and milestone NFTs minted directly to your wallet, gasless.
- **In-app store**: Redeem tokens for Tesla gift cards, solar equipment, and branded merch.
- **In-app cash-out** (roadmap): Convert $ZSOLAR → USD → bank account without leaving the app.

**Business model:**
- $9.99/month (weekly auto-minting) — casual users
- $19.99/month (daily auto-minting) — power users
- $99-$499/month (commercial tier) — solar installers and EV fleet managers
- 3.5% transaction fee on all token activity (1.5% burn, 2% treasury)

**The Flywheel Effect:**
50% of subscription revenue is automatically injected into our liquidity pool, creating a self-reinforcing cycle: more subscribers → larger LP → higher token floor price → more valuable rewards → more subscribers. At 25,000 subscribers (our "Tipping Point"), monthly LP injections match our initial seed capital—the protocol becomes self-sustaining.

**Revenue at scale:**

| Users | Consumer | Commercial | ARR |
|-------|----------|------------|-----|
| 10,000 | 9,500 × $12 | 500 × $150 | **$2.3M** |
| 100,000 | 90,000 × $15 | 10,000 × $250 | **$48M** |
| 1,000,000 | 900,000 × $16 | 100,000 × $350 | **$593M** |

We're building the world's first Mint-on-Proof™ clean energy platform—replacing expiring federal tax credits with permanent, decentralized income for sustainable households.

---

### Question 3: 50 characters or less

**"Earn crypto for your clean energy use."** (39 characters)

---

### Question 4: Who writes code?

I'm a solo technical founder building with AI-assisted development. I write all code using Lovable (AI coding platform powered by Claude), with Grok (xAI) for strategy/tokenomics and Claude 3.5 Sonnet for code reviews.

No non-founder has written code. The codebase includes 50+ React components, 20+ Supabase edge functions, and 3 Solidity smart contracts—all built in 9 months while learning blockchain development from scratch. This is my first software product, built entirely with AI tools.

---

### Question 5: What tech stack are you using?

**Frontend:** React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Framer Motion, Recharts, TanStack Query, react-router-dom v7, react-hook-form + Zod.

**Mobile:** Capacitor (iOS/Android), VitePWA with Web Push notifications.

**Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Realtime).

**Blockchain:** Solidity on Base L2, wagmi + viem, Reown AppKit, Coinbase OnchainKit (embedded wallets coming).

**Security:** Cloudflare Turnstile (bot protection), Google Analytics.

**Payments (roadmap):** Stripe, MoonPay/Transak for fiat on/off-ramps.

**AI Stack:**
- **Lovable** — Primary development (AI coding platform powered by Claude)
- **Grok (xAI)** — Strategy, tokenomics modeling, debugging
- **Claude 3.5 Sonnet** — Code reviews, documentation

---

### Question 6: Are you looking for a cofounder?

Yes—specifically a technical cofounder with blockchain/Web3 experience. Ideally someone who can own smart contract security, embedded wallet integration, and mainnet deployment while I focus on product, growth, and energy partnerships.

Also open to a GTM/growth cofounder with cleantech or B2C subscription experience to help scale from 10K to 100K users.

---

### Question 7: Coding session you're proud of

I'm particularly proud of building our patent-pending Mint-on-Proof™ verification architecture—the system that converts real-time energy data from Tesla, Enphase, SolarEdge, and Wallbox APIs into cryptographically verified blockchain rewards.

**The challenge:** Energy monitoring APIs return complex, nested data structures with different schemas per manufacturer. We needed to normalize this data, verify authenticity, prevent replay attacks, and trigger smart contract mints—all in real-time with sub-second latency.

**What I built:**
- A 4-layer gateway architecture: API Aggregation → Data Normalization → Verification Engine → Smart Contract Bridge
- OAuth flows for 4 different manufacturer APIs (Tesla, Enphase, SolarEdge, Wallbox)
- Real-time delta calculations to award only NEW activity (not historical double-counting)
- One-tap in-app minting that triggers gasless ERC-20 and ERC-1155 NFT creation

**Result:** Users connect their devices in 60 seconds and see their first tokens minted within minutes—no blockchain knowledge required.

I'm not attaching the actual session because this architecture is our core IP (provisional patent filed March 2025), but I'm happy to walk through the system design in a call.

---

### Question 8: How do/will you make money?

**Consumer Subscriptions (Primary):**
- $9.99/month (weekly auto-minting) — casual residential users
- $19.99/month (daily auto-minting) — power users, solar enthusiasts
- $99-$499/month (commercial tier) — solar installers, EV fleet managers

**Token Economics:**
- 3.5% transaction fee on all $ZSOLAR activity (1.5% burn, 2% treasury)
- 50% of subscription revenue injected into liquidity pool (price floor support)
- 20% treasury allocation (750M tokens) — operational capital

**The Flywheel:**
Subscriptions → LP Injections → Higher Floor Price → More Valuable Rewards → More Subscribers

At 25,000 subscribers ("Tipping Point"), monthly injections match initial LP seed. The protocol becomes self-sustaining.

**Revenue Projections:**

| Users | Consumer Mix | Commercial Mix | ARR |
|-------|--------------|----------------|-----|
| 10,000 | 9,500 × $12 | 500 × $150 | **$2.3M** |
| 50,000 | 45,000 × $14 | 5,000 × $200 | **$19.5M** |
| 100,000 | 90,000 × $15 | 10,000 × $250 | **$48M** |
| 1,000,000 | 900,000 × $16 | 100,000 × $350 | **$593M** |

**In-App Token Redemption Store:**
Users already redeem $ZSOLAR for Tesla gift cards, Anker/EcoFlow power stations, and ZenSolar merch. This creates immediate token utility and generates margin on redemptions.

**Future Revenue (Phase 3+):**
- B2B data partnerships (insurance/warranty affiliates)
- White-labeling the rewards engine for solar installers
- **Tesla Partnership Vision**: $ZSOLAR accepted at Superchargers and Tesla Store

---

## Financials Section

### How long have founders been working on this? (~150 words)

I've been working on ZenSolar for **9 months** (since April 2024) in its current form as a crypto-rewards platform. However, ZenSolar as a company started in 2018 as a solar sales business. After the residential solar market contracted in 2022-2023, I pivoted to building this product—combining my cleantech domain expertise with the emerging crypto-rewards opportunity.

The past 9 months have been intensive: learning blockchain development from scratch, building the entire product with AI tools (Lovable, Grok, Claude), deploying smart contracts, and onboarding 11 beta users. I've worked on this full-time, funding development through savings.

### Monthly spend / Runway

**Current burn:** $0/month — fully bootstrapped. No external capital raised.

**Spend breakdown:**
- Hosting/infrastructure: $0 (Lovable Cloud free tier, Base Sepolia testnet)
- Development: $0 (AI tools, no contractors)
- Marketing: $0 (organic beta signups only)

**Runway:** Indefinite at current burn. Seeking $1-2M seed for 18-24 month runway to reach 25K subscriber "Tipping Point."

### Other investors involved?

**No.** ZenSolar is 100% bootstrapped. No angel investors, no pre-seed, no SAFEs issued.

The old LLC (ZenSolar LLC, formed 2018) had ~15-20% allocated to advisors for the original solar sales business. That entity will be dissolved or restructured upon any institutional funding. The crypto-rewards product is clean—no prior obligations.

### Which founder can commit full-time through Demo Day?

**I can.** I'm the sole founder and have been working full-time on ZenSolar since pivoting to the crypto-rewards product in April 2024. No other employment or commitments.

### Do you have revenue?

**No revenue yet.** Currently in free beta phase on testnet. Monetization begins at mainnet launch with subscription tiers ($9.99-$19.99/month consumer, $99-$499/month commercial).

### Gross margin per transaction?

**Projected 85-90% gross margin** on subscriptions (SaaS-like economics—minimal marginal cost per user after infrastructure is built).

For the in-app store (token redemptions):
- Tesla gift cards: ~5-10% margin (wholesale discount)
- Branded merch: ~40-60% margin (dropshipping)
- Hardware (power banks, chargers): ~15-25% margin

### Rejected before? What's changed?

**First-time applicant.** This is our first YC application.

---

## Idea Section

### Why did you pick this idea? (Refined)

I chose this idea because the clean energy transition is stalling: the "One Big Beautiful Bill" (signed 2025) phases out the 30% solar ITC and $7,500 EV credits by end of 2026. At the same time, millions of households already own solar panels, EVs, and batteries but lack ongoing motivation to maximize their use.

ZenSolar fills that gap. But even if tax credits stayed forever—they're one-time acquisition incentives, not retention incentives. They don't reward daily use. **We're the retention layer**—providing the ongoing, compounding rewards that keep users engaged with their clean energy systems for years after installation.

**Domain expertise:** I have 14 years in cleantech—starting at SolarCity pre-IPO (Elon Musk, Chairman) where I worked closely with founders Lyndon and Peter Rive and CRO Toby Corey. That experience ignited my entrepreneurial spirit. I started ZenSolar in 2018 as a solar sales company but pivoted to this product after seeing the crypto-rewards opportunity. This IS the evolution I've been searching for.

I also own a home solar + battery system and Tesla EV, so I personally experience the API silos and engagement drop-off this platform solves.

### How do you know people need this? (Validation)

1. **Personal pain point:** I own solar + battery + Tesla EV. After installation, engagement drops to zero—no ongoing reason to check production or optimize usage. The dopamine hit disappears.

2. **Beta user feedback (11 users):** Users report checking ZenSolar daily to see their "pending rewards"—something they never did with their manufacturer apps. The gamification layer (NFT milestones, token accumulation) creates stickiness.

3. **Market signal:** EVearn on VeChain has attracted users despite being EV-only and requiring external wallets. We're solving for the full stack with embedded wallets.

4. **Macro trend:** 4M+ US households have solar. 8M+ EVs on US roads. These owners already spent $20-100K on clean energy infrastructure—they're motivated to maximize ROI.

### What's new about what you're making? (Innovation)

1. **Mint-on-Proof™ (patent-pending):** First system that mints tokens on-demand from verified API data rather than distributing from pre-minted pools. This prevents inflation gaming and ensures 1:1 mapping between real-world activity and token issuance.

2. **Multi-vertical integration:** Competitors focus on single verticals (EVearn = EV only). We capture solar + battery + EV + charging in one dashboard, creating compound engagement.

3. **Embedded wallet (coming):** Email signup → auto-wallet → gasless minting → in-app cash-out. Users never need MetaMask, seed phrases, or gas tokens.

4. **Flywheel tokenomics:** 50% of subscription revenue auto-injected into liquidity pool. This creates a self-reinforcing price floor that makes rewards more valuable over time.

### What substitutes do people use today?

1. **Manufacturer apps (Tesla, Enphase, SolarEdge):** Monitor-only—no rewards, no gamification, no cross-device integration.

2. **Utility rebates / net metering:** One-time credits, not ongoing rewards. Many utilities are reducing net metering rates.

3. **Federal tax credits (ITC, EV credits):** One-time acquisition incentives—being phased out by 2026.

4. **Carbon offset programs:** Complex, opaque, and typically B2B-focused.

5. **Nothing:** Most solar/EV owners simply don't have an ongoing engagement mechanism after purchase.

---

## Competitors (Refined)

**Direct competitor:** EVearn by VeBetterDAO on VeChain—rewards EV drivers with $B3TR tokens for charging sessions.

**What we understand that they don't:**

1. **Multi-vertical integration:** EVearn rewards only EV charging. We capture the full clean energy stack: solar + battery + EV miles + charging. More metrics = more engagement = higher LTV.

2. **Mint-on-Proof™ (patent-pending):** Our system mints tokens on-demand from verified API data—no pre-minted pools. Our provisional patent (March 2025) covers this architecture.

3. **Embedded wallet (coming):** Competitors require external wallets. We're building email-signup → auto-wallet → gasless minting → in-app cash-out. Users never leave ZenSolar.

4. **Timing:** Federal incentives phase out 2025-2026. We become the private, decentralized replacement.

5. **Commercial tier:** $99-$499/month for solar installers and EV fleets—a B2B revenue stream competitors haven't addressed.

---

## Equity Section

### How many shares outstanding?

**Structure pending.** Currently operating as ZenSolar LLC (formed 2018 for solar sales business). Will restructure to C-Corp (Delaware) upon institutional funding, with standard 10,000,000 authorized shares.

The existing LLC will be dissolved—the crypto-rewards product is a clean-slate pivot with no prior equity obligations from the software product.

### How much equity has been given to non-founders?

**For the crypto-rewards product:** 0% — I own 100% of the product/IP.

**For the old LLC:** ~15-20% was allocated to advisors for the original solar sales business. Those advisors understand the LLC is dormant and will be dissolved. No equity from the current product has been issued.

---

## Curious Section

### Something surprising you've learned?

**The biggest surprise:** Users engage MORE with testnet tokens than I expected.

I assumed beta users would treat testnet $ZSOLAR as "fake money" with no engagement. Instead, they check the app daily, compete for NFT milestones, and ask when they can "actually sell" their tokens. The gamification layer (pending rewards counter, achievement NFTs, leaderboard potential) drives engagement even without real monetary value.

**The insight:** The token VALUE matters less than the TOKEN ACCUMULATION EXPERIENCE. People want to see numbers go up. This suggests mainnet launch will amplify engagement, not create it—the behavioral loop is already working.

---

## Moonshot Scenarios

**Multi-Year Customer Wealth Creation:**

An active household earning 1,000 tokens/month:

| Timeframe | Tokens | Value at $1 | Value at $5 | Value at $10 |
|-----------|--------|-------------|-------------|--------------|
| Year 1 | 12,000 | $12,000 | $60,000 | $120,000 |
| Year 5 | 60,000 | $60,000 | $300,000 | $600,000 |
| Year 10 | 120,000 | $120,000 | $600,000 | $1,200,000 |
| Year 20 | 240,000 | $240,000 | $1,200,000 | $2,400,000 |

**The pitch:** "We're not just building an app—we're building generational wealth for families who invested in solar and EVs."

**Tesla Partnership Vision:** Work with Tesla to accept $ZSOLAR as payment for Supercharging and Tesla Store purchases. Tesla users already earn tokens through our platform—letting them spend those tokens within the Tesla ecosystem creates a closed-loop economy.

---

## Summary of Changes

### Files to Create/Rename:
1. `src/components/whitepaper/MintOnProofFlowDiagram.tsx` (rename from SEGIFlowDiagram.tsx)
2. `src/components/landing/MintOnProofInfographic.tsx` (rename from SEGIMintingInfographic.tsx)

### Files to Update:
1. `src/components/ZenSolarDashboard.tsx` - Dashboard tagline
2. `src/pages/Landing.tsx` - Badge + imports
3. `src/pages/Technology.tsx` - Headers + SEO
4. `src/pages/WhitePaper.tsx` - Imports
5. `.lovable/plan.md` - Add complete YC Q&A section

### Files to Keep Unchanged:
- `src/pages/AdminPatentMapping.tsx`
- `src/pages/AdminCompetitiveIntel.tsx`
- All files in `docs/` folder
