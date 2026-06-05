# Investor Demo Full Polish — Plan

Three surgical edits across three files. No tokenomics, mint logic, routes, auth, or Live Energy diagram touched.

## 1. Remove debug banner in Investor Demo
**File:** `src/components/demo/DemoLayout.tsx`

Currently `showRouteBanner` is `true` whenever DEV / Lovable preview host / `?routeqa` — which is exactly when investors view the demo. Suppress it when investor demo mode is active.

- Import `isInvestorDemoModeSync` from `@/hooks/useInvestorDemoMode` (or use the hook).
- Change the gate so the `DEMO ROUTE QA` / `/demo-leonardo` banner only renders when `?routeqa` is explicitly present AND investor demo mode is OFF. (Net effect for shared investor links: never shows.)

## 2. Header pill fits cleanly on 390-wide
**File:** `src/components/demo/InvestorDemoChip.tsx`

The pill currently has `px-3 py-1.5 text-[11px]`, the Exit button `text-[10px]`, plus icon + dot + separator + label + Exit. On 390px it still fits but feels cramped. Tighten:

- Reduce horizontal padding (`px-2.5`) and inner gap (`gap-1.5`) on the pill.
- Drop the middle `·` separator (visual noise on small screens).
- Shrink Exit button padding to `px-1.5` and keep `text-[10px]`.
- Add `max-w-[calc(100vw-1.5rem)]` plus `truncate` safety on the label span.
- Keep `whitespace-nowrap` so nothing wraps; rely on the reduced widths instead.

## 3. Deason floating button visible in Investor Demo
**File:** `src/components/deason/DeasonFloatingBubble.tsx`

Audit shows the bubble already renders on `/demo` even unauthenticated (line 198). The likely reason it appears hidden in investor demo is the InvestorDemoChip and bottom nav crowding — the bubble itself is fine. Verify by:

- Confirm `z-50` bubble is not occluded by `MobileBottomNav` (also `z-50` typically). If overlap, bump bubble wrapper to `z-[60]` so it always sits above the bottom tab bar but below modal overlays (chip is `z-[130]`, unaffected).
- No logic change to the auth/route guard.

## 4. Seed wallet balance in Investor Demo
**File:** `src/components/demo/DemoWallet.tsx`

- Import `useInvestorDemoMode`.
- If `enabled` is true AND `activityData.lifetimeMinted` is below the seed floor, display a seeded balance of **13,750 $ZSOLAR ≈ $1,375 USD** (midpoint of the requested 12,500–15,000 range). Implement as `const displayedBalance = investorDemo.enabled ? Math.max(activityData.lifetimeMinted, 13_750) : activityData.lifetimeMinted;` so real mints during the session still increment beyond the seed.
- Use `displayedBalance` for both the token figure and the USD calc. NFT card untouched.
- Pure presentational override — no Supabase writes, no effect outside the wallet card.

## Verification (at 390×844)
1. `/demo` → no "DEMO ROUTE QA / /demo-leonardo" banner.
2. Investor Demo pill renders on one line with no clipping; Exit button still tappable.
3. Orange Deason bubble visible bottom-right above bottom nav; tappable.
4. `/demo/wallet` shows 13,750 $ZSOLAR and ≈ $1,375.00 USD.
5. No regression to MINT buttons, KPI cards, Live Energy diagram, or non-demo routes.
