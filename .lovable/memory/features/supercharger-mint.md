---
name: Supercharger Mint
description: Tesla Supercharger session classification, mint treatment (full 1:1 via REC claim), and data model used by Charging Experience v2
type: feature
---

## Trigger & detection
- Auto-detect via Tesla Fleet API: `fast_charger_present === true` + `fast_charger_brand === 'Tesla'` + `charging_state === 'Charging'`. Polled every 30s.
- One-tap user confirm banner only fires for the very first Supercharger session (L2 — see `minting-loudness-levels.md`).

## Classification (edge function `classify-charging-session`)
Reads a `charging_sessions` or `home_charging_sessions` row and writes back:
- `source`: `home | wallbox | supercharger | third_party_dc`
- `clean_claim`: `self_produced | tesla_rec | unknown`
- `site_id`: nearest `supercharger_sites` row within 250 m, else null

Brand gate: only `fast_charger_brand === 'Tesla'` becomes `source: supercharger` + `clean_claim: tesla_rec`. Anything else is `third_party_dc` + `unknown`.

## Mint treatment
- **Supercharger (tesla_rec)** → full 1:1 mint. Tesla retires RECs covering 100% of Supercharger electricity, so we count the kWh as clean.
- **Third-party DC fast** → 0.5× mint, no orange accent, no Supercharger badge.
- Mint Split v3.1 unchanged: 50% user / 25% LP / 20% burn / 5% treasury + separate 3% transfer tax. UI always shows 1 kWh = 1 $ZSOLAR (401(k)-match framing). Never expose backend split %.

## Receipt additions (Phase 4)
- Badge: `⚡ Tesla Supercharger · 100% REC-matched clean energy`
- Dual CO₂ line: `0.00 t via Tesla REC · vs local grid avg X.XX t`
- Uses `teslaRecCo2(kwh)` from `src/lib/co2Math.ts`.

## Data model
- `charging_sessions.source` (text + check)
- `charging_sessions.site_id` → `supercharger_sites(id)` ON DELETE SET NULL
- `charging_sessions.clean_claim` (text + check)
- `home_charging_sessions.source` / `.clean_claim` (defaults `home` / `self_produced`)
- `supercharger_sites` (lat/lng + tesla_site_id, RLS: read for authenticated, write for admin/editor)
- `profiles.first_supercharger_at` and `profiles.first_home_charge_at` — gate the one-time L2 banner.

## Out of scope
Full-screen takeover, discounted mint, Tesla payment, VPP discharge, audio.
