### Plan — Light Second-Round Polish on Investor Main Page

**Files:** `src/pages/Investor.tsx`, `src/components/investor/ThreeRevenueEngines.tsx`

**1. Engine 01 description (ThreeRevenueEngines.tsx)**
- Shorten the `body` prop by ~1 line so it reads tighter on mobile. Keep all numbers, tiers, and the metric footer exactly as-is.

**2. Engine 02 & 03 descriptions (ThreeRevenueEngines.tsx)**
- Trim each `body` prop by 5–8 words max while keeping core meaning and all locked numbers. Tone stays confident and clear.

**3. "Full details in the Seed Round Deck →" links (ThreeRevenueEngines.tsx)**
- Reduce visual repetition across the three engine cards.
- Make the link smaller and lower-opacity (`text-[10px]`, `opacity-60` or similar) so it doesn’t feel like three stacked CTAs.
- Keep behavior and destination unchanged.

**4. "Thank you, Preview." NDA confirmation card (Investor.tsx)**
- Slightly de-emphasize the confirmation card inside `UnlockedPanel`.
- Reduce padding (`p-5` instead of `p-6 md:p-8`) and/or border opacity so it doesn’t dominate before The Pitch section.
- Keep clearly visible and fully functional.

**Out of scope:**
- No changes to locked numbers, mint splits, tiers, or tokenomics.
- No layout structure, colors, or spacing between major sections.
- No changes to hero, Why Now cards, flywheel visual, or Investor Materials section.