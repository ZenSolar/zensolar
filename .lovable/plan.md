## Strengthen "Why Us" on /investor/pitch

Rewrite the single Why Us section in `src/pages/InvestorPitch.tsx` to correct Michael Tschida's background and reframe the duo as childhood best friends with complementary strengths.

### Corrections to bake in
- Michael Tschida is **not** ex-SolarCity. (Joseph is.)
- Michael is a **top-10% State Farm agent nationwide**, **President's Club every year** as a top producer.
- Michael's strong suit: **math, investments, capital allocation, economics** — stronger than Joseph's in those domains.
- Frame: **childhood best friends**, decades of trust, complementary skills, building this together to change the world.

### New section copy

**Eyebrow:** Why Us

**Lead paragraph:**
> ZenSolar is built by **Joseph Maushart and Michael Tschida** — childhood best friends, now co-founders. Two operators who've spent a lifetime sharpening complementary edges of the same problem, and have pact-locked 200B $ZSOLAR between them to build it out together.

**Two-column "complementary edges" cards:**

- **Joseph Maushart — Protocol, Product, Distribution**
  - Ex-SolarCity. Built the live multi-OEM monitoring app (Tesla, Enphase, SolarEdge, Wallbox).
  - Patent-pending Tap-to-Mint™ author. 9-jurisdiction legal posture, 3.34M+ verified kWh shipped.
  - Owns: protocol, product, energy verification, GTM.

- **Michael Tschida — Capital, Math, Economics**
  - **Top 10% State Farm agent nationwide**, **President's Club every year** as a top producer.
  - Deep expertise in **investment strategy, capital allocation, and applied economics** — sharper than Joe's in those domains by design.
  - Owns: token economics math, capital deployment discipline, investor relations.

**Closer line (italic, centered):**
> Childhood best friends. Two complementary operators. One mission: turn every clean kWh into a hard-capped currency, and change how the world prices energy.

### Below the cards (kept, lightly tightened)
Trust strip stays as three bullets:
- Tesla, Enphase, SolarEdge, Wallbox OEM monitoring live in production.
- Patent-pending Tap-to-Mint™ protocol filed with the USPTO.
- Embedded Coinbase Wallet, Reown AppKit, Base L2 — no MetaMask friction.

### Technical scope
- Edit only the Why Us `<section>` in `src/pages/InvestorPitch.tsx` (lines ~117–148).
- Add no new components, no new icons beyond what's already imported (reuse existing layout patterns; may add `User` / `Calculator` from lucide-react for the two cards).
- No edits to `ThreeRevenueEngines`, hero, ask, or footer.
- No edits to `mem://features/investor-pitch-v2.md` — Why Us copy isn't an SSOT rule.
- No new memory entry; the existing Core rule on founders already locks identity.

### Out of scope
- Other pages that mention Michael (founder bios elsewhere, FoundersTschida, hub cards). Surgical fix is /investor/pitch only — flag if you want a sweep next.