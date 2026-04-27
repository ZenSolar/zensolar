---
name: Catchup page (Michael's async briefing)
description: /founders/catchup is Michael's async briefing room — daily roll-ups, since-last-visit diff, and a pending-decisions block where he can 👍/👎/comment without a meeting.
type: feature
---

# Catchup page

- Route: `/founders/catchup` · File: `src/pages/FoundersCatchup.tsx`
- Gating: `<FounderRoute>` + `<VaultPinGate userId={user.id}>`
- Linked from: Founders Vault top card (Coffee icon)

## Three jobs
1. **Since your last visit** — diff against `localStorage["zen.catchup-last-visit:<uid>"]`. Stamps the visit on mount so next visit shows the next diff.
2. **Daily roll-ups** — `ROLLUPS` array in the file, newest first. ONE entry per day (not per session).
3. **Decisions pending input** — reads from `founder_decisions` (status='pending') + `founder_decision_votes`. Michael can 👍 Approve / 👎 Push back, plus optional comment. Upserts unique on (decision_id, user_id).

## Cadence rules
- **Daily roll-up** replaces per-session for the catchup view. The legacy per-session changelog (`/founders/changelog`) still gets entries.
- **Weekly Friday email nudge** — copy line on the page footer; actual email send is a future task (not yet wired).

## Tables
- `founder_decisions` (title, context, options jsonb, recommendation, status, locked_choice, locked_at) — RLS: founders + admins
- `founder_decision_votes` (decision_id, user_id, vote, choice, comment) — RLS: read by founders/admins, write own only, UNIQUE(decision_id, user_id)

## Adding a new decision for Michael to weigh in on
Insert directly into `founder_decisions` with status='pending'. Optional `recommendation` field renders as "Joseph's lean:" callout. Options array shows as bullets above the vote row.

## Forbidden
- ❌ Per-session entries on the catchup `ROLLUPS` array — keep it daily.
- ❌ Reading other founders' votes via the client; RLS allows founder-role to read all but UI only shows the current user's vote.
