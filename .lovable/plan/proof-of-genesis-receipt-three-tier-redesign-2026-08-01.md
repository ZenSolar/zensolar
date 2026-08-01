# Proof-of-Genesis receipt — three-tier redesign

The cryptographic layer (in-browser Merkle recomputation, recomputed root vs anchored root) stays exactly as it is. Everything around it gets restructured into three progressively disclosed tiers, and the dead evidence layer gets built.

## Root cause of the dead "View sessions"

Confirmed, not guessed. The database function `get_mint_source_lines` throws at runtime:

```text
ERROR: malformed array literal: "supercharger"
QUERY: v_attributed := v_attributed || 'supercharger'
```

The concatenation is ambiguous, so Postgres tries to parse the bare string as an array. Every mint that has a non-empty source breakdown hits this and the function errors out. Both the "Minted for" pill and the session list swallow the error and render nothing — so the control is not just empty, the data call never returns. This is fixed first, in a migration.

A second, harder truth surfaced while checking the Jul 7 mint (2,843 kWh, 2,643.99 $ZSOLAR):

- There are **zero** `charging_sessions` rows in that mint's window. There are no individual Supercharger sessions to list for it.
- The Tesla EV-charging rows that do exist in that window are **lifetime counter snapshots** (the same 2,843,858 Wh value repeated, each with `delta: 0`), marked `pre_cutover`. The mint came from a lifetime-counter delta, not from sessions.
- So 2,843 kWh × 1.0 does not equal 2,643.99. The receipt cannot honestly assert "1 kWh = 1 $ZSOLAR" for this mint.

Tier 2 therefore shows what is actually recorded and names the gap, rather than inventing session rows.

## Tier 1 — The receipt

One screen, no scroll on a phone. Keeps: the PoA seal, the amount, the source, the date, and one plain sentence ("2,843 kWh of Supercharging, verified against your vehicle's signed counter"). Removes from this level: the badge strip, the impact panel, all hashes, the "Tap a badge to verify" row. A single control drops to Tier 2.

## Tier 2 — The evidence (new)

A five-step chain of custody, rendered top to bottom:

1. **Device** — the device this mint came from, with its watermark.
2. **Readings** — one row per contributing record: date, quantity, and location/duration where recorded. Per-session rows when session records exist. When the mint came from a lifetime counter instead, the rows show the counter snapshots and are labelled as such — no fabricated sessions.
3. **Delta** — prior counted value vs new value, and the difference.
4. **Factor** — stated per category from the canonical factors file (`1 kWh = 1 $ZSOLAR` for supercharging), never as a global claim.
5. **Result** — quantity × factor, then any named reduction (netting, allowance cap, partial consumption, or legacy pre-cutover rate) as its own line, ending at the minted amount. When the arithmetic does not close, the receipt says so explicitly instead of asserting a rate it cannot support.

## Tier 3 — The proof

Unchanged internals. Three edits:

- Lead with "Anyone with the link can re-verify this receipt — no ZenSolar account needed" as the headline claim, not body text.
- Give the forward pointer a sentence: a later receipt commits to this one, so this receipt cannot be altered after the fact.
- Reconcile the indices: `RECEIPT #39` is this member's own mint sequence; `Leaf 49 of 50` is the position in the global anchor batch. Both get relabelled ("Your mint #39" / "Position 49 of 50 in anchor batch") with one line explaining the relationship.

## Fixes

| # | Fix |
|---|-----|
| 1 | Repair `get_mint_source_lines` array concatenation (migration) — unblocks Tier 2 |
| 2 | Delete the trademark footer entirely, on the receipt and in `VerifyOnChainDrawer`. Keep "Patent-pending. App. 19/634,402." No trademark or pending-registration claim anywhere |
| 3 | Impact module becomes category-aware, renders only when the value is real and non-zero. Supercharging states energy delivered, never CO₂ avoided |
| 4 | Remove "put clean energy on the grid" — reserved for verified battery export only |
| 5 | Remove "100% renewable-matched" (Tesla's claim, not ours) |
| 6 | Delete the vs-BTC badge and the entire Proof-of-Work comparison panel |
| 7 | Badges render only when true — VERIFIED DELTA only when per-reading delta rows back the mint |
| 8 | Fix the sticky-header collision so the "Next receipt" pill clears the status bar (safe-area inset on the receipt sheet/page headers) |
| 9 | Confirm `?capture=1` hides the Deason bubble and the cleanup/trash control on `/verify/:hash` and the receipt preview |

## Technical notes

- Files: `src/components/proof/VerifyPoAContent.tsx` (restructured into three tiers), `src/components/proof/ReceiptSourceLines.tsx` (evidence rows + delta/factor/result block), `src/components/proof/TamperEvidentProofPanel.tsx` (lead claim, forward-pointer sentence, index labels), `src/components/proof/VerifyPoASheet.tsx` and `src/pages/ProofOfGenesisReceiptPreview.tsx` (sticky header), `src/components/proof/VerifyOnChainDrawer.tsx` (trademark line).
- One migration: fix the array concatenation in `get_mint_source_lines`, and extend its return so each line carries the delta context and the per-category factor the receipt needs. No data is modified.
- All factors and labels read from `src/lib/mintFactors.ts`. No rate is written into copy.
- Verification: load `/verify/e5339249…` (Jul 7) and `/verify/4acbabda…` (Jul 15, EV miles) in the browser, expand Tier 2 on each, and confirm the arithmetic block renders and the Merkle panel still verifies.
