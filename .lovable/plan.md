# Deck v3.2 — Simpler, Personal, Demo-Proven

Refining the existing 11-slide `/deck` (v3.1) based on Greg Velez-Nick's feedback: **too wordy, needs the founder story, and needs to feel like a demo — not a whitepaper.**

Locked from prior decisions: 11-slide count, existing structure, $1M target / $2M cap ask, calm dark aesthetic, secondary-glow motif.

## What changes

### 1. Voice — first-person founder throughout
Rewrite every headline and body copy as **Joseph speaking**. No more "ZenSolar is a protocol that…" — it becomes "I spent [X years] at SolarCity watching…" Michael appears as co-founder on Slide 01 and Slide 11 only.

### 2. Copy diet — cut ~50% per slide
- Each slide gets **one headline, one supporting line, at most 3 bullets or 3 cards.**
- Kill sub-sub-explanations. If it needs a paragraph, it goes in the appendix or the read-along one-pager.
- Every card gets a hard word budget (title ≤6 words, body ≤20 words).

### 3. App screenshots as demo proof
Embed real ZenSolar app screenshots directly in-slide on **four slides** so the deck feels like a live demo:

| Slide | Screenshot |
|---|---|
| 04 Traction | Live Clean Energy Center (Joseph's or Harrison's real dashboard) |
| 05 Solution | Tap-to-Mint™ moment (charging tile with live $ZSOLAR sublabel) |
| 06 Foundational Moat | Multi-OEM unified view (Tesla + Enphase + Wallbox tiles) |
| 08 Three Revenue Engines | Subscription tier / Deason AI card |

I'll capture these from the running preview via Playwright (using your session), then run each through the product-shot skill (macOS window chrome + subtle gradient) so they read as polished demo shots, not raw phone screengrabs.

### 4. Slide-by-slide changes

| # | Slide | Change |
|---|---|---|
| 01 | Hero | Cut sub-subtitle paragraph. Keep headline + one line + ask strip. |
| 02 | Catalyst | First-person: "The 30% federal solar credit died. Homeowners lost their permanent incentive. I lived through it at SolarCity." Keep $1.7T card, cut patent card (moves to 07), keep moat card. |
| 03 | Opportunity | Keep TAM/SAM/SOM. Drop "One patent · multiple markets" block (moves to Slide 09). Tighten PoW-vs-PoG copy to 2 lines. |
| 04 | Traction | **New hero: real dashboard screenshot.** Metrics strip below (21 milestone NFTs, 12, 644k kWh/miles verified). |
| 05 | Solution | **Tap-to-Mint screenshot as centerpiece.** Three-step caption: Produce → Verify → Mint. |
| 06 | Foundational Moat | **Multi-OEM screenshot.** Under it: "Tesla + Enphase + SolarEdge + Wallbox in one app. Nobody else has this." |
| 07 | Tech & IP | Patent card + Base L2 + Proof-of-Genesis™. Cut to 3 bullets. |
| 08 | Three Revenue Engines | Keep 3-card structure. Each card ≤25 words. Subscription card gets the Deason screenshot. |
| 09 | Scale (Data + VPP) | Keep. Trim to headline + 3 bullets + one anchor strip. |
| 10 | Competition | Keep table. Cut prose above it. |
| 11 | The Ask | Ask strip + one-line founder bios (Joseph + Michael) + mailto. |

### 5. Founder story arc (needs your input)
You picked "Other" on the story arc — I need **3–5 sentences from you** on how ZenSolar came to be, in your own voice, before I can write Slides 01, 02, and 11. Suggested prompts to answer in the reply:
- What did you see at SolarCity that nobody else did?
- What was the "I have to build this" moment?
- Why you + Michael specifically?
- What are you betting your career on?

I'll take those sentences and translate them into deck copy — you'll approve before it ships.

## What I need from you to start

1. **Your story** (3–5 sentences per the prompts above).
2. **Screenshot go-ahead**: OK if I capture from the live preview using your session? Or would you rather send me 4 specific screenshots?

## Technical notes

- Files touched: `src/components/investor/pitch/slides/v3/S01Hero.tsx` through `S11Ask.tsx` (11 files).
- New asset dir: `src/assets/deck/v3-2/` for the polished product-shot screenshots.
- No route changes — `/deck` continues to render the same list, just refreshed content.
- Old v3.1 copy stays in git history; no separate archive needed.
- One-pager (`/investor/one-pager`) and `/investor/pitch` stay as-is this pass — deck-only refactor. I'll flag them for a follow-up if the new voice lands.

## Out of scope

- No new slides, no reordering.
- No VPP promotion to `/investor` or `/investor/pitch` (per SSOT lock).
- No changes to ask numbers or mint split.