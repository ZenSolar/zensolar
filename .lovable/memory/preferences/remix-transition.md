---
name: Remix Transition (in progress)
description: Status of the planned clean remix build for production launch — remix project now created, ready to paste production routes + wiring
type: preference
---
# Remix Transition

Remix project created successfully: **The Remix of $ZSOLAR rewards**. Cross-project access may take a moment to propagate.

## Prep already done (in THIS project)
- `.lovable/REMIX_MANIFEST.md` (v1) — 16 customer routes, ~25 edge functions, DB tables to keep/drop, secrets, 5-min smoke test
- `.lovable/REMIX_MANIFEST_V2.md` — **STRUCTURAL SSOT**. Refined around 3 pillars (Clean Energy Center, Deason AI optimizer+chat, Multi-OEM Cockpit). Promotes Deason + Cockpit functions back into remix scope, updates bottom nav, lists open decisions (Deason chat shape, trial length, nav order, onboarding flow).
- `.lovable/routes.config.ts` — typed `AppRoute[]` with lazy() imports + `PRODUCTION_PATHS` Set. Currently v1 order (Home/Mint/Wallet/Devices/More); needs v2 bottom-nav reorder if building Deason + Cockpit pillars.

## Decisions locked
- Strategy = Option 2: clean remix with ONLY production routes; original lab project preserved as-is for ongoing R&D
- Remix ships on **Base Sepolia** (chain 84532) just like today; flip to mainnet (8453) via single `VITE_CHAIN_ENV` flag at launch
- Do NOT include full project history in remix (clean slate)

## Next step
When ready to wire the remix, paste `.lovable/routes.config.ts` and update `App.tsx` per the manifest. If building v2 pillars first, resolve the 4 open decisions in REMIX_MANIFEST_V2.md before wiring.
