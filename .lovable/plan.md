## Two changes for the investor flow

### 1. Standardize beta cohort to "23"

Update every investor-facing surface that mentions the beta-user count to **23**.

- `src/components/investor/pitch/slides/Slide11Traction.tsx` — hero stat `Beta users` value `'11'` → `'23'`.
- `src/pages/A16ZSpeedrunApplication.tsx` — two strings, `19 beta users` → `23 beta users` (lines 40 + 97).
- `src/pages/InvestorOnePager.tsx` — add a `23 / Beta users` tile to the Traction strip (grid changes from 3 to 4 columns).

Skipped (not investor-facing): admin pages (`AdminFundraising`, `AdminLiveBetaEconomics`, `AdminTokenomics*`, `HeroTest`), internal docs, and the homepage `LiveStatsBar` (it shows kWh/CO₂, not a beta count).

The investor demo (`/demo?demo=investor`) does not currently render a hardcoded beta count — `LiveEarningsCounter` reads `unique_minters` live from the database. No change needed there unless you want to override it with a static "23" badge in investor demo mode.

---

### 2. Skip the demo gate for visitors arriving from the investor page

**Today's behavior**: `DemoAccessGate` (which wraps `/demo/*`) checks `zen_demo_access` localStorage. The `Investor.tsx` page already writes that key with `ndaSigned: true` after a visitor completes the PIN + NDA, *so the gate should already auto-grant*. In practice users still hit a gate interaction because:

1. The gate's tap/hold reveal screen still renders on first paint while `isAccessGranted()` resolves, and
2. If localStorage doesn't carry across (different origin / private mode / cleared), `DemoAccessGate` falls back to its full NDA-signature flow.

**Fix**: introduce an explicit "investor pass" so visitors arriving with `?demo=investor` who already cleared the investor PIN + NDA bypass the demo gate entirely.

Implementation:

- **`src/pages/Investor.tsx` → `persistSigned()`**: in addition to the current writes, set a new long-lived key `zs_investor_pass = { email, fullName, ndaVersion: '1.0', signedAt }`. This becomes the single source of truth for "this person is an investor who already signed."
- **`src/components/demo/DemoAccessGate.tsx`**:
  - Add a helper `hasInvestorPass()` that reads `zs_investor_pass` and returns `true` when both `email` and `fullName` are present.
  - In the `granted` initializer and in the auth-check effect, treat `hasInvestorPass()` as equivalent to `isAccessGranted()` AND also short-circuit the NDA-signature step (`NdaSignatureStep`) when the pass is present — go straight to the reveal/burst → dashboard.
  - Backfill `zen_demo_access` from the pass on mount so the existing TTL logic keeps working.
- **`?demo=investor` URL marker**: when the gate sees `?demo=investor` AND `hasInvestorPass()`, render the tap-to-reveal interaction (so the visitor still gets the visceral entry moment) but with the NDA step skipped on completion — directly to the demo dashboard.
- Same logic applies to `/demo-leonardo?demo=investor` (the preview-host destination) — both routes go through the same gate, so one fix covers both.

No change is needed on `/investor` itself for the "Enter live demo" button — once the gate is fixed, the existing CTAs flow straight through.

---

### One clarifying question (will not block this plan unless you answer differently)

You mentioned **"tap to meet Paige"**. There is no "Paige" surface or persona in the codebase today. I'm assuming you mean the existing **tap-to-reveal entry interaction** (the hex/burst gate that currently sits in front of the demo). Confirm one of:

- **a)** Yes, "tap to meet Paige" = the existing tap-to-reveal entry — keep it, just skip the NDA after.
- **b)** "Paige" is a new concierge persona you want introduced on that screen (rename CTA to "Tap to meet Paige", add a one-line intro). If so, who is Paige and what should the screen say?
- **c)** Different screen entirely — describe it.

If you don't answer, I'll proceed with **(a)**.
