## Goal

Ship the 3 new hero variants, asset-aware swap, KPI overlap fix, and multi-Powerwall stacking on `/prototype/energy-flow`. Then deliver a full ruleset outline for Grok review.

## Build steps

1. **Generate 4 new image assets** (premium quality, 16:9, matched camera/lens/house geometry to existing hero):
   - `src/assets/energy-flow-house-hero-no-ev.jpg` — empty driveway
   - `src/assets/energy-flow-house-hero-no-battery.jpg` — clean garage wall, no Powerwall
   - `src/assets/energy-flow-house-hero-outage.jpg` — night, neighborhood dark, only this house lit, Powerwall LEDs glowing
   - `src/assets/powerwall-sprite.png` — transparent, perspective-matched single Powerwall for stacking overlays

2. **Refactor `src/pages/PrototypeEnergyFlow.tsx`:**
   - Add `variant` state: `'default' | 'no-ev' | 'no-battery' | 'outage'`
   - Add `powerwallCount` state (1–4) with `+N` badge for 5+
   - Top-right segmented control to flip variants and Powerwall count live
   - Conditional rendering of Model Y row, Powerwall KPI, flow paths, grid status per variant
   - Reposition Powerwall KPI from bottom-left → mid-left; add 12px safe-area gutters
   - Powerwall sprite stack with positions: 1=center, 2=side-by-side, 3=row of 3, 4=2×2 grid
   - Aggregate kWh display: `units × 13.5 kWh`

3. **Update spec memory** `.lovable/memory/features/live-energy-flow-card-spec.md` with variant rules + multi-Powerwall stacking.

4. **Verify** with browser--view_preview at 393×844 across all 4 variants × counts 1/2/3/4.

5. **Deliver ruleset outline** in the final chat reply — full markdown, ready to paste into Grok. Covers: variants, swap logic, KPI positions, multi-Powerwall stacking, flow path colors, animation rules, asset-aware visibility, and out-of-scope items.

## Out of scope

- Wiring to live `connected_devices`
- Non-Tesla battery brands
- Per-count dedicated hero renders
