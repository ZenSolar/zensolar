---
name: Master Project Outline
description: Cornerstone source-of-truth page at /founders/master-outline. 12 sections covering brand, thesis, tokenomics, IP, surfaces, OEM, stack, business, people, decisions, roadmap, open questions. Mirror twin of project memory.
type: feature
---

# Master Project Outline

## Where it lives
- Route: `/founders/master-outline`
- File: `src/pages/FoundersMasterOutline.tsx`
- Gating: `<FounderRoute>` + `<VaultPinGate>` (founder/admin role + PIN)
- Linked from: Founders Vault sidebar (when added)

## Why it exists
The single human-readable cornerstone document for ZenSolar (product) + ZenCorp Inc (entity). Memory files are great for the AI but useless for humans/investors/team — this page is for humans. As we build, decide, and evolve, this is where it gets recorded.

## Sections (12, fixed order)
1. Brand & Naming
2. The Thesis
3. Tokenomics
4. Intellectual Property
5. Product Surfaces
6. Live OEM Integrations
7. Tech Stack & Infrastructure
8. Business Model & Liquidity
9. People, Roles & Network
10. Strategic Decisions Locked (append-only log)
11. Active Roadmap
12. Open Questions

## Mirror twin rule
This page and project memory (`mem://`) are mirror twins. **Update both together, never one alone.** If a decision changes:
1. Update the relevant memory file
2. Update the corresponding section on the Master Outline
3. Append to "Strategic Decisions Locked" (Section 10) with date + why
4. Append to Founders Changelog (`/founders/changelog`)

## When to update
- New strategic decision locked
- Tokenomics version bump
- New OEM goes live (or status changes)
- Patent/trademark milestone
- New roadmap item committed (or shipped)
- Open question gets resolved
- Personnel/intro-path changes

## Forbidden
- ❌ Removing entries from Section 10 (append-only log)
- ❌ Letting it drift from memory files for >1 work session
- ❌ Sharing the URL externally — internal only

**Why:** Established Apr 25 2026 when Joseph asked for a master project outline that could serve as a cornerstone we update as we build. Memory is invisible to humans; this page makes the strategic surface area visible.
