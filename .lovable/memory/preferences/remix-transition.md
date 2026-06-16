---
name: Remix Transition (in progress)
description: Status of the planned clean remix build for production launch — manifest + routes ready, waiting on support to unblock remix
type: preference
---
# Remix Transition

User attempted to remix this lab project 3x — all failed. Support email sent, waiting on reply.

## Prep already done (in THIS project, won't paste until remix exists)
- `.lovable/REMIX_MANIFEST.md` — 16 customer routes, ~25 edge functions (down from 80), DB tables to keep/drop, secrets list, 5-min smoke test
- `.lovable/routes.config.ts` — typed `AppRoute[]` with lazy() imports, bottom nav (5) + more menu (5), `PRODUCTION_PATHS` Set for 404 guard

## Decisions locked
- Strategy = Option 2: clean remix with ONLY production routes; original lab project preserved as-is for ongoing R&D
- Remix ships on **Base Sepolia** (chain 84532) just like today; flip to mainnet (8453) via single `VITE_CHAIN_ENV` flag at launch
- Do NOT include full project history in remix (clean slate)
- User does NOT want more prep files generated until remix project is actually created — pause and stay on standby for lab maintenance / bug fixes

## How to apply
- When user says "the remix is ready" → walk them through pasting `routes.config.ts` + wiring `App.tsx` per the one-liner pattern in the manifest
- Until then: do not generate more remix-prep artifacts unless explicitly asked
