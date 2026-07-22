# Deck v3.2 — Simpler, Personal, Demo-Proven (revised)

Key correction from you: **the Catalyst = the repealed 30% ITC + $7,500 EV credit** (the market problem). Your personal story (laid off, daughter born, Grok on Rogan, 15 yrs in solar → built it with AI) is the **Founder Story**, which lives on its own slide, not on the Catalyst slide.

That means we need a new slide slot for the founder story. Recommend inserting it as **Slide 03 "Why Me"**, right after Catalyst, so the flow goes: problem → who's fixing it → market → product → moat → tech → revenue → scale → competition → ask. Deck grows from 11 → 12 slides.

## Locked slide copy

### Slide 01 — Hero (trimmed)
- Eyebrow: `Seed Round · Confidential`
- Logo, headline `Creating Currency From Energy.`
- One-line sub: *The first consumer app that turns verified clean energy into a hard-capped digital currency — live today across Tesla, Enphase, SolarEdge, and Wallbox.*
- Ask strip: `$1M Target` · `$2M Hard Cap` · `Convertible Note`
- Footer: `Joseph Maushart & Michael Tschida`
- **Cut** the second "lean seed / self-sustainability" paragraph.

### Slide 02 — The Catalyst (real problem — repealed incentives)
- Kicker: `The Catalyst`
- Headline: `The 30% Solar ITC and $7,500 EV Credit are gone.`
- Sub: *For the first time in a generation, Americans have zero federal financial incentive to go clean. The industry needs a new incentive — one the market provides, not Washington.*
- Two columns:
  - **What just disappeared** (red): `30% Solar & Storage ITC` · `$7,500 Federal EV Credit` · `Net metering rollbacks state-by-state`
  - **What has to replace it** (green): *A permanent, market-driven incentive that pays homeowners every time their panels or EV do their job. That's $ZSOLAR.*
- One-liner close: *Bitcoin proved a market can create its own incentive. We're doing it for energy.*

### Slide 03 — Why Me (NEW — your founder story, your words)
- Kicker: `Why Me`
- Headline: `I lived this problem. Then AI let me build the answer.`
- Body (one paragraph, your voice, ~85 words):
  > *I spent 15 years in renewable energy — sales, marketing, partnerships, including SolarCity. I watched every incentive cycle. Then last year I got laid off the same week my daughter was born. I'd already gone deep on Web3 and seen the same pattern in both industries I love — real technology, dragged down by bad actors. When I heard Elon tell Rogan that AI could write code for you, I finally had the missing piece. So I built the consumer app I'd been sketching for a decade.*
- Three small proof cards: `15 yrs renewable energy` · `Ex-SolarCity` · `Shipped with AI + relentless iteration`
- Bottom strip: *And I didn't build it alone. Michael Tschida — lifelong best friend, co-founder, CFO/CRO — runs the numbers so I can run the product.*

### Slide 04 — The Opportunity
- Keep TAM/SAM/SOM (1.5B / 33M / 4.2M).
- Headline: `$1.7T/yr flows into clean energy. Nobody has tokenized the kWh itself.`
- Two-line close: *Bitcoin burns energy to create scarcity. We reward energy to create currency.*
- **Cut** the "One patent · multiple markets" three-column block.

### Slide 05 — Traction (screenshot hero)
- Headline: `Real users. Real kWh. On-chain.`
- Left: real Clean Energy Center screenshot (product-shot skill).
- Right: `21 Milestone NFTs` · `12 beta users` · `644k kWh/miles verified`
- Caption: *Not a mockup. Running on my phone right now.*

### Slide 06 — The Solution (screenshot hero)
- Kicker: `Tap-to-Mint™`
- Headline: `Every kWh becomes currency.`
- Center: Tap-to-Mint screenshot (charging tile with live $ZSOLAR sublabel).
- Caption strip: `Produce → Verify → Mint`

### Slide 07 — Foundational Moat (screenshot hero)
- Headline: `The first app to unify every major OEM.`
- Screenshot: multi-OEM dashboard (Tesla + Enphase + SolarEdge + Wallbox).
- One line: *Mixed-system homeowners had four apps. Now they have one. This is the prerequisite for tokenization — and nobody else has it.*

### Slide 08 — Tech & IP
- Three cards, no prose:
  - `Patent-pending` — U.S. App. 19/634,402 · Proof-of-Genesis™
  - `Base L2` — Coinbase's chain · embedded wallets · low fees
  - `Multi-OEM verified` — direct API integrations, not scraped

### Slide 09 — Three Revenue Engines
Three cards (≤25 words each):
1. **Subscription + Deason AI** — $9.99–$49.99/mo tiers, $4.99 Deason add-on. *Includes Deason screenshot.*
2. **Token Economics** — 1T cap, 50/25/20/5 split, 3% transfer tax recycles LP forever.
3. **Aggregated Energy Data** — anonymized multi-OEM telemetry to utilities, ISOs, REC registries.

### Slide 10 — Scale (Data + VPP)
- Headline: `The same rails scale to commercial, fleets, and VPP.`
- Bullets: `Commercial solar & fleet EV` · `Grid demand-response / VPP` · `Installer mint network`
- Anchor: `Leap Energy → CAISO → OEM partner-tier APIs`

### Slide 11 — Competition
- Keep the comparison table. Cut prose above it.

### Slide 12 — The Ask
- `$1M Target · $2M Cap · Convertible Note`
- Use-of-funds table + milestones (unchanged).
- Founder strip: Joseph + Michael one-liners.
- Closing: *Bitcoin tokenized scarcity. We're tokenizing abundance.*

## Screenshots
Four screenshots to capture from the running preview via Playwright (session already injected) and polish through the product-shot skill (macOS chrome + gradient):
1. Clean Energy Center dashboard → Slide 05
2. Tap-to-Mint charging tile with live $ZSOLAR sublabel → Slide 06
3. Multi-OEM unified view → Slide 07
4. Deason chat interface → Slide 09

I'll show you each polished screenshot before embedding.

## Files
- `src/components/investor/pitch/slides/v3/S01Hero.tsx` … `S12Ask.tsx` (rewrite existing 11 + add new S03WhyMe.tsx).
- Update the deck's slide list + labels array to include the new slide.
- New `src/assets/deck/v3-2/` for the 4 polished screenshots.
- No route/config/SSOT changes.

## Out of scope
- `/investor` and `/investor/pitch` narrative pages, `/seed/one-pager` (deck-only pass).
- Ask amounts, mint split, VPP scope, competition table structure.

## Next
1. Capture + polish 4 screenshots.
2. Rewrite 11 slides + add Slide 03.
3. Playwright through `/deck` end-to-end and show you every slide before you present it.