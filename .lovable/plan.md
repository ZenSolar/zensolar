## Plan: Mobile Spacing & Typography Fixes (390×844)

### Goal
Fix cramped stacking and inconsistent alignment in the Flywheel section (07) and Proof-of-Genesis flow (03) at mobile viewport 390×844.

### Changes

#### 1. Flywheel Section (07 · The Flywheel)
**Current issue:** The 4-point grid stacks vertically with `gap-3` and `px-5 py-4` cards. Text feels dense and number alignment is inconsistent with other sections.

**Fixes:**
- Increase mobile grid gap from `gap-3` to `gap-4` (`16px`).
- Increase card vertical padding from `py-4` to `py-5` on mobile (`md:py-4`).
- Reduce card horizontal padding from `px-5` to `px-4` on mobile to give text more room relative to the narrow viewport.
- Change the `font-mono` step number from `text-sm` to `text-[13px]` so it no longer looks oversized next to `text-[13px]` body copy.
- Add `items-center` to the card flex container so the number badge sits cleanly aligned with the first line of text instead of top-aligned with `mt-0.5`.

#### 2. Proof-of-Genesis Flow (03 · Technical Foundation)
**Current issue:** Vertical stack uses `space-y-4` which feels cramped for 4 steps. Titles are `text-[14px]` while body is `text-[12.5px]`, creating an inconsistent hierarchy compared to the rest of the page where titles are typically `text-[13px]` on mobile.

**Fixes:**
- Increase mobile step spacing from `space-y-4` to `space-y-5` (`20px`).
- Reduce step title on mobile from `text-[14px]` to `text-[13px]` (`md:text-[13px]` is fine), matching other card titles on the page.
- Reduce step body on mobile from `text-[12.5px]` to `text-[12px]` for cleaner hierarchy.
- Increase the top/bottom fade on the vertical connecting gradient line from `top-2 bottom-2` to `top-3 bottom-3` so the line feels less cramped against the first/last circles.
- Ensure the `rounded-3xl` container has `p-5` on mobile but consider `md:p-7` as already present.

### Scope
Only `src/pages/InvestorWhyThisRound.tsx`. No new dependencies. No desktop changes other than responsive prefixes.

### Validation
Preview on 390×844. Verify no overflow, text truncation, or visual misalignment in either section. Confirm the rest of the page is untouched.