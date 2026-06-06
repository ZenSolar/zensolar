## Refresh Bottom Stats on Initial Demo Screen

Update the two bottom stats rendered by `LiveEarningsCounter` on the demo access gate so investors see stronger numbers — only on the investor-demo entry path. All styling, color, spacing, and the pulse dot stay identical.

### Files
- `src/components/marketing/LiveEarningsCounter.tsx`
- `src/components/demo/DemoAccessGate.tsx`

### Changes

**1. `LiveEarningsCounter.tsx`** — add optional `seedStats?: { lifetimeTokens: number; uniqueMinters: number }` prop. When provided, skip the Supabase RPC poll and count-up animation and render the seeded values directly through the existing `formatNumber` logic. When omitted, behavior is unchanged.

**2. `DemoAccessGate.tsx`** — detect investor-demo entry (`?demo=investor` or `?demo=outage`) using the same URL-param read already in the file. Pass seeded values to `<LiveEarningsCounter />` only on that path:
- `lifetimeTokens: 1_230_000` → renders **1.23M $ZSOLAR minted**
- `uniqueMinters: 23` → renders **23 founding members**

All other gate entries (regular access code, VIP link, reviewer invite, etc.) continue to show the live backend stats.

### Verification
1. Load `/demo?demo=investor` at 390×844 → bottom reads **1.23M $ZSOLAR minted · 23 founding members**.
2. Styling, color, spacing, pulse dot unchanged.
3. Load `/demo` (non-investor) → live backend stats still appear.