## Plan: Add "Why This Round" Card to /investor

### 1. Investor.tsx — Insert card & adjust grid

- Add a new `<UnlockedCard>` entry **before** the existing four cards in the "Investor Materials" section.
- Title: **"Why This Round"**
- Body: **"Transparent breakdown of the $2.5M–$3.5M raise, use of funds, GTM approach, and our two-round path to self-sustainability."**
- Destination: `/investor/why-this-round`
- Icon: `FileText` (same as other document cards)
- Adjust the grid class from `lg:grid-cols-4` → `lg:grid-cols-3` so the 5-card layout renders as a clean 3-over-2 on desktop (2×3 feel without crowding). Keep `sm:grid-cols-2` for tablet.

### 2. Create placeholder page `/investor/why-this-round`

- New file: `src/pages/InvestorWhyThisRound.tsx`
- Dark theme, investor-grade styling (rounded cards, `border-border/60`, `bg-card/40`, generous padding)
- Content:
  - Page title: "Why This Round"
  - Subhead: placeholder copy about the raise breakdown
  - A back link returning to `/investor`
- Wrap with `<Helmet>` for title/meta.

### 3. Register route in App.tsx

- Add lazy import: `const InvestorWhyThisRound = lazy(() => import("./pages/InvestorWhyThisRound"));`
- Add route: `<Route path="/investor/why-this-round" element={<Suspense fallback={<PageLoader />}><InvestorWhyThisRound /></Suspense>} />`

### Verification
- Load `/investor` at desktop and mobile (390×844).
- Confirm "Why This Round" is the first card, visually consistent, and links correctly.
- Click through to `/investor/why-this-round` and confirm the placeholder page loads.
- No layout breakage on the investor hub.