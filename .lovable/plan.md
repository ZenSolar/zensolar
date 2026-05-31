## Deason AI v1 — Build Plan (approved scope, weather as placeholder)

Building the full v1 as previously laid out, with weather shipped as a "coming soon" placeholder. No `OPENWEATHER_API_KEY` will be requested this pass — when the key is added later, the placeholder swaps to live data without further UI work.

### 1. Database (single migration)

New tables (all RLS owner-only, `GRANT` to authenticated + service_role):

- `deason_documents` — permanent per-user library
  - `user_id`, `kind` (utility_bill | installer_contract | ppa | loan | other), `label`, `storage_path`, `mime`, `size_bytes`, `source` (upload | monthly_ritual), `linked_analysis_id` (nullable), `linked_report_id` (nullable), `uploaded_at`
- `deason_monthly_reports`
  - `user_id`, `period_month` (date, first of month), `bill_doc_id` (fk → deason_documents), `structured_report` jsonb, `narrative` text, `dollars_saved` numeric, `bonus_tokens` numeric, `status` (processing|ready|failed)
  - Unique `(user_id, period_month)`
- `deason_progression`
  - `user_id` PK, `level` int, `points` int, `months_completed` int, `total_saved_usd` numeric, `total_bonus_tokens` numeric, `streak_months` int, `updated_at`
- `deason_insights`
  - `user_id`, `kind` (savings|risk|opportunity|seasonal), `title`, `body`, `severity`, `dismissed_at`, `created_at`
- `deason_weather_cache` — kept even with placeholder so live-key swap is one-liner
  - `user_id`, `lat`, `lon`, `payload` jsonb, `fetched_at`

Profile additions:
- `profiles.esid` text, `profiles.state_code` text(2), `profiles.utility_name` text

### 2. Edge functions

- `generate-energy-report` (extend)
  - Persist uploaded files to `deason_documents` as `source='upload'` and link the resulting `analysis_id`.
  - When the run is a monthly ritual (flag in request), also write a row to `deason_monthly_reports`, compute month-over-month deltas (vs latest prior report), update `deason_progression`, and emit 1–3 `deason_insights` rows.
- `deason-chat` (extend)
  - Server-side fetches: latest analysis, latest monthly report summary, library index (last 20 docs, kind+label only), progression snapshot, ESID/state. Injects them as a compact `USER CONTEXT` block in the system prompt.
  - Texas-aware prompt segment when `state_code='TX'` or ESID present (REP/TDU/buyback framing).
- `deason-weather` (new, placeholder mode)
  - Reads `OPENWEATHER_API_KEY` from env. If absent → returns `{ status: 'placeholder', message: 'Weather forecast coming soon' }`. If present → fetches OpenWeather One Call 3.0, caches 6h in `deason_weather_cache`, returns `{ status: 'ready', today, threeDay }`.
  - `deason-chat` calls it best-effort and includes `weather_summary` in context only when status='ready'.

### 3. Frontend (`/deason`)

Restructure into a hub + thread layout. When no thread is selected (or new thread, no messages), render `DeasonHub`. When a thread has messages, render `DeasonChat` as today.

New components:
- `DeasonHub.tsx` — composition of the cards below
- `MonthlyReportCard.tsx` — prominent "Latest Monthly Clean Energy Report" with dollars saved, top action, expand → `EnergyReportCard` + `BillSavingsReport`
- `ProgressionCard.tsx` — level, points, streak, total saved, next-month CTA
- `DocumentLibrary.tsx` — grouped by kind, upload/replace, "Use in new analysis"
- `WeatherOutlookCard.tsx` — placeholder state by default ("Weather forecast coming soon · enable in settings"), live state when function returns ready
- `QuickInsightsFeed.tsx` — top 3 undismissed insights with dismiss
- `MonthlyRitualBanner.tsx` — nudge when no report exists for current month

Edits:
- `Deason.tsx` — hub/thread switch, header copy
- `DeasonChat.tsx` — header gains orange spark icon variant; landing state inside a thread keeps existing upgraded prompts
- `EnergyDocSheet.tsx` — adds optional ESID field (shown when `state_code='TX'` or unknown); on submit also writes `deason_documents` rows
- `DeasonFloatingBubble.tsx` — same shared context payload as `/deason` (uses `threadId`+user, server fetches the rest, no duplication client-side)
- `useDeason.ts` / `useEnergyReport.ts` — pass `isMonthlyRitual` flag, surface progression+report data to hub

### 4. Models & secrets

- Monthly report + analysis: `google/gemini-2.5-pro` (existing)
- Chat: `google/gemini-2.5-flash` (existing)
- No new secrets requested this pass. `OPENWEATHER_API_KEY` is read defensively; absent → placeholder.

### 5. Out of scope (explicit)

- OpenEI URDB / DSIRE / Electricity Maps / PVWatts live APIs (narrative-only in v1)
- Weekly digest emails, Tesla FSD integration
- Paywall enforcement for Power tier
- Light mode anywhere

### Technical layout

```text
/deason
├── DeasonHub (no thread selected)
│   ├── MonthlyRitualBanner (conditional)
│   ├── ProgressionCard
│   ├── MonthlyReportCard (latest)
│   ├── QuickInsightsFeed
│   ├── WeatherOutlookCard (placeholder)
│   ├── DocumentLibrary
│   └── Past reports timeline
└── DeasonChat (thread selected)
    ├── EnergyDocSheet (upgraded, +ESID)
    └── Inline EnergyReportCard in assistant messages
```

### Execution order

1. Migration (tables + grants + RLS + profile cols)
2. Edge functions (`deason-weather` new, extend `generate-energy-report`, extend `deason-chat`)
3. Hooks (`useDeason`, `useEnergyReport`, new `useDeasonHub`)
4. Hub components + integrate into `Deason.tsx`
5. `EnergyDocSheet` ESID + library write
6. `DeasonFloatingBubble` shared-context wiring
7. Smoke test in preview at `/deason`

Ready to flip to build mode and ship.
