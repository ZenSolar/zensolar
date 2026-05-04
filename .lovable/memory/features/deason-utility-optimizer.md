---
name: Deason AI Utility Optimizer Roadmap
description: Phase 1 weekly report, Phase 1.5 monthly deep insights + in-app /energy-insights page, Phase 2 Tesla FSD autonomous miles minting
type: feature
---

# Deason AI Utility Optimizer

Full planning page: `/founders/deason-utility-ai-revstream` (founder + VaultPin).

## Phase 1 (post-seed)
- Deason AI agent (orange chat button) — bill analysis, rate-plan optimization, device-aware advice.
- Saturday **Weekly Energy Report**, 8:00 AM user local timezone.
  - Basic (all subscribers, Gemini 2.5 Flash) — verified kWh, tokens, CO₂, lifetime impact.
  - Premium (Power tier OR +$4.99/mo add-on, Gemini 2.5 **Pro** required) — narrative, rate-plan deltas, device optimization.
- Single gating flag: `deason_enabled`.
- Independent `weekly_report_opt_out` (does not affect transactional emails).
- "Quiet week" fallback template for low-activity periods.

## Phase 1.5 (post-seed)
- **Monthly Deep Energy Insights email** — once per month after bill cycle. Unlocked by UtilityAPI connection OR bill upload. Tariff analysis, rate-plan optimization, peak/off-peak, battery/EV, savings forecasts, historical comparisons. Gemini 2.5 Pro.
- **In-App Personalized Energy Insights Page** — `/energy-insights` (or inside Clean Energy Center). Charts, savings forecasts, one-tap actions. Home base for the premium Deason experience.

## Phase 2 — Tesla FSD / Autonomous Miles
- Tokenize FSD / autonomous miles: **10 miles = 1 $ZSOLAR** (same 10:1 ratio).
- Included in the latest patent application.
- Planned as the visual "cherry on top" for the Lyndon Rive pitch.
- **Not yet in Clean Energy Center dashboard** — Phase 2 integration after core Deason launch.

## Pricing
- Deason add-on: +$4.99/mo on any tier.
- One-shot bill audit: $19.99.
- Power tier: $49.99/mo, Deason included free (primary upgrade incentive).
