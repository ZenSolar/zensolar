## Goal
Fix the unhyphenated "Proof of Genesis™" wordmark in `public/investor/one-pager/tap-to-mint.png` and align the underlying demo components so a future re-screenshot will match.

## Approach

Re-taking a fresh browser screenshot of `/demo?demo=investor` risks visual drift (different layout, different fixtures, different scroll position) vs. the carefully composed shot in the One-Pager. Safer to do a targeted text edit on the existing PNG and patch the underlying app strings in parallel.

### Step 1 — Edit the PNG in place
- Use `imagegen--edit_image` on `public/investor/one-pager/tap-to-mint.png` with a tight prompt: *"Replace the text 'Proof of Genesis™' with 'Proof-of-Genesis™' (hyphenated). Keep every other element — layout, colors, dark theme, badge styling, mint rows, navigation — pixel-identical."*
- Output to a temp path first (`/tmp/tap-to-mint-v2.png`) for QA.
- Inspect with `image_tools--zoom_image` on the badge region to confirm the hyphenated text rendered cleanly with no other regressions.
- If clean, overwrite `public/investor/one-pager/tap-to-mint.png` via `code--copy`.
- If the edit introduces artifacts, fall back to plan B (below).

### Step 2 — Patch underlying demo strings (site-wide consistency)
Fix the same unhyphenated form in the live components so the next refresh of this asset is correct at the source:
- `src/components/demo/TapToMintCard.tsx` (lines 33, 106, 191)
- `src/components/demo/DemoSidebar.tsx` (line 84)
- `src/components/demo/DemoOnboardingHints.tsx` (line 346)
- `src/components/demo/DemoAccessGate.tsx` (line 1544)
- `src/components/demo/DemoRewardActions.tsx` (line 747)

Leave `NdaSignatureStep.tsx` and `VipWelcomeScreen.tsx` alone unless requested — those are legal copy / personal letters where exact wording matters.

### Step 3 — Verify
- `InvestorOnePager.tsx` references `/investor/one-pager/tap-to-mint.png` (line 171) — same path, so no code edit needed.
- Use `browser--view_preview` to load `/investor/one-pager` and confirm the new asset renders with the hyphenated wordmark (cache-bust by reloading; filename unchanged so deployed previews update on next build).
- No other pages reference this PNG (confirmed via `rg`).

### Plan B (fallback if image edit produces artifacts)
Take a fresh screenshot of `/demo?demo=investor` at 375×812, crop to match the original framing, and replace. This requires the in-app strings from Step 2 to already be fixed, so do Step 2 first either way.

## Out of scope
- No layout/aesthetic changes to the screenshot.
- No edits to NDA legal copy or VIP letters.
- No new components or routes.
