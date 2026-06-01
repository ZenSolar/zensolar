# Project Memory

## Core
React 18, Vite, Supabase, Base L2. Strict mobile-first (390x844).
Dark theme, "Less is More". Emerald green primary. 100svh/100dvh.
"Creating Currency From Energy". No crypto jargon. Primary IP term is "Proof-of-Genesis™". Use "Tap-to-Mint™" only when describing the literal tap gesture or enumerating the trademark stack (see brand/naming.md).
Investor revenue engines (LOCKED Jun 2026 corrections): 01 Monthly Subscription + Deason AI ($4.99 premium add-on on $9.99/$19.99/$49.99 tiers), 02 Token Economics (core product, long-term primary revenue driver — 1T cap, 7% transfer tax), 03 Aggregated Energy Data.
Investor pages: no Founder Bios card, no Schedule a Call card — single `joe@zensolar.com` mailto in footer is the only contact path. /investor card order LOCKED: 1) Full Seed Round Deck (/deck) → 2) One-Pager (/investor/one-pager) → 3) Live Investor Demo. NEVER "Full Pitch Deck" — always "Full Seed Round Deck". One-Pager AND /investor/pitch headline both omit $20M post (kept only on deck Slide 13). All OEM lists MUST include Wallbox alongside Tesla/Enphase/SolarEdge. Mint split (50/20/20/10) and 7% transfer tax (3/2/2) are INDEPENDENT mechanisms — never conflate. Investor SSOT surfaces = /investor + /investor/pitch + /investor/one-pager + /deck ONLY. Legacy `FoundersSeedPitch` and `FoundersSsotOnePager` are archived at /admin/archive/founders-seed-pitch-greg and /admin/archive/founders-ssot-one-pager — do not resurrect, do not reintroduce 75/20/3/2 split copy.
Embedded Coinbase Wallet. Reown AppKit. Hard redirects for OAuth.
1T hard cap. Mint split v3.1 (LIVE): 50% user · 20% LP · 20% burn · 10% treasury. UI ALWAYS shows 1 kWh = 1 $ZSOLAR — protocol matches the user's mint 1-for-1 in the background ("401(k)-match" framing, never "haircut"). Supersedes 50/25/20/3/2 (proposed, never live) and legacy 75/20/3/2. Mint ratio LOCKED v3.1 at 1 kWh = 1 $ZSOLAR. Sell pressure managed via Hybrid sell-throttle (vesting + stake-to-unlock); lever values TBD. Seed ask: $5M target · $20M post-money · $7M hard cap (SAFE, post-money). Full lever menu at /founders/creative-1to1-tokenomics.
Launch price $0.10 USDC via LP-seeded tranches — NEVER "launch at $1".
Launch price (LP math) and kWh-floor are TWO INDEPENDENT mechanisms — never conflate.
Founders pact-locked: Joseph 150B, Michael 50B. $1T crossovers: $6.67 / $20.
ALL demo/preview/share URLs MUST use https://beta.zen.solar — NEVER lovable.app or lovable.dev domains.
NEVER say "cheetah" for sell cohorts. Tschida = co-founder Michael only.
Satoshi-Mirror v2: EIA monthly oracle = guaranteed floor; Treasury auto-buyback via POL = floor defense.
Subscriptions v2 (LOCKED 2026-05): Base $9.99 / Regular $19.99 / Power $49.99 — every dollar splits 50% LP / 50% treasury. External names always Base/Regular/Power (never Tier-1/2/3, never "Auto-Mint"/"Pro"/"Elite").
Genesis Halving DEPRECATED in v3.1 narrative — continuous 20% burn per mint is the deflation mechanism. Do NOT surface "halving" in new user/investor copy. Code constants (`GENESIS_HALVING`, modal, simulation) retained for optional future re-activation only.
Billing infra not wired yet (no Stripe). `/subscribe` route shows tier picker only — checkout pending Michael sign-off on provider.
Patent status: ONLY the non-provisional "Gamifying and Tokenizing Sustainable Behaviors" patent is filed. Starlink/SpaceX/Optimus tokenization angle is roadmap/concept only — NOT filed. Never say "Starlink patent filed."

## Memories
- [Fundraising Strategy (Strategic Seed)](mem://features/fundraising-strategy.md) — $3M/$5M cap, Lyndon Rive anchor via Jo Ferrier, MZ Group plan B, use-of-funds, deck rules
- [Mint Split v3.1 (LIVE)](mem://features/mint-split-v3-locked) — v3.1 LIVE: 50/20/20/10 split, UI 1:1, 401(k)-match framing. Supersedes 50/25/20/3/2 and 75/20/3/2.
- [Mint ratio SSoT (1:1)](mem://features/mint-ratio-ssot) — Strictly 1 $ZSOLAR = 1 kWh = 1 mile. Never multiply tokens by 10. Never back-calc via `tokens / USER_SHARE`.
- [Battery bi-dir not integrated](mem://features/battery-bidir-not-integrated) — Receipts/KPIs must NOT read bidir_export/bidir_out/bidir_import rows yet.
- [Tiered Subscriptions Flywheel (v3.1)](mem://features/tiered-subscriptions-flywheel) — 3 tiers + steady-state per-tier flywheel math under continuous 20% burn (halving deprecated).
- [Deason AI Utility Optimizer](mem://features/deason-utility-optimizer) — Phase 1 weekly report, Phase 1.5 monthly deep insights + /energy-insights, Phase 2 Tesla FSD miles (10:1).
- [Satoshi-Mirror v2 Oracle](mem://features/satoshi-mirror-v2-oracle) — EIA monthly floor + treasury auto-buyback. Pending Michael sign-off.
- [Sell-cohort terminology](mem://preferences/terminology-sell-cohort) — never "cheetah" for sellers; that's Michael Tschida.
- [Energy Price Oracle (parked)](mem://roadmap/energy-price-oracle) — Per-user verified $/kWh on-chain. Phase 3 = Series A moat.
- [Launch Model (LP rounds)](mem://features/launch-model) — $0.10 launch, tranche-per-round LP seeding.
- [Auth & Web3 Integration](mem://features/auth) — Wallet connection, auth guards, PWA constraints.
- [Tokenomics & Mechanics](mem://features/tokenomics) — Protocol limits, mint allocations, burn logic, LP automation.
- [Energy Verification Engine](mem://features/energy-verification) — Cryptographic standards, ownership transfer.
- [Clean Energy Center Dashboard](mem://features/dashboard) — UI specs, fallbacks, navigation.
- [Investor Demo Gate](mem://features/demo-gate) — Access logic, screenshots.
- [Global Theme & Brand](mem://style/theme) — Visual aesthetics, terminology, tokens.
- [Animations & Sensory Feedback](mem://style/animations-and-audio) — Performance, audio architecture.
- [Tech Stack & Resilience](mem://technical/architecture) — Core libraries, mobile-first, auto-recovery.
