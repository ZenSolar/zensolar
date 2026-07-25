
## Problem

`beta.zen.solar` currently renders the full marketing `Home.tsx` (`src/pages/Home.tsx`), which pulls in `HomeHero`, `PricingSection`, `NFTMilestoneSection`, `StoreRedemptionSection`, `HomeCTA`, etc. Those CTAs point at legacy `/auth` email/password signup and the `/demo` mint simulator — the wrong entry for trusted beta testers.

`zensolar.com` already redirects to `/demo` via a `GATED_HOSTS` check inside `Home.tsx`. `beta.zen.solar` is not in that set, so it falls through to the marketing page.

Goal: give `beta.zen.solar` its own minimal Quiet-Current front door whose only primary action is “Join the beta” → `/onboarding`.

## Approach

1. Add a new page `src/pages/BetaLanding.tsx` built with the existing Quiet Current primitives (`QCScreen`, `QCHeader`, `QCMain`, `QCButton`) so it inherits the exact dark premium look used by `/onboarding`.
2. Register it at `/beta-welcome` in `src/App.tsx` (public, no auth guard).
3. In `src/pages/Home.tsx`, add `beta.zen.solar` and `www.beta.zen.solar` to a beta-host set that redirects to `/beta-welcome` (same pattern already used for `zensolar.com` → `/demo`). Marketing hosts keep their current behavior.

No other routes or components change. No copy on `/onboarding` changes.

## New page contents (`/beta-welcome`)

Single mobile-first column, Quiet Current styling:

- **Header** — ZenSolar horizontal logo (already imported by `QuietCurrent.tsx`). Right side: subtle `Log in` link → `/onboarding/signin` for returning testers.
- **Hero**
  - H1: “Your solar and your Tesla, finally working for you.”
  - Subhead: “ZenSolar connects to your Tesla, solar, and battery to track the clean energy you’re already producing — and rewards you for it. Takes about 3 minutes, read-only, disconnect anytime.”
  - Partner row (plain text, no logos required): `Tesla · Enphase · SolarEdge · Wallbox`
  - Primary CTA (`QCButton`): **Join the beta** → navigates to `/onboarding`
  - Trust line under CTA: “We only read your data — never control your devices. You can disconnect anytime.”
- **3-step strip** (three short lines, no icons/emoji):
  1. Connect your devices
  2. See live energy data
  3. Start the beta
- **Footer** — two quiet links only: `Support` (`mailto:support@zen.solar`) and `Privacy` (`/privacy`). No nav, no socials, no store.

Removed vs. current beta host: pricing tiers, mint caps, staking multipliers, earnings projections, “7 waves to 1M users”, NFT trophy case, $ZSOLAR store, tokenomics sections, Bitcoin closing pitch, demo-mint CTA.

## Technical detail

- `src/pages/Home.tsx`
  - Add `BETA_HOSTS = new Set(['beta.zen.solar', 'www.beta.zen.solar'])`.
  - Before the existing `GATED_HOSTS` check, if the current hostname is in `BETA_HOSTS`, `return <Navigate to="/beta-welcome" replace />`.
- `src/App.tsx`
  - Lazy import `BetaLanding` and add `<Route path="/beta-welcome" element={<Suspense fallback={<PageLoader />}><BetaLanding /></Suspense>} />` alongside other public routes.
- `src/pages/BetaLanding.tsx`
  - Uses `QCScreen`, `QCHeader`, `QCMain`, `QCButton` from `@/components/onboarding/quiet/QuietCurrent`.
  - `SEO` component: title “ZenSolar Beta — Join the Beta”, description matches subhead, `url` `https://beta.zen.solar`.
  - Primary CTA uses `useNavigate()` → `navigate('/onboarding')`.
  - Log in link → `/onboarding/signin`.
- No changes to `previewHost.ts`, `/onboarding/*`, or auth flows.

## Verification

1. Load `beta.zen.solar` → redirects to `/beta-welcome`, renders the minimal Quiet Current page.
2. Click **Join the beta** → lands on `/onboarding` (passwordless flow, no legacy `/auth` modal).
3. `Log in` link → `/onboarding/signin`.
4. No pricing, tokenomics, NFT, store, or demo-mint sections visible on `beta.zen.solar`.
5. `zensolar.com` still redirects to `/demo` (unchanged); localhost/preview hosts still render marketing `Home.tsx` (unchanged).
6. Mobile 390 px: single column, hero readable without scroll to find the CTA.

After shipping, reply exactly:

“beta.zen.solar rewired as a minimal beta front door — primary CTA routes into passwordless /onboarding.”
