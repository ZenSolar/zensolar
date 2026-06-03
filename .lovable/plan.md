## Scope

Two small frontend-only changes on `/home`:

### 1. Remove "Export PDF for Cheetah" button

The `SubscriptionTransparencyPanel` on `/home` renders `<CheetahExportButton />` at the bottom. That's the "Export PDF for Cheetah" CTA the user wants gone from the consumer marketing page.

**Edit:** `src/components/home/SubscriptionTransparencyPanel.tsx`
- Remove the `<CheetahExportButton />` render (line 231).
- Remove the now-unused import `import { CheetahExportButton } from './CheetahExportButton';` (line 8).
- Leave the underlying `src/components/home/CheetahExportButton.tsx` file in place (still used elsewhere? — confirmed it's only used here, but keep the file so admin/founder flows are unaffected if they import it later).

### 2. Activate Tap-to-Mint on the Clean Energy Center showcase

Currently `CleanEnergyCenterShowcase` is a purely static mock — no CTA, no pulse-glow, no "Tap to Mint". Add the same lively Tap-to-Mint affordance the demo uses, but in marketing-mock form (no wallet wiring needed).

**Edit:** `src/components/home/CleanEnergyCenterShowcase.tsx`

Append a "Tap to Mint" CTA section inside the existing `<CardContent>`, below the KPI list:

- Small live preview row: "Pending: 1,284 kWh · Expected: 1,284 $ZSOLAR · ~$128" (hardcoded mock numbers consistent with the KPI mock above).
- Primary CTA button styled like the real `TapToMintCard`:
  - `min-h-[52px] bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold animate-pulse-glow shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform`
  - Icon: `<Sparkles />` left, `<ArrowRight />` right.
  - Label: `Tap to Mint`.
- On click: trigger a `sonner` success toast (`Proof of Genesis™ engaged · 1,284 $ZSOLAR queued`) AND navigate (`<Link to="/demo">`) so the consumer reaches the live demo where the real mint happens. Use `useNavigate` + `mediumTap` haptic for the press feel that matches `HomeHero`.
- Wrap the whole card in a subtle `Proof of Genesis™` glow: add a `radial-gradient(...)` overlay matching the `TapToMintCard` (`hsl(var(--primary) / 0.18)` at top center) so the section visually pulses in line with the CTA.

This keeps the showcase consumer-facing (no wallet logic, no real mint) while making the section feel "alive" with the same Tap-to-Mint vocabulary used in `/demo`.

## Verification

- `/home` scrolls to the Clean Energy Center section: pulse-glow CTA visible, hardcoded preview reads correctly, click navigates to `/demo` and fires the toast.
- `/home` Subscription Transparency section no longer shows the "Export PDF for Cheetah" button.
- No tests changed; `CheetahExportButton.tsx` file kept intact.

## Out of scope

- No changes to the real `TapToMintCard` in `/demo`.
- No changes to mint logic, tokenomics, or wallet flows.
- No removal of the `CheetahExportButton` file itself.
