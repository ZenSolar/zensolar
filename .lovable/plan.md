# Final Investor Pages Polish Pass

Surgical visual refinements across the investor section. No messaging, number, structure, or section changes — only spacing, sizing, and styling tokens.

## Scope

Pages touched:
- `src/pages/Investor.tsx`
- `src/pages/InvestorWhyThisRound.tsx`
- `src/pages/InvestorOnePager.tsx`
- `src/pages/InvestorDataRoom.tsx`
- `src/pages/InvestorSolarCoinComparison.tsx`
- `src/pages/DeckPinGated.tsx`
- `src/components/investor/pitch/v3/DeckCard.tsx` (shared card)

Out of scope: deck slide internals (S01–S11), `InvestorPitch.tsx` content, `InvestorDataRoomPoG.tsx`.

## Changes

### 1. Shared `DeckCard` token bump
Standardize all investor cards in one place:
- Padding: `p-6` → `p-5 md:p-7` (more mobile breathing room, slightly more generous on desktop).
- Add subtle shadow: `shadow-[0_1px_0_0_hsl(var(--border)/0.6)_inset]` for premium depth.
- Border radius stays `rounded-2xl`.

This propagates to every page using `DeckCard` (most investor pages).

### 2. Mobile section spacing
On each page, tighten or loosen section vertical padding to a consistent scale:
- Hero sections: `py-12 md:py-20` (was inconsistent: `py-10`, `py-16`, `py-20`).
- Mid-page sections: `py-10 md:py-16`.
- Container horizontal: standardize `px-5 md:px-6`.

Applied to Investor.tsx (10+ sections), WhyThisRound, OnePager, DataRoom, SolarCoinComparison, DeckPinGated hero.

### 3. Stat tile mobile layout
Where 3 stat tiles sit in a row on mobile and feel cramped (Investor hero, DataRoom Round Overview, OnePager header stats):
- Use `grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4` instead of forcing 3-up on 390px.
- Tile padding: `p-4 md:p-5`.
- Number text: `text-xl md:text-2xl` so 3-up doesn't overflow.

### 4. Long-text readability
For long paragraph blocks (Long-Term Vision on WhyThisRound, Bitcoin/PoG comparison on Investor, SolarCoin comparison body):
- `leading-relaxed` → `leading-[1.65]` on mobile.
- Add `space-y-4` between stacked `<p>` instead of relying on `mt-4` ad-hoc.
- Max-width: `max-w-prose` on body copy.

### 5. CTA button consistency
Standardize "Back to Investor Hub", "View Full Deck", "Open …" Links across pages:
- `inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-4 py-2 text-sm hover:bg-card/70 transition-colors`.
- Apply uniformly to back-links and inline doc links.

### 6. Subtle section dividers
Where pages feel flat between sections, add a hairline rule:
- `<div className="mx-auto max-w-4xl border-t border-border/40" />` between major sections on Investor.tsx, WhyThisRound, DataRoom.
- Used sparingly (3–4 per page max).

### 7. SolarCoin comparison table
On `InvestorSolarCoinComparison.tsx`:
- Wrap comparison table in `overflow-x-auto` if not already.
- Reduce row padding on mobile: `px-3 py-3 md:px-4 md:py-4`.
- Stack comparison cards `grid-cols-1 md:grid-cols-2 gap-4` (verify current is OK; tighten gap if needed).

### 8. DeckPinGated hero polish
- Stat tile row: same `grid-cols-1 sm:grid-cols-3` treatment.
- Verified counter card: consistent padding with shared DeckCard.

## Verification
- Build passes.
- Visually scan `/investor`, `/investor/why-this-round`, `/investor/one-pager`, `/investor/data-room`, `/investor/solarcoin-comparison`, `/investor/deck` at 390×844 and desktop.
- Confirm no text overflow, no broken layouts, consistent card styling.

## Non-goals
- No messaging edits.
- No number changes.
- No new sections or removed sections.
- No deck slide redesign.
- No new dependencies.
