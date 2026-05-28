---
name: Weekly Narrative (Deason's signature story)
description: Long-form hyper-personalized weekly story — separate from the lightweight digest. Email teaser links to /energy-insights/week/:id in-app reader.
type: feature
---

# Weekly Narrative — Deason's signature weekly story

The hyper-personalized companion to the lightweight `weekly-energy-digest`. The digest is the scannable KPI snapshot; the narrative is the editorial column.

## Architecture (v1: Tesla only)

- **Edge function**: `generate-weekly-narrative` — calls `generate-weekly-digest` with `dryRun:true` to reuse its OEM-prioritized weekly totals (single source of truth), then enriches with `charging_sessions` (Supercharger locations + costs), `home_charging_sessions`, vehicle device metadata, and a per-day solar series. Feeds rich JSON to Gemini 2.5 Pro with a long-form Deason-voice system prompt.
- **DB**: `weekly_narratives` table (one row per user per week, `UNIQUE(user_id, week_start_date)`). Stores `narrative_md`, `teaser`, `data_snapshot`, `source_oem_priority`, `model`.
- **Email teaser**: `weekly-narrative-teaser.tsx` template — first paragraph + "Read the full story" CTA → `/energy-insights/week/:id`.
- **In-app reader**: `/energy-insights/week/:id` — long-form magazine layout, drop-cap first paragraph, dark dashboard aesthetic, CO₂/tokens highlight cards above the narrative.
- **Admin preview**: `/admin/weekly-narrative` — sample + "Generate for me (dry run / save)" buttons.

## OEM source-of-truth rule (CRITICAL)

The narrative MUST follow `mem://features/data-source-of-truth.md` — same one-OEM-per-capability priority as the dashboard. Headline kWh totals come from the same OEM the dashboard chose. The narrative may pull *richer color detail* from a non-priority OEM (e.g. per-panel Enphase data) but the headline numbers stay aligned.

## v2 roadmap (next OEMs)

When Enphase/SolarEdge/Wallbox enrichments ship:
- **Enphase**: per-panel underperformer detection, Storm Guard activation story, IQ Battery outage rides
- **SolarEdge**: native self-consumption %, module temperature correlation, battery cycle count
- **Wallbox**: native solar-vs-grid energy split per session (Eco-Smart) + native cost
- **Tesla Fleet trips**: real trip geocoding ("Austin to Dallas, 195 mi") via fleet_telemetry — requires Mapbox/Google geocoding step

## Model

`google/gemini-2.5-pro`, temperature 0.85, 350-550 word target. System prompt enforces: flowing prose only (no headings/bullets), first-name once or twice, bold **numbers**, no crypto jargon, no sign-off.

## Gating (TODO before broad rollout)

Currently any authenticated user can call it for themselves. Production gating should restrict to Power tier / Deason inner-circle to control AI costs (Gemini 2.5 Pro is the priciest tier).
