# Final Polish & QA Sweep — Investor + Demo

A surgical polish pass. No new features, no logic changes, no redesigns.

## Approach

1. **Live audit at 390×844** using the browser tool on `/investor`, `/investor/pitch`, `/demo?demo=investor`, plus desktop 1280×800 spot checks. Capture screenshots, scan console, identify concrete defects.
2. **Read** the touched surfaces to confirm root causes before editing:
   - `src/components/demo/InvestorDemoChip.tsx`, `BackToInvestorHubPill.tsx`, `GuidedTourLauncher.tsx`, `GuidedTourOverlay.tsx`, `DemoCallouts.tsx`, `DemoLayout.tsx`
   - `src/pages/Investor.tsx`, `src/pages/InvestorPitch.tsx`
   - `src/components/investor/LiveVerifiedCounter.tsx`, `AppreciationCalculator.tsx`, `InvestorFAQ.tsx`
3. **Fix only what the audit flags**, scoped to these defect classes:
   - Overlap / z-index collisions between top-center Investor Demo chip, Back-to-Hub pill, Deason FAB, Tour launcher, and TopNav at 390 px.
   - Text overflow, awkward wrapping, clipped pills/badges; tap targets <40 px.
   - Spacing/padding inconsistencies between investor cards (catalyst cards, Ask card, FAQ, calculator, counter) — normalize to existing tokens (`rounded-2xl`, `border-border/60`, `bg-card/40`, `p-4`/`p-5`).
   - Pill/button size drift — align with the existing `text-[11px]` / `h-11` button conventions already used in `InvestorPitch.tsx`.
   - Typography hierarchy: confirm a single H1 per page, consistent uppercase-tracking labels.
   - Layout shift from the persistent pill (reserve space or use `fixed` cleanly — it already is `fixed`, verify no parent margin issues).
   - Callout fade timing / position — only adjust if visibly off.
   - FAQ readability — trim any answer that wraps past ~4 lines on mobile.
   - Console errors traced to the new components.

## Out of scope

Tokenomics, copy beyond trimming, Live Energy house diagram, new routes, schema, business logic.

## Deliverable

A short defect list (what was found) and the matching surgical edits, then a verification screenshot pass at 390×844 + desktop. Final reply will be the exact required string.
