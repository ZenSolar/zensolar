# Investor Demo Face Lift — Plan

Scope: the `/demo` page (rendered by `ZenSolarDashboard` → `DemoDashboard` → `ActivityMetrics`) and its mint pills / Clean Energy Center cards. Surgical edits only. No tokenomics, routes, NDA, or section changes.

## 1. Mint button label standardization

In `src/components/dashboard/ActivityMetrics.tsx`:
- Per-source pill (line ~1724): `'Mint this'` → `'MINT'`. Keep "Tap again" state unchanged.
- "Mint All" footer pill (line ~2246): `'Mint All'` → `'MINT ALL'` (uppercase to match) — keep wording "MINT ALL" since the task says to standardize, not remove. Keep "Tap again".
- Tighten both pills to identical sizing tokens (same `h-`, `px-`, `text-[11px] uppercase tracking-[0.18em] font-semibold`) so per-source and footer pills look like one button family.
- Update related `aria-label`s to match new copy.

## 2. Header stability

`src/components/dashboard/DashboardHeader.tsx` is already `sticky top-0 z-50`. Audit for the perceived "shift":
- Ensure parent container in `ZenSolarDashboard.tsx` does not wrap the header in a `transform`/`overflow-hidden` ancestor that breaks `position: sticky`. If it does, lift the header out or remove the offending utility.
- Add `will-change: transform` and `contain: layout paint` on the header to stabilize compositing during scroll.
- Add `overscroll-behavior-y: contain` on the main scroll container to kill bounce-induced header jitter on iOS.

## 3. Pill & badge consistency

Across `ActivityMetrics.tsx` Clean Energy Center KPI rows:
- Normalize all stat badges (kWh / mi chips, "Ready" / "Live" pills) to one size scale: `text-[10px] tracking-[0.16em] uppercase px-2 py-0.5 rounded-full`.
- Use `whitespace-nowrap` + `truncate` guards so values like "28,742 kWh" never wrap at 320–375px widths.
- Ensure every interactive pill meets a 44px tap target (wrap with `min-h-[44px]` flex container if visual chip stays small).

## 4. Visual polish (Clean Energy Center + Live Energy Monitoring)

- Increase row vertical rhythm: bump KPI row gap from current value to `gap-3 sm:gap-4`; section padding to `p-5 md:p-7`.
- Reduce border weight to `border-border/40`, soften backgrounds to `bg-card/40` — matches the tightened `/investor` aesthetic.
- Strengthen section headers with consistent eyebrow style (`text-[11px] uppercase tracking-[0.24em] text-secondary/80`) used on `/investor`.
- Live Energy Monitoring section: add breathing room (`mt-6`, internal `space-y-4`) without restructuring the diagram.

## 5. Mobile-first verification (390×844)

After edits, view `/demo` at 390×844 and 1280×800 in the preview to confirm:
- All mint pills read "MINT" / "MINT ALL" with no clipping
- Header stays pinned during scroll, no jitter
- No text overflow on KPI values or badges
- Tap targets feel comfortable

## Files touched

- `src/components/dashboard/ActivityMetrics.tsx` (labels, pill sizing, KPI spacing)
- `src/components/dashboard/DashboardHeader.tsx` (sticky hardening)
- `src/components/ZenSolarDashboard.tsx` (only if a transform ancestor is breaking sticky; otherwise untouched)

## Out of scope (per task)

- Removing any MINT / MINT ALL buttons or KPI cards
- Tokenomics, mint mechanics, data values
- Routes, auth, NDA flows
- Live Energy house diagram rewrite
- Adding/removing sections

Final reply on completion will be exactly:

> "Investor Demo page face lift complete — scrolling fixed, header stable, all buttons standardized to 'MINT', and visual polish improved."
