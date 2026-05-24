---
name: AI Setup Concierge (onboarding) — Deason
description: Named AI assistant "Deason" uses Lovable AI tool-call to extract SetupProfile from plain-English description, then routes user to energy-connect with planned providers
type: feature
---
After `wallet-success` (or wallet skip), users land on `AIConciergeScreen` before `energy-connect`.

Flow:
1. User describes setup in natural language ("I have Enphase solar + IQ Battery + Tesla Model Y, garage outlet")
2. `supabase/functions/onboarding-concierge` calls Lovable AI (`google/gemini-3-flash-preview`) with `tool_choice` forcing the `extract_setup_profile` tool — returns structured `SetupProfile`
3. PlanReview screen confirms detected solar/battery/vehicle/charger + ordered provider list
4. On confirm: profile saved to `localStorage.onboarding_setup_profile`, planned providers to `localStorage.onboarding_planned_providers`, then routes to `energy-connect` (user still taps each provider — no auto-orchestration yet)

SetupProfile schema covers Enphase + SolarEdge offering batteries AND L2 chargers (brand enums include both for `battery.brand` and `home_charger.brand`).

Files:
- `supabase/functions/onboarding-concierge/index.ts`
- `src/components/onboarding/AIConciergeScreen.tsx`
- Step added to `src/pages/Onboarding.tsx` as `'ai-concierge'` (step 3 in progress indicator)

Skip path: "Pick providers manually" → straight to `energy-connect`. No AI lock-in.

Future enhancements (NOT built):
- Auto-launch first OAuth from the planned queue (needs localStorage queue surviving Tesla redirect)
- Photo-based home-charger identification via `google/gemini-2.5-flash` vision
- AI auto-labeling of devices returned from OAuth (e.g. "IQ Battery 10T - Basement")
