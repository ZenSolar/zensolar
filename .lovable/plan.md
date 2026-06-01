## Investor Pitch v2 — Corrections Pass (revised)

Targeted fixes only. No new sections, pages, or numbers.

### 1. Trademark naming — keep Proof-of-Genesis™ as the IP cornerstone
Proof-of-Genesis™ stays as the primary, top-line product/IP term across consumer, investor, and patent surfaces (as it is now after last turn). **Tap-to-Mint™ is brought back only where it's specifically relevant** — i.e. when describing the *user gesture* of tapping a device to trigger a mint, or in the patent/trademark roadmap copy that enumerates the IP stack.

Where Tap-to-Mint™ comes back (selectively):
- `src/pages/Glossary.tsx`, `src/pages/learn/LearnGlossary.tsx`, `src/components/learn/sections.tsx` — restore Tap-to-Mint™ as a defined term alongside Proof-of-Genesis™.
- `src/components/ui/jargon-tip.tsx` — restore Tap-to-Mint™ tip entry.
- `.lovable/memory/features/trademark-roadmap.md` and `tm-stack-visualization.md` — restore Tap-to-Mint™ as a listed mark in the stack.
- `src/components/demo/TapToMintCard.tsx` and any consumer gesture/CTA copy that literally references the tap action — restore "Tap-to-Mint™" label on the gesture itself, while surrounding narrative still credits Proof-of-Genesis™ as the protocol.
- Patent/legal references (already untouched).

Everywhere else — investor pitch narrative, hero copy, emails, dashboard footer, onboarding, mint-receipt hints, sidebars, whitepaper, founders pages, SubscriptionConfirmation, mint sound hook strings, Auth/Pulse copy — **leaves Proof-of-Genesis™ in place** (no revert).

Approach: `rg -n "Proof of Genesis"` to enumerate; walk the list and only touch the files above. Standardize the mark as `Proof-of-Genesis™` (hyphenated, with ™) on primary mentions; bare "Proof of Genesis" is fine in body prose.

### 2. Reorder Three Revenue Engines
Update `src/components/investor/ThreeRevenueEngines.tsx` and `src/components/investor/pitch/slides/Slide09Revenue.tsx`:

- **Engine 01 — Monthly Subscription + Deason AI.** Base sub required to be a ZenSolar user and mint tokens. Tiers $9.99 / $19.99 / $49.99. Deason AI = $4.99/mo premium add-on (Monthly Clean Energy Report, bill analysis, rate-plan optimization, device-aware advice).
- **Engine 02 — Token Economics.** Core product and primary long-term revenue driver. 1T hard cap, 75/20/3/2 mint split, $0.10 LP-seeded launch on Base, 7% transfer tax (3% burn / 2% LP / 2% treasury). Quantify revenue potential from transfer-tax volume + treasury yield using only numbers already in the codebase — invent no new figures.
- **Engine 03 — Aggregated Energy Data.** Anonymized multi-OEM telemetry to utilities, ISOs, REC registries, climate researchers. Unchanged.

Flywheel headline stays `Verified kWh → Data → AI → $ZSOLAR`; re-explain mapping under the new order.

### 3. Founder contact
Footer mailto under The Ask uses **`joe@zensolar.com`** on both `/investor/pitch` (`InvestorPitch.tsx`) and `/investor` (`Investor.tsx`). No other contact UI.

### 4. Reconcile seed-ask memory
`.lovable/memory/index.md` core still says "Seed ask scaling toward ~$10M pending Greg feedback". Replace with: `Seed ask: $5M target · $20M post-money · $7M hard cap (SAFE, post-money).` Confirm `.lovable/memory/features/fundraising-strategy.md` matches; align if drifted.

### Memory updates
- `.lovable/memory/brand/naming.md` — rewrite the "Retired terms" block: Proof-of-Genesis™ is the primary IP cornerstone term; Tap-to-Mint™ is **not retired**, it stays in scope but is used only where the literal tap gesture or the patent/trademark stack is being described.
- `.lovable/memory/features/investor-pitch-v2.md` — update engine block to the new 01/02/03 order; keep Proof-of-Genesis™ as the primary mark used in pitch copy.
- `.lovable/memory/features/proof-of-genesis-unified-receipt.md` — note Proof-of-Genesis™ is both the receipt layer and the primary IP cornerstone; Tap-to-Mint™ refers specifically to the gesture.
- `.lovable/memory/index.md` core — update the "Use Tap-to-Mint™" line to: `Primary IP term is "Proof-of-Genesis™". Use "Tap-to-Mint™" only when describing the literal tap gesture or the trademark stack.` Fix seed-ask line per §4. Add engine-order rule.

### Out of scope
- No new pages, sections, design directions, or numbers.
- No edits to tokenomics math or the $5M/$20M/$7M ask itself.
- No changes to archived pages.

### Verification
- `rg "Tap-to-Mint"` returns hits only in glossary/learn/jargon-tip, trademark memory files, the TapToMintCard gesture component, and legal/patent docs.
- Investor pitch, emails, dashboard, onboarding, whitepaper, founders pages still read Proof-of-Genesis™.
- `/investor/pitch` Slide 09 engines: Subscription+Deason / Token Economics / Aggregated Data.
- Footer mailto = `joe@zensolar.com` on `/investor` and `/investor/pitch`.
- Memory index seed-ask line reads $5M / $20M / $7M.
