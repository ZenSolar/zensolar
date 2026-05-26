---
name: Battery export — bi-directional KPI not integrated
description: Receipts and KPIs must NOT read bidir_export/bidir_out/bidir_import rows; bi-directional flow attribution is unresolved
type: constraint
---
Do NOT wire any receipt row, KPI, or contributing-sessions filter to `bidir_export`, `bidir_out`, or `bidir_import`. We have not decided how bi-directional energy events will be attributed (battery vs grid vs EV V2H), and reading those rows produces ghost attributions in receipts.

Battery Discharge receipt rows must render as **headline-only** (lineSources: []) with the inline note "Headline only · bi-directional sessions not yet integrated" until we ship a single source-of-truth for battery dispatch. When that decision lands, update `SOURCE_DEFS.battery_kwh.lineSources` in `src/components/proof/VerifyPoAContent.tsx` and the `get_mint_source_lines` RPC together.

**Why:** A previous wiring to `['bidir_export','bidir_out']` caused battery rows to silently surface unrelated bidir events whenever background polling wrote to `bidirectional_mint_events`.
