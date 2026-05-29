## Solar Concierge: Hyper-Personalized Energy Analysis

The goal: when a homeowner uploads their utility bill, solar contract, and (optionally) loan docs — and we already see live OEM production — Deason returns a **trusted-advisor-grade** report that no one in the solar industry is currently producing. Free preview hooks them; full report sits behind the $4.99/mo paywall.

### What the customer experiences

1. **Upload screen** in chat: "Drop your utility bill, solar contract, and loan paperwork." Drag-drop or camera; accepts PDF, JPG, PNG, HEIC.
2. **Streaming "Deason is reading your bill / contract / production data…"** with per-document checkmarks.
3. **Free preview card** (no paywall): headline savings number, 1 insight, 1 risk flag, blurred ROI/payback chart, "Unlock full analysis — $4.99/mo" CTA.
4. **Paid full report** opens in chat AND saves to `/energy-insights`:
   - Executive summary (one paragraph, trusted-advisor tone)
   - **ROI & payback** — true net ROI factoring loan APR, escalators, degradation, current production
   - **Rate-plan optimization** — current plan vs. best available plan in their utility territory, projected $/yr delta
   - **TOU shifting** — when to run dishwasher / charge EV / pre-cool, with $ saved
   - **System performance** — actual vs. expected kWh from live OEM, underperformance flags
   - **Battery & EV charging strategy** — if owned, optimal charge windows
   - **Contract risk flags** — escalator clauses, transfer terms, balloon payments
   - **Action items** — 3-5 ranked, each with $ impact + difficulty
5. **Branded PDF** download ("Your ZenSolar Energy Report — [Month] [Year]")
6. **Persistent `/energy-insights` page** — charts, savings cards, re-runnable on next bill

### Build phases

**Phase 1 — Foundation (this PR)**
- Storage bucket `energy-docs` (private, per-user folder)
- Tables: `energy_reports`, `energy_documents`, `energy_subscriptions`
- Multi-file upload UI in Deason composer (paperclip → bottom sheet: "Utility bill / Solar contract / Loan doc")
- Edge function `analyze-energy-package`: classifies each doc, extracts structured fields (Gemini 2.5 Pro vision), merges with live OEM totals from existing `useDashboardData` sources
- Free preview card component
- Paywall stub (button → "Coming soon")

**Phase 2 — Full report + page**
- `generate-energy-report` edge function (Gemini 2.5 Pro, structured output via AI SDK `Output.object`, schema-validated)
- `EnergyReportView` component (rich, mobile-first, trusted-advisor design)
- `/energy-insights` route with thread-linked persistence
- Server-side PDF generation (Puppeteer via edge function, branded template)

**Phase 3 — Paywall + re-engagement**
- Stripe Payments (seamless) — $4.99/mo subscription product, 7-day free trial
- Monthly auto-rerun cron after new bill detected → push notification + email "Your March insights are ready"
- "What changed since last month" diff card

### Technical details

- **Document parsing:** Gemini 2.5 Pro vision directly (no separate OCR). Returns Zod-validated `BillReport`, `ContractReport`, `LoanReport`.
- **Live OEM merge:** read `dashboard_kpis` for last-30-day actual kWh, compare vs. contract's stated system size × NREL PVWatts expected for their zip.
- **Tone enforcement:** system prompt locks "trusted advisor — fiduciary energy consultant, plain English numbers, no crypto jargon, no token references unless asked."
- **Free vs paid gate:** server returns full report always; client renders blurred sections + paywall overlay until `energy_subscriptions.active = true`.
- **Models:** `google/gemini-2.5-pro` (vision + reasoning) for analysis, `google/gemini-3-flash-preview` for chat fallback.
- **Re-engagement hooks:** weekly digest email already exists (Phase 1 of utility-optimizer roadmap) — wire monthly deep-insight email here.

### Out of scope for v1
- Auto-switching the customer's utility rate plan (Phase 3+, requires UtilityAPI write access)
- Tesla FSD miles tokenization (already Phase 2 of broader roadmap)
- Multi-property support (single home for v1)

### Deliverables of this plan
- Phase 1 ships as one PR; user can upload + see free preview within ~2-3 days.
- Phase 2 + 3 as follow-up PRs.

Approve and I'll start Phase 1 (storage + tables + upload UI + analyzer function + free-preview card).