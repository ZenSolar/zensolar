# Plan: Retire SEGI → Proof-of-Genesis™ (PoG) + Slide 07 Spotlight

## Part 1 — Global rename (copy + filenames + identifiers)

**Copy replacements** across ~50 files (slides, pages, components, learn/landing, proof, patent admin, memory, README, docs):

- `SEGI™` / `SEGI` → `Proof-of-Genesis™`
- `SEGI protocol/verification/minting/engine/stack/architecture` → `Proof-of-Genesis™ <same suffix>`
- "Software-Enabled Gateway Interface" expansions dropped → `Proof-of-Genesis™ protocol`
- De-dup: `Proof-of-Genesis™ + Proof-of-Delta™ Architecture` → `Proof-of-Genesis™ Architecture`; collapse any `Proof-of-Genesis™ Proof-of-Genesis™` artifacts.
- Where space is tight (diagram labels, table headers, footnotes), use `PoG` after first mention.

**File / identifier renames** (with imports updated everywhere):

- `src/components/technology/SEGIProofOfDeltaDiagram.tsx` → `ProofOfGenesisDiagram.tsx`; component `SEGIProofOfDeltaDiagram` → `ProofOfGenesisDiagram`
- `src/components/admin/patent/SEGIArchitectureDiagram.tsx` → `ProofOfGenesisArchitectureDiagram.tsx`; matching component rename

**Memory updates**

- `mem://index.md` — add core rule: *"Proof-of-Genesis™ is the SSOT name for the verification protocol. Short form is PoG. SEGI is retired — never reintroduce."*
- `.lovable/memory/features/trademark-roadmap.md` — retire SEGI™ mark, consolidate under Proof-of-Genesis™, note PoG short form.
- `.lovable/memory/features/tm-stack-visualization.md`, `legal/patent-update-checklist.md`, `audit-enhancements-2026-04.md`, `plan.md` — rename references and reference PoG rule.

**Verification pass:** `grep -ric segi` across repo → expect 0.

## Part 2 — Slide 07 spotlight (`src/components/investor/pitch/slides/v3/S07Tech.tsx`)

Rebuild around PoG as hero; keep v3 calm/card-based dark aesthetic.

1. **Hero band**
   - Kicker: "Proprietary Tech & IP"
   - Display headline (~96px): **Proof-of-Genesis™**
   - Small line under headline: *Short form: PoG*
   - Subhead: "The first real-time, multi-OEM verification protocol that mints currency directly from verified clean energy."
   - Pill: "U.S. App. 19/634,402 · Patent-pending"

2. **Efficiency comparison** — one emphasized `DeckCard`, 2 columns with vertical secondary-glow divider:

   | Bitcoin (Proof-of-Work) | $ZSOLAR (Proof-of-Genesis™ / PoG) |
   |---|---|
   | ~1,400,000 kWh per coin | 1 kWh of clean energy per $ZSOLAR |
   | Energy intensive · centralized mining | Energy efficient · distributed homes |
   | No direct tie to real-world value | Directly tied to verified clean energy |

   Left column muted (white/45). Right column `text-amber-400` headline values + amber border-glow.

3. **Bottom strip** — three small `DeckCard`s:
   - **Real-time verification** — Tesla + Enphase + SolarEdge + Wallbox telemetry → mint in 30–60s.
   - **Multi-OEM unified** — Only protocol that verifies multiple OEMs in a single system.
   - **Patent-pending stack** — Mint-on-Proof™ · Proof-of-Delta™ · Proof-of-Origin™ chips.

L1–L4 stack list removed from this slide (still rendered by `ProofOfGenesisDiagram` on Technology/patent admin pages).

## Part 3 — Sibling slides

`S08ThreeEngines.tsx`, `S09ScaleOpportunity.tsx`, `S03Opportunity.tsx`, `S05Solution.tsx`, `S06FoundationalMoat.tsx`: swap SEGI strings → Proof-of-Genesis™ (use PoG in tight labels). No structural changes.

## Out of scope

- Solidity contracts, smart-contract names, env vars, route paths.
- PIN gate, PitchDeckShell, print mode, navigation.

## Final reply

> Global rename complete + Slide 07 now spotlights Proof-of-Genesis™ (PoG) with Bitcoin efficiency comparison.
