# Investor Main Page Face Lift

Goal: turn `/investor` (and the embedded "Three Revenue Engines" block) into a confident, scannable, premium page. Less text, more hierarchy, stronger CTAs. Dark + green accents preserved.

## Files touched

1. `src/pages/Investor.tsx` — hero, Why now, Pitch block, materials grid, CTAs
2. `src/components/investor/ThreeRevenueEngines.tsx` — major text reduction + visual flywheel

No route, auth, NDA, or linked-page changes. Engines component is shared with `/investor/pitch`; we keep it tighter there too (acceptable — same SSOT, just leaner copy).

## 1. Hero (Investor.tsx)

- Keep headline "Creating Currency From Energy." and the 3 stat pills ($0.10 / 1T / 50%).
- Tighten subhead to one short line:
  *"Patent-pending protocol turning verified clean-energy into a hard-capped digital currency on Base."*
- More vertical breathing room (`pt-16 pb-20 md:pt-24 md:pb-28`).
- Slightly larger stat numbers (`text-xl md:text-2xl`), thinner labels.
- Primary CTA button unchanged in behavior, but visually larger and centered.

## 2. Why Now

- Keep 3 cards. Rewrite to short, punchy lines (≤ ~14 words each):
  - **$1.7T** — Global clean-energy capex. Nobody has tokenized the kWh.
  - **Patent-pending** — U.S. App. 19/634,402 — Proof-of-Genesis™ on Base.
  - **Live in beta** — Tesla, Enphase, SolarEdge, Wallbox — already minting.
- Larger title, looser line-height, more padding (`p-5 md:p-6`).

## 3. The Pitch — Three Revenue Engines (`ThreeRevenueEngines.tsx`)

Major reduction:

- **Flywheel** becomes the visual centerpiece: bigger pill chips with subtle gradient ring, arrows animated as simple chevrons, stacked vertically on mobile / horizontal on md+. Drop the explainer paragraph under it (or reduce to one short line).
- **Each engine card**:
  - Short title (unchanged)
  - Tagline (one line, italic accent)
  - Description: max 2 sentences, ~25 words
  - Bullets: cut to **2 max** (drop the rest)
  - Keep metric + metric label footer
  - Add small footer line: *"Full details in the Seed Round Deck →"* linking to `/deck`
- VPP "Phase 2 unlock" strip: keep but tighten to one sentence.

Locked numbers (mint split, $0.10, 1T cap, tax, tiers) stay verbatim — content is trimmed around them, not changed.

## 4. Materials / CTA section (UnlockedPanel)

- Promote to the visual climax of the page.
- Section header: "Investor Materials" + short subtitle.
- Replace the 4 small UnlockedCards with **larger premium cards** (`p-6`, icon in tinted square, title + 1 short line, arrow on hover). 2-col on tablet, 4-col on desktop, single col on mobile with comfy spacing.
- One **prominent primary CTA bar** above the grid:
  - Big secondary-colored button: **"View the Full Deck"** → `/deck`
  - Outline button next to it: **"Enter Live Demo"** → `demoHref`
- Keep the existing "Email me these links again" + footer note, but de-emphasized below.

## 5. Spacing & hierarchy

- Bump section vertical padding (`py-16 md:py-20`) and add a subtle divider gradient between sections.
- Standardize headings: section eyebrow (uppercase tracking-wide, muted) + bold title + optional one-line lede.
- Reduce overall text weight; rely on whitespace and the green accent for emphasis, not card density.

## 6. Out of scope

- No changes to NDA flow, PIN gate, routes, or any linked pages (`/deck`, `/investor/one-pager`, `/investor/data-room`, `/demo`).
- No new sections. No tokenomics or copy that contradicts SSOT memories.

## Verification

- Visual pass at 393×587 (current viewport) and desktop.
- Confirm `/investor/pitch` still renders cleanly with the slimmed engines component.
- Confirm preview-mode unlock flow still works (signed pseudo-state shows UnlockedPanel).
