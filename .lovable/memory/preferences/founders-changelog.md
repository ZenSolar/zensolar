---
name: Founders Changelog convention
description: Every work session must append a new entry to /founders/changelog (gated by FounderRoute + VaultPinGate) so Joseph and Tschida have one source of truth for shipped features, locked decisions, and memory updates.
type: preference
---

# Founders Changelog convention

Route: `/founders/changelog`
File: `src/pages/FoundersChangelog.tsx`
Gating: `<FounderRoute>` + `<VaultPinGate>` (founder/admin role + PIN)
Linked from: SMS recaps to Tschida, Founders Vault sidebar (later)

## When to update
At the **end of any work session** that:
- Ships a new page, widget, or user-visible feature
- Locks a strategic/naming/branding decision
- Adds a memory file or changes a Core memory rule
- Changes how rounds, tokenomics, or eligibility work

Do **not** add an entry for: micro-fixes, copy tweaks, isolated bug fixes with no strategic weight.

## Entry shape (`ChangelogEntry`)
```ts
{
  date: "April 24, 2026",          // human readable
  iso: "2026-04-24",               // sortable
  title: "Short headline",         // ≤ 6 words
  summary: "One-line elevator",    // ≤ 100 chars
  sections: [
    { heading: "Shipped",                    icon: "shipped",  bullets: [...], links: [...] },
    { heading: "Strategic Decisions Locked", icon: "strategy", bullets: [...] },
    { heading: "Saved to Project Memory",    icon: "memory",   bullets: [...] },
  ],
}
```

- **Newest entry first** — prepend to the `ENTRIES` array.
- **Links must use `https://beta.zen.solar`** — never lovable.app or lovable.dev.
- **Mark preview-only links** with `preview: true` so the amber "Preview" pill renders.
- **Bullets are scannable** — start with the noun (the feature/decision), then 1 sentence of why.

## How to apply
1. Open `src/pages/FoundersChangelog.tsx`.
2. Prepend a new `ChangelogEntry` object at the top of `ENTRIES`.
3. If a SMS recap is being drafted in chat, always include the line:
   `📜 Full changelog: https://beta.zen.solar/founders/changelog (PIN required)`

## Forbidden
- ❌ Re-using a date for two entries — split into two if a session crosses days.
- ❌ Public URLs to lovable.app/lovable.dev domains.
- ❌ Adding entries for routine bug fixes — keep signal high.
