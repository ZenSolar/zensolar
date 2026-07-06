# Dismissable OEM Diagnostics Banner

## Goal
Let the user permanently dismiss informational OEM diagnostic banners on the dashboard (like "Multiple solar sources connected"). Once dismissed, they never reappear on that device.

## Behavior
- Add an `X` (close) button to the top-right of each banner card in `OemDiagnosticsBanner`.
- Clicking `X` records the dismissal in `localStorage` under a key scoped to the current user + the diagnostic's `key` (e.g. `oem-diag-dismissed:<userId>:solar_source_conflict`).
- On next render, the hook/component filters out any diagnostic whose dismissal key is set.
- **Only `info`-severity diagnostics are dismissable.** `warn`/`error` (like "Tesla token expired — reconnect") stay non-dismissable because they need action, not acknowledgment.

## Why localStorage (not database)
- Zero backend/RLS changes — safe for a pre-demo commit.
- Truly per-device "I've seen this" acknowledgment matches (c) from the earlier question.
- If a diagnostic condition changes (e.g. user later disconnects one solar source), dismissal is still keyed to the finding type — reasonable behavior since the finding won't re-fire once the conflict is gone.
- Trade-off: dismissal doesn't sync across browsers/devices. Acceptable for a UX banner.

## Files changed
1. **New:** `src/hooks/useDismissedDiagnostics.ts`
   - `useDismissedDiagnostics()` returns `{ isDismissed(key), dismiss(key) }`.
   - Reads/writes `localStorage` keyed by user id (via `useAuth`) + diagnostic key.
   - Uses a single JSON blob `oem-diag-dismissed:<userId>` → `{ [key]: true }` to keep writes simple.
   - Component-level `useState` mirror so React re-renders on `dismiss()`.

2. **Edit:** `src/components/dashboard/OemDiagnosticsBanner.tsx`
   - Wire `useDismissedDiagnostics`.
   - Filter `diagnostics` to exclude dismissed keys before rendering.
   - Add an `X` button (top-right of each card) for `info` diagnostics only. Calls `dismiss(d.key)`.
   - Non-dismissable diagnostics (`warn`/`error`) render unchanged.

## Not touched
- `useOemDiagnostics.ts` — still scans and logs findings to `oem_diagnostic_log`. Dismissal is UI-only.
- The audit-log insert still fires on every scan (server-side/admin visibility unaffected).
- Database schema, RLS, edge functions.

## Verification (post-implementation)
- Load `/` (dashboard) → see the "Multiple solar sources connected" banner → click `X` → banner disappears.
- Reload the page → banner stays gone.
- Confirm any `warn`/`error` diagnostics (e.g. expired token) do NOT show an `X` button.
