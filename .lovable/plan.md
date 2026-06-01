# Deason Polish — Waves B–E

Continues the next-level polish on top of Wave A. All mobile-first (390×844), dark-only, family-friendly, locked to the SSOT vision (no crypto jargon, no backend mint-split exposure, 1 kWh = 1 $ZSOLAR framing). No DB migrations, no new edge functions, no new dependencies.

---

## Wave B — Chat: richer citations, slash menu, action chips
New: `src/components/deason/chat/CitationChip.tsx`, `SourcesSheet.tsx`, `SuggestedFollowups.tsx`, `SlashMenu.tsx`.
Edit: `src/components/deason/DeasonChat.tsx`, `supabase/functions/deason-chat/index.ts` (additive prompt only).

1. **Numbered citation chips.** Today `[doc:<id>]` renders as a generic "source" pill. Build a client-side `docIndex` from `useDeasonHub().library` (id → kind + label + uploaded date) and render numbered `[1] [2]` chips that match. Multi-cite (`[doc:a][doc:b]`) collapses into one chip with a count.
2. **Sources sheet.** Tapping a chip opens a bottom sheet (mobile) / overlay (desktop) listing the referenced docs with icon, title, kind, date, and a "Open Document Library" link (`/deason`).
3. **Suggested follow-ups.** Below each completed assistant message, render up to 3 contextual chips. Priority: model-emitted `<followups>JSON</followups>` block → heuristic ruleset (bill / contract / PPA / Texas) → generic default trio. Tap → `send(prompt)`.
4. **Slash menu.** When the user types `/` as the first char, show a 4-item popover above the composer: `/bill`, `/rate`, `/contract`, `/texas`. Each pre-fills a structured question. Arrow keys + Enter to pick, Esc to dismiss.
5. **Streaming shimmer.** Replace the 3 animated dots with a rotating shimmer label ("Reading your docs…" / "Thinking…") while streaming.
6. **Action affordances.** Copy + regenerate buttons on each completed assistant message.
7. **System prompt nit.** Append one line so the model optionally emits a `<followups>` JSON block; client strips it from display and uses it. Falls back to client heuristics if missing/malformed.

---

## Wave C — Document Library + upload polish
New: `src/components/deason/library/DocCard.tsx`, `LibraryFilters.tsx`, `LibraryDropzone.tsx`.
Rewrite: `src/components/deason/hub/DocumentLibrary.tsx`.

1. **Card grid.** Replace grouped list with a 2-col mobile / 3-col tablet grid of doc cards: colored corner tag by kind (bill = sky, contract = amber, PPA = emerald, loan = violet, other = slate), kind icon, filename, uploaded date, "Ask Deason" link that opens chat seeded with that doc's id.
2. **Filters + search.** Sticky pill row: All · Bills · Contracts · PPAs · Loans · Other. Client-side search input filters by label/filename.
3. **Drag-and-drop zone.** Persistent dashed dropzone at the top — drop PDF/JPG/PNG → opens `EnergyDocSheet` pre-populated with the file. Reuses the existing upload pipeline; no schema changes.
4. **Inline summary after upload.** When `useEnergyReport` returns, show a 3-bullet "Deason's summary" sticker on the freshest card for 24h, persisted via localStorage `deason_lib_summary_seen` (purely a UX nicety).
5. **Empty state.** Illustrated card: "Start with one utility bill — Deason needs 60 seconds to read it." + big "Upload bill" button.

(Bulk delete deferred — no existing delete RPC; not adding new backend in a polish pass.)

---

## Wave D — Floating bubble: empty/loading/error states
Edit: `src/components/deason/DeasonFloatingBubble.tsx`, `src/components/deason/DeasonChat.tsx`.

1. **Loading skeleton.** Replace spinner-only `loadingHistory` with a 3-row message skeleton so the panel feels alive on cold open.
2. **Empty-thread upgrade.** When `messages.length === 0`, replace the long vertical stack with: avatar pulse, single sentence ("I read every word of your bills, contracts, and PPAs."), compact 2×2 prompt grid.
3. **Error retry card.** When `error` is set, render a card with "Try again" (re-sends last user message) and "Tell me what happened" (seeds a help-flow message). Replaces the bare destructive box.
4. **Thread prep failure.** Surface a small "Couldn't start a saved chat — using ephemeral mode" banner above the composer with a "Retry saving" link.
5. **Bubble polish.** Soft idle breathing animation (1.6s pulse, respects `prefers-reduced-motion`) when not actively nudging.

---

## Wave E — Texas + device telemetry surfacing
New: `src/components/deason/hub/DeviceTelemetryStrip.tsx`, `src/components/deason/chat/ContextBadges.tsx`, `src/hooks/useDeviceTelemetry.ts` (lightweight read-only client query of `energy_data`).
Edit: `src/components/deason/hub/TexasContextCard.tsx` (export a compact `TexasContextPill` variant), `src/components/deason/hub/DeasonHub.tsx`, `src/components/deason/DeasonChat.tsx`.

1. **Texas now-pill in chat.** Single-row "📍 Texas grid · TDU · REP" pill at the top of the chat when `state_code === "TX"` or ESID is present. Tap → opens a sheet with the existing assumptions accordion.
2. **Device telemetry strip on hub.** Compact strip above the report card: per-OEM today snapshot ("Tesla · 38.6 kWh produced · 71% SOC", "Enphase · 22.1 kWh exported"). Pulls from `energy_data` (same data the chat backend already uses). Falls back to "Connect your gear" CTA when empty.
3. **Context badges in chat composer.** Above the composer, 2–3 dismissible chips: `📍 Houston, TX` `⚡ Reliant Solar Payback Plus` `🔋 Powerwall · 71%`. Communicates what Deason can already see — premium-feel trust cue. Hidden if no context; dismiss state held per-session.
4. **TX-aware follow-ups.** Wave B's heuristic ruleset already biases to ERCOT prompts when `ctx.state_code === "TX"`.

---

## Cross-cutting
- Semantic tokens only (no raw hex). Tailwind classes only.
- 390×844 verification per wave; desktop is a bonus.
- Lazy-load `SourcesSheet` + `SlashMenu` via `React.lazy` to keep DeasonChat TTI flat.
- Preserve all existing behavior: thread switcher, search highlight, in-chat energy-doc upload, inner-circle prompts, welcome pulse.

## Execution order
B → C → D → E. Each wave is independently shippable.

## Out of scope
- Energy Price Oracle (parked).
- Light-mode work.
- Avatar / sparkle redesign.
- Mass copywriting sweep beyond strings touched per component.
- New DB tables, RPCs, or edge functions.

## QA per wave
- **B:** send a message that should cite → chip → sheet → library link; type `/` → menu; followups appear; copy + regen work.
- **C:** drag a PDF onto the grid → upload completes → summary sticker → filter + search work; empty state on fresh account.
- **D:** cold-open bubble shows skeleton; force a network error → retry card; unauth state; prep-fail banner appears.
- **E:** TX-profile fixture shows Texas pill + telemetry strip + context chips; non-TX user sees none of them.
