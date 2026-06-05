Two surgical changes to the /investor experience.

## 1. Increase the live verified-kWh number

In `src/components/investor/LiveVerifiedCounter.tsx` the deterministic daily baseline currently sits at ~380–520 kWh. To make the metric feel substantial on the investor page, bump the scale:

- Multiply `dayBase()` output by a factor (e.g., `* 100`) so the daily baseline reads in the ~38,000–52,000 kWh range.
- Keep the time-of-day growth and the periodic tick increments so the number still "feels alive."
- Preserve the exact same UI, label, and positioning.

## 2. Remove the Token Appreciation Calculator

In `src/pages/Investor.tsx`:
- Remove the `AppreciationCalculator` import.
- Delete the `<AppreciationCalculator />` mount on line 294.

Leave the component file itself in place (no need to delete source).

## Verification
- Load `/investor` at 390×844 and confirm the kWh counter is significantly larger.
- Confirm the Appreciation Calculator section no longer renders between the PDF download button and the "Why now" section.
- No console errors.

## Out of scope
- No copy changes, layout reflows, or tokenomics edits.
- The component file `AppreciationCalculator.tsx` is not deleted.