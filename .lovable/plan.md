## Goal

Transition the in-app focus from the ZenEnergy live-monitoring dashboard to **Deason — your clean-energy optimization advisor**. Users upload a few documents, Deason reads them, writes a personalized analysis directly in the chat thread, and then answers follow-up questions grounded in those documents.

Output style is **conversational inside the existing Deason chat** (your choice). The existing /deason page, thread persistence, and edge functions stay — we upgrade them.

## What documents we need (and why)

For the analysis to actually be useful, Deason needs three things:

| Doc | Why it matters | Required? |
|---|---|---|
| **Most recent utility bill** (PDF/photo) | Tells us utility, rate plan, TOU windows, $/kWh, total kWh, NEM credits. Without it we can't ground any savings claim in real numbers. | **Required** |
| **Solar installation contract** (PDF) | System size (kW DC/AC), inverter/battery brand, install date, warranty terms, escalators, dealer fees, performance guarantee. Lets us judge whether the system is performing and whether the customer was treated fairly. | **Strongly recommended** |
| **PPA agreement OR loan paperwork** (one or the other — whichever applies) | PPA: term, $/kWh, annual escalator, buyout schedule. Loan: APR, term, payment, dealer fee, prepayment. This is where most of the "did I get a good deal?" answer lives. Customers usually have one or the other, never both. | **One of the two** |

The UI will treat #1 as required, #2 as recommended, and #3 as a single "PPA or loan" slot so users aren't confused into thinking they need both.

## What changes

### 1. Re-skin the /deason landing experience
- New welcome state when a thread has no messages: a hero card titled **"Let's analyze your energy setup"** with a single primary CTA → **Upload your documents**.
- Suggested-prompt set switches from the current token/ZenSolar prompts to optimization prompts: *"Analyze my latest bill"*, *"Am I on the right rate plan?"*, *"Is my solar contract fair?"*, *"Should I refinance my solar loan?"*.
- Header/title on /deason becomes **"Deason · Clean Energy Optimization"**.

### 2. Upgrade the EnergyDocSheet upload flow
- Reduce to 3 slots: utility bill (required), install contract (recommended), and a single **PPA or loan** slot with a small radio to declare which it is.
- Inline reassurance: "Documents stay private. Used only to write your report."
- After submit, the sheet closes and Deason begins writing the analysis as a normal assistant message in the active thread.

### 3. Wire the analysis into the chat (not a side card)
- `generate-energy-report` already returns structured JSON + a narrative. Reuse it, but stream the **narrative** straight into the thread as an assistant message and persist a compact summary of the structured fields (rate plan, system size, contract terms, key risk flags, top 3 actions) as hidden thread context.
- Render the structured highlights (ROI, top action items, contract risk flags) as a collapsed inline card *below* the assistant message — using the existing `EnergyReportCard` / `BillSavingsReport` components — so the user can expand for details but the conversation reads naturally.

### 4. Make follow-up questions grounded
- Extend `deason-chat` to include the latest doc-analysis summary for the thread in its system context (kept under ~2k tokens, server-side only).
- This lets users ask things like *"What would I save if I switched to EV2-A?"*, *"Is the 2.9% escalator in my PPA standard?"*, *"My bill went up $40 — why?"* and get answers tied to **their** documents.

### 5. Reframe Deason's public persona
- Update the public `PUBLIC_PROMPT` in `deason-chat` so the primary identity is **clean-energy optimization advisor**: bill analysis, rate-plan strategy, contract/loan/PPA fairness review, HVAC/EV/battery scheduling.
- Token/$ZSOLAR talk stays available as a secondary topic but is no longer the lead. Inner-circle prompt is untouched.

### 6. Storage + persistence (minor)
- Add a `deason_doc_analyses` table keyed by `thread_id` that stores: structured report JSON, narrative, doc storage paths, created_at. RLS scoped to `auth.uid()`. Used by step 4 to inject context and by step 3 to re-render the inline card on reload.
- Existing `energy-docs` storage bucket is already used for the uploaded files — no change.

## What we are NOT doing in this pass
- Not removing the live-monitoring dashboard from /index (that's a separate decision — flagged but kept).
- Not changing onboarding, founders pages, or tokenomics surfaces.
- Not adding Phase 2 utility-API auto-pull, weekly report email, or FSD/Tesla integrations from the Deason roadmap memo.

## Technical notes

- Files touched: `src/pages/Deason.tsx`, `src/components/deason/DeasonChat.tsx`, `src/components/deason/EnergyDocSheet.tsx`, `src/components/deason/EnergyReportCard.tsx`, `src/hooks/useEnergyReport.ts`, `supabase/functions/deason-chat/index.ts`, `supabase/functions/generate-energy-report/index.ts`.
- New: `deason_doc_analyses` table + RLS + GRANTs; small migration only.
- Edge functions continue to use Lovable AI Gateway (`google/gemini-2.5-pro` for the report, `google/gemini-2.5-flash` for chat streaming).
- No new secrets, no schema changes outside the new table.

## Open question I should confirm before building

When a user starts a brand-new thread, should Deason:
- **(A)** Immediately prompt for documents (block chat until uploaded), or
- **(B)** Let them chat freely and surface a soft "upload your bill for a real answer" nudge after the first vague question (current default)?

I'll go with **(B)** unless you say otherwise.
