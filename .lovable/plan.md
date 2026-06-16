
## Goal

Ship `/ecosystem` as a fully polished, auth-gated, mobile-first "State of the ZenSolar Economy" dashboard on the first build. Visual target: Tesla Energy × Robinhood × Notion — dark glassmorphism, neon-green/violet accents, rich Framer Motion, real Supabase data only.

Sub-headline anchor: *"Your monthly subscription is 100% powering the liquidity pool and the flywheel. This is what you're investing in."*

## Page structure (top → bottom)

```text
1. HERO
   - LIVE pulse dot + "Live Network" badge
   - H1: "The ZenSolar Economy"
   - Sub-headline (subscription = investment thesis)
   - $ZSOLAR Launch Price + Lifetime kWh (animated counters)
   - Background: aurora gradient + subtle dot pattern

2. FLYWHEEL HEALTH GAUGE  (tappable, animated)
   - States: 💪 Strong / 🚀 Accelerating / ⚡ Supercharged
   - Big animated radial-style progress (framer-motion svg)
   - Tap → tooltip + neon-particle burst
   - Confetti burst on first reach of "Supercharged"
   - Tagline: "Every subscription + mint adds net buy pressure to the LP"

3. 4-UP KPI GRID  (glass cards, hover-lift, AnimatedCounter)
   Subscribers | Lifetime kWh | Tokens Minted | NFTs Minted

4. LIQUIDITY POOL CARD
   - USDC depth + $ZSOLAR depth (animated counters)
   - "This Month's LP Growth" sub-card:
     - "+$X added this month • 100% from subscriptions"
     - Gradient-filled Recharts AreaChart sparkline with interactive tooltip

5. SUPPLY BREAKDOWN
   - Stacked horizontal bar vs 1T cap with neon segment colors
   - Legend chips
   - Burn impact callout (rose glow):
     "X% of all tokens are still locked or burned • This month's burn permanently removed Y tokens"
   - Internal math grosses up user-share by 100/MINT_DISTRIBUTION.user; copy NEVER exposes the 50/25/20/5 split labels.

6. NETWORK GROWTH CHART
   - Recharts LineChart, gradient strokes, smooth motion
   - 30d / 90d / All toggle pill group

7. RECENT MINTS TICKER
   - Horizontal marquee (framer-motion auto-scroll loop, pauses on tap)
   - Edge fade masks, anonymized "Anon · X kWh · Ys ago"

8. YOUR STAKE SNAPSHOT  (premium hero card)
   - Tokens earned (locked) — animated counter
   - Your LP push this month +$X — emerald glow
   - Your share of circulating + animated progress bar
   - Projected 3-year upside band ($0.50–$2.00 illustrative)
   - CTAs with ripple: "Invite a friend → bonus tokens" / "See my referrals"

9. METHODOLOGY FOOTER + last-updated timestamp
```

## Files to create

- `src/hooks/useEcosystemStats.ts` — React Query (60s stale, 90s refetch). Parallel fetches:
  - `supabase.rpc('get_live_earnings_stats')`
  - `profiles` head count (subscribers)
  - `energy_subscriptions` where `active=true` head count
  - `lp_rounds` all rows → sum USDC, sum tokens, latest spot price
  - `mint_transactions` confirmed: latest 10 (ticker), all rows for growth + lifetime kWh, current-user slice (stake)
  - `profiles.created_at` ordered → subscriber growth series
  - Derives `tokensBurned`, `tokensToLp`, `tokensToTreasury`, `circulating`, `myShareOfCirculating`, `monthLpFromSubs` (subscribers × $19.99 × 50%), bucketed daily growth array.

- `src/components/ecosystem/`
  - `EcosystemHero.tsx` — aurora gradient + live pulse + animated counters
  - `FlywheelHealthGauge.tsx` — svg radial gauge, framer-motion, particle burst, confetti on "Supercharged"
  - `KpiGrid.tsx` — 4 glass tiles with AnimatedCounter, hover-lift
  - `LiquidityPoolCard.tsx` — depth + monthly-growth sparkline (Recharts AreaChart, gradient fill)
  - `SupplyBreakdown.tsx` — stacked bar + legend + rose burn callout
  - `GrowthChart.tsx` — LineChart with range toggle (30/90/All)
  - `RecentMintsTicker.tsx` — framer-motion marquee, fade masks
  - `YourStakeCard.tsx` — animated counters, progress bar, upside band, ripple CTAs
  - `glass.ts` — shared className helper for glass card surface

- `src/pages/Ecosystem.tsx` — composes the above with staggered `motion` container, Helmet SEO (`The ZenSolar Economy — Live Network Stats` + 1-line meta), skeleton loading.

## File to modify

- `src/App.tsx` — add lazy import and route above the catch-all:

  ```tsx
  const Ecosystem = lazy(() => import("./pages/Ecosystem"));
  ...
  <Route
    path="/ecosystem"
    element={
      <ProtectedRoute>
        <AppLayout>
          <Ecosystem />
        </AppLayout>
      </ProtectedRoute>
    }
  />
  ```

## Dependencies

- All required deps already in repo: `framer-motion`, `recharts`, `@tanstack/react-query`, `lucide-react`, `react-helmet-async`, existing `AnimatedCounter`, `Progress`, `Card`, `Button`, `Skeleton`, `Badge` shadcn primitives.
- Add one tiny dep: `canvas-confetti` (≈3 KB) for the Supercharged burst. Imported only inside `FlywheelHealthGauge` so it tree-shakes cleanly.

## Locked-memory compliance

- Dark-mode only, mobile-first (390×844)
- Auth-gated via `ProtectedRoute`
- 1 kWh = 1 $ZSOLAR framing; UI never shows the 50/25/20/5 split labels
- Launch price uses `PRICES.launchFloor` / `lp_rounds.spot_price_usd`
- All numbers are live from Supabase (no mock data)
- No DB migration required

## Out of scope (not in this build)

- Live DEX price feed (uses LP-round spot price)
- VPP / Optimus / Starlink panels
- Nav-bar / sidebar entry (can add after page is verified)
- Public unauthenticated version

## Closing message

After build, respond exactly:
"/ecosystem page complete — live ZenSolar Economy dashboard with stunning premium glassmorphism UI, rich Framer Motion animations, Flywheel Health Gauge, enhanced LP card, supply + burn impact, and fully upgraded Your Stake Snapshot is live and fully wired."
