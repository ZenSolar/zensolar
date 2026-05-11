## Goal

Jo Fertier asked 3 specific questions before getting the Lyndon meeting on the calendar. Build a single, forwardable brief that answers all three crisply — separate from the Lyndon one-pager so that artifact stays clean as the in-meeting pitch.

## Deliverables

1. New gated page: `/founders/jo-brief` (`src/pages/FoundersJoBrief.tsx`) — founder-only, behind `<FounderRoute>` + `<VaultPinGate>`.
2. New PDF: `public/founder-docs/jo-fertier-prebrief-v1.pdf` — generated via reportlab, downloadable from the page.
3. Sidebar link in Founders Vault.

## Brief structure (single page, scannable in 90 seconds)

**Header**
- Title: "Jo Fertier — Pre-Meeting Brief: Lyndon Rive"
- Subtitle: "Answers to the 3 questions before the calendar invite"
- ZenSolar logo + date

**Q1 — Competitive Landscape (vs SolarCoin et al.)**
- Lead with a 5-row comparison table sourced from `AdminCompetitiveIntel.tsx`:
  - Columns: Project | Verification | Supply Model | Liquidity | Patent IP | Status
  - Rows: ZenSolar, SolarCoin, GridPay, Power Ledger, C+Charge
- Followed by "3 reasons SolarCoin is not us":
  1. **Verification** — SolarCoin = unverified self-report (upload a screenshot). ZenSolar = SEGI + Proof-of-Delta™ cryptographic verification at the device API layer.
  2. **Supply** — SolarCoin = 98B pre-minted pool drained by claims. ZenSolar = Mint-on-Proof™ — tokens only exist when verified energy is produced. 1T hard cap, 20% burn-per-mint.
  3. **Liquidity & moat** — SolarCoin = no real LP, no patents, dead since 2014. ZenSolar = POL flywheel, 5 trademarks filed, patent-pending SEGI architecture, live OEM integrations.
- One-liner on GridPay: "ERCOT-only solo founder hackathon project, no verification IP, March 2026 launch — confirms the category is real, validates our nationwide multi-vertical moat."

**Q2 — The Ask from Lyndon**
- Verbatim from v8.1 (locked, do not modify): **"Board seat — co-shape the tokenized energy economy from day one."**
- One supporting line: why a board seat (not capital) — Lyndon's operator credibility + Tesla/SolarCity network unlocks utility partnerships and OEM rails faster than any check.

**Q3 — Going Live to See Traction**
Three proof pillars:
- **Live product**: beta.zen.solar — fully functional, embedded wallet, Tap-to-Mint™ working today
- **OEM integrations live**: Tesla ✅, Enphase ✅, Wallbox ✅, SolarEdge (code-ready) — real production data flowing for 4+ real users (Joseph, Tschida, Pessah, Golson)
- **IP filed**: SEGI™ provisional patent (Q1 2025), 5 trademarks filed (Mint-on-Proof™, Proof-of-Delta™, Proof-of-Origin™, Proof-of-Genesis™, Tap-to-Mint™), Device Watermark Registry on-chain spec

**Footer**
- "Live demo: https://beta.zen.solar"
- "Full competitive intel: internal admin"
- Confidential — for Jo Fertier only

## Technical approach

**Page (`FoundersJoBrief.tsx`)**
- Mirror layout patterns from `FounderSeedAsk.tsx` (header, version badge, download button, prose sections, comparison table using shadcn `Table`)
- Pull competitor data by importing the array from `AdminCompetitiveIntel.tsx` (refactor the `competitors` const into a small shared module `src/data/competitors.ts` so both pages use one source of truth — no duplication)
- Pull OEM live status from a new tiny constant `src/data/oemLiveStatus.ts` mirroring the memory file, so the page and PDF both render from one source
- Use semantic tokens only (no hard-coded colors)

**PDF (`/tmp/gen_jo_brief.py`)**
- reportlab, US Letter, 1" margins
- Same font + visual approach as v8.1 one-pager (Liberation Sans, 2-column cards where appropriate, ZenSolar logo at top)
- Single page if possible, max 2 pages
- Output → `public/founder-docs/jo-fertier-prebrief-v1.pdf`
- Mandatory QA: pdftoppm → inspect → fix → re-verify before declaring done

**Routing & access**
- Add route in `src/App.tsx` (or wherever Founders routes live)
- Wrap in `<FounderRoute>` + `<VaultPinGate>` (same pattern as Master Outline)
- Add link to Founders Vault sidebar labeled "Jo Fertier Brief"

## Out of scope

- No changes to v8.1 Lyndon one-pager
- No new competitive data — strictly reuse what's already in AdminCompetitiveIntel
- No traction numbers beyond what's already documented (no fabricated user counts)
- No business-logic changes
