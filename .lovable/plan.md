## Goal

1. Simplify and rename the flywheel memory doc (drop halving from the steady-state model).
2. Do a global scan and **remove halving wording where it's no longer load-bearing**, while preserving the on-chain/architectural `GENESIS_HALVING` plumbing (constant, modal component, simulation page) so we don't break runtime code or accidentally ship a contract change.

## Part 1 — Memory file (primary deliverable)

### Rename + rewrite `tiered-subscriptions-halving-flywheel.md` → `tiered-subscriptions-flywheel.md`

- Title: "Tiered Subscriptions Flywheel (v3.1)"; frontmatter description updated to steady-state v3.1 (50/20/20/10) with continuous 20% burn replacing halving.
- §1 add bullet: *"Continuous deflation — every mint burns 20%, no scheduled halving required."*
- §2 / §3 unchanged.
- §4 Genesis Halving → **deleted**.
- §5 collapsed to ONE steady-state table (current "Before Genesis Halving" numbers: Base −$40.005 / Regular −$2.505 / Power +$22.495); reworded key-insight to lean on Power positivity + cohort-mix shift + Satoshi-Mirror buyback (no halving cliff needed).
- §6 cohort table — rename phase row "Post-Halving" → **"Mature (250k+)"**; remove halving causality from prose.
- §7 / §8 unchanged.
- §9 Satoshi-Mirror interaction — rewrite to drop halving co-dependency.
- §10 open questions — drop Q1 (halving trigger); reframe Q3 staking timing.
- §11 cross-refs — remove `mem://features/halving-schedule` line; add note that the file is archived/legacy.
- §12 forbidden phrasings — drop the halving line; add: ❌ "Genesis Halving as required mechanism in v3.1" → ✅ "continuous 20% burn".
- New **§13 "Why no halving in v3.1"** — 3–4 bullet rationale (continuous burn, constant LP, no UX cliff, simpler model).

### Update `mem://memory/features/halving-schedule.md`
- Add a top "DEPRECATED in v3.1" banner; keep file as historical record. Do NOT delete (other docs still reference it).

### Update `mem://memory/features/scarcity-stack.md` & `satoshi-mirror-v2-oracle.md` & `proof-of-genesis-verification.md` & `CANONICAL_SSOT.md`
- Light surgical edits: where halving is described as a load-bearing mechanism, add a "(v3.1: continuous 20% burn is primary; halving deferred / optional)" qualifier. Do NOT remove all references — these are historical SSOT docs.

### Update `mem://memory/index.md`
- Update flywheel link if listed (it isn't currently). Add new line for `tiered-subscriptions-flywheel.md`.
- Tweak Core block to add: *"Genesis Halving is DEPRECATED in v3.1 narrative — continuous 20% burn is the deflation mechanism. Code constants (`GENESIS_HALVING`, modal, simulation) remain for optional future re-activation but should NOT be surfaced in new investor/user copy."*

## Part 2 — Code/UI copy: surgical halving removal

**Rule:** remove halving from **user-facing narrative copy and investor pitch slides**. **Keep** the technical scaffolding (`src/lib/tokenomics.ts GENESIS_HALVING` constant export, `GenesisHalvingAnnouncementModal.tsx` component, `FlywheelSimulation.tsx` simulator, `SatoshiMirrorFloorCard.tsx` if it's a live UI primitive) — these are runtime/admin tools and ripping them out risks breakage.

### Files to clean (remove halving wording from copy)
- `src/pages/learn/LearnHowItWorks.tsx` (1 hit) — replace halving sentence with continuous-burn line.
- `src/components/how-it-works/TokenomicsExplained.tsx` (1 hit) — same.
- `src/components/tokenomics/ProofOfGenesisThesis.tsx` (1 hit) — same.
- `src/components/investor/pitch/slides/Slide09Revenue.tsx` (1 hit) — drop halving bullet, lean on 20% burn.
- `src/components/investor/pitch/slides/Slide10ThreeWallsMoat.tsx` (1 hit) — same.
- `src/components/investor/pitch/slides/Slide13TheAsk.tsx` (1 hit) — same.
- `src/components/founders/ScarcityOutlookSection.tsx` (1 hit) — same.
- `src/components/dashboard/SatoshiMirrorFloorCard.tsx` (2 hits) — copy-only edits; keep the card and its data wiring.

### Files to leave alone (kept as-is, with comment if needed)
- `src/lib/tokenomics.ts` — keep `GENESIS_HALVING` constant; add JSDoc note "Deprecated in v3.1 narrative; retained for optional future activation."
- `src/components/subscription/GenesisHalvingAnnouncementModal.tsx` — kept; not currently mounted in user flow.
- `src/pages/FlywheelSimulation.tsx` — kept (admin/founder simulator). Add page-level banner: "Halving sim is legacy; v3.1 model uses continuous burn."
- `src/pages/AdminGrowthProjections.tsx`, `AdminTokenomicsFramework.tsx`, `AdminFinalTokenomics.tsx` — admin-only; leave wording. Optional: add small "(legacy mechanism)" tag.
- All `src/pages/Founders*.tsx` SSOT/changelog/pack/seed pages — these are historical founder records, leave intact (the changelog should *record* the deprecation, not erase it).
- `src/pages/archive/*` — never touch (archived already).
- `docs/TOKENOMICS_OPTIMIZATION_FRAMEWORK.md` — leave (historical doc).
- `src/components/founders/JumpToChapter.tsx` — leave (TOC entry).

### One new entry
- Append a changelog line to `src/pages/FoundersChangelog.tsx`: "v3.1.1 — Genesis Halving deprecated from user-facing narrative; continuous 20% burn is the primary deflation mechanism. Code constants retained."

## Verification

- `rg "halving|Halving" src/components/investor/pitch/slides src/components/how-it-works src/pages/learn src/components/tokenomics src/components/founders/ScarcityOutlookSection.tsx src/components/dashboard/SatoshiMirrorFloorCard.tsx` → 0 hits.
- New file `tiered-subscriptions-flywheel.md` exists; old `tiered-subscriptions-halving-flywheel.md` removed.
- `rg "GENESIS_HALVING" src/lib/tokenomics.ts` still returns the export (technical plumbing intact).
- `bunx vitest run` (only the existing reconciliation/invariant tests we already run) → still green.
- Spot-render `/investor/pitch` Slide 09/10/13, `/learn`, and `LearnHowItWorks` at 393×587 — no broken layout, no orphaned "halving" word.

## Out of scope

- Smart-contract / on-chain halving logic.
- Removing or unmounting the `GenesisHalvingAnnouncementModal` component, `FlywheelSimulation` page, or `GENESIS_HALVING` constant.
- Archive directory files.
- `halving-schedule.md` content (only banner added).
- Wholesale rewrite of admin tokenomics pages.
