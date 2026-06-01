# Investor Pitch v2 — Video Feedback Pass

## Decisions locked
- **Rename:** Full global swap `Tap-to-Mint™` → `Proof of Genesis` (consumer, investor, patent copy, docs, memory).
- **Engines (new order):**
  - **01 — Monthly Subscription + Token Economics** *(combined: tokenomics powers the protocol, subscription is the access fee that funds LP + treasury)*. Tiers: $9.99 Base / $19.99 Regular / $49.99 Power. 1T cap, 75/20/3/2 split, $0.10 launch surfaced inside this engine.
  - **02 — Deason AI** — $4.99/mo **premium add-on / upgrade** on top of any base sub. Monthly Clean Energy Report, bill analysis, rate-plan optimization, device-aware advice.
  - **03 — Aggregated Energy Data** — anonymized multi-OEM telemetry to utilities, ISOs, REC registries, climate researchers.
- **Removed sections:** Founder Bios card, Schedule a Call card.
- **Contact:** Single quiet `joe@zensolar.com` mailto in the footer under The Ask. *(Heads-up: existing code uses `joe@zen.solar`; the new task says `joe@zensolar.com`. I'll use the latter as written — flag if that's a typo.)*
- **Flywheel headline:** unchanged text `Verified kWh → Data → AI → $ZSOLAR`, re-explained to map to new engine order.
- **Page flow:** Hero → Why Now → Three Revenue Engines → The Ask → Footer (mailto).

## Files to edit

**Engines + pitch surfaces**
- `src/components/investor/ThreeRevenueEngines.tsx` — rebuild card order, merge Token + Subscription into Engine 01, Deason becomes Engine 02 with "premium add-on" framing.
- `src/components/investor/pitch/slides/Slide09Revenue.tsx` — same reorder + copy.
- `src/components/investor/pitch/slides/Slide01Title.tsx`, `Slide13TheAsk.tsx` — rename pass.
- `src/pages/InvestorPitch.tsx` — rename pass, reordered engine narrative, drop Bios + Schedule sections, footer mailto.
- `src/pages/Investor.tsx` — drop Founder Bios card, Schedule a Call card from `UnlockedPanel`; keep Pitch + Live Demo + Tokenomics + Seed Pitch cards; footer mailto.

**Global rename — Tap-to-Mint™ → Proof of Genesis**
- Run `rg -l "Tap-to-Mint"` and patch every file (component copy, README, ZENSOLAR_PROJECT_SUMMARY.md, docs/*, blog/learn sections, NFT metadata strings if any, SEO meta).
- Disambiguate where Proof of Genesis already exists as the receipt page: the *action* (formerly Tap-to-Mint™) and the *receipt page* `/proof-of-genesis` both now use the "Proof of Genesis" name. Copy will read naturally ("Tap your device → Proof of Genesis receipt minted").
- Trademark line on /investor that previously listed Tap-to-Mint™ / Mint-on-Proof™ / Proof-of-Delta™ → replace `Tap-to-Mint™` with `Proof of Genesis™`.

**Memory / SSOT**
- `.lovable/memory/index.md` core block — replace `Use "Tap-to-Mint™"` with `Use "Proof of Genesis"`. Add the new engine-order rule.
- `.lovable/memory/features/investor-pitch-v2.md` — rewrite engine section: Engine 01 combines Token Economics + Subscription, Engine 02 = Deason AI add-on, Engine 03 = Aggregated Data. Note Bios + Schedule removed from /investor.
- `.lovable/memory/features/proof-of-genesis-unified-receipt.md` — add a note that "Proof of Genesis" is now also the canonical name for the *minting action* (formerly Tap-to-Mint™).
- `.lovable/memory/brand/naming.md` — log the retirement of Tap-to-Mint™ and the unified Proof of Genesis name.

**Archive flags (no delete)**
- Use the admin floating widget to flag any standalone Tap-to-Mint marketing pages for archive, per existing process.

## Out of scope
- No changes to tokenomics math, LP/round numbers, or the $5M/$20M/$7M ask.
- No changes to patent application text itself (Tap-to-Mint™ stays in the legal filing; only product/marketing copy renames).
- No new pages, no design directions, no auth/db work.

## Verification
- `rg "Tap-to-Mint"` returns zero hits outside `/legal/patent-*` and archived files.
- `/investor` post-NDA shows: Pitch v2 framing → Pitch / Demo / Seed Pitch / Tokenomics cards (no Bios, no Schedule) → mailto footer.
- `/investor/pitch` Slide 09 shows the new 3-engine order with Deason as add-on inside Engine 02.
- Memory index reflects new Proof of Genesis term + new engine rule.
