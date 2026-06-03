## Problem

On `/home` (mobile viewport), scrolling down briefly works then snaps back to the top. The restyle did not touch scroll logic, so the most likely cause is a layout-shift / scroll-anchoring interaction introduced by the long stack of `LazySection` placeholders + framer-motion `whileInView` animations on the new editorial sections.

## Diagnosis (in build mode I'll confirm in the browser first)

1. Open `/home` at 390×844 and reproduce the snap-back. Watch `window.scrollY` and DOM mutations in the console to identify which event resets scroll.
2. Check the three most likely culprits:
   - `LazySection` (`src/components/home/LazySection.tsx`): 12 stacked placeholders at `minHeight: 200px`; when each section mounts, height jumps from 200px → real (often 800–1500px), and Safari can lose its scroll anchor.
   - `FloatingSectionNav` sentinel `<div className="absolute top-[500px]">` and its observers — verify it isn't calling `scrollIntoView` unintentionally.
   - `HomeHero` `motion.*` mount animations + `LiveStatsBar` `whileInView` — verify they don't re-fire and trigger Safari rubber-band reset.

## Fix

Apply the smallest change that resolves it, in this order:

1. **`src/components/home/LazySection.tsx`** — stabilize lazy mounting so layout doesn't shift the document above the viewport:
   - Add `style={{ overflowAnchor: 'none', contain: 'layout' }}` to the wrapper div.
   - Drop `minHeight` once visible (already done) but also reduce default `minHeight` to `1px` so collapse/expand happens *below* the user's current scroll, not above.
   - Use `IntersectionObserver` with `rootMargin: '600px 0px'` so sections mount *before* they enter the viewport (no in-view height jump).

2. **`src/pages/Home.tsx`** — if step 1 is not enough, render the first 2–3 below-the-fold sections eagerly (HowItWorks, DashboardShowcase) so the initial scroll has stable height.

3. **`src/components/home/FloatingSectionNav.tsx`** — move the sentinel from `absolute top-[500px]` (positioned against the page wrapper, which can drift as lazy sections mount) to a plain inline `<div>` placed right after the hero, so its position is anchored to real DOM flow.

4. Verify on mobile viewport: scroll smoothly from top to footer, then back up, with no snap-back. Confirm `FloatingSectionNav` still appears after the hero.

## Out of scope

- No visual changes to the restyled sections.
- No changes to `ScrollManager`, routing, or PWA shells.
- No new dependencies.

## Acceptance

- On `/home` at 390×844, the page scrolls smoothly end-to-end with no bounce-back.
- `FloatingSectionNav` chip still appears after the hero and the section observers still highlight the right section.
- All existing lazy sections still render with the same content.
