## Goal

Tear down the Jo Fertier brief (page + PDF + route + hub card) and replace it with **three focused, scrollable founder pages** — one per question. Web-only for now; PDFs come later when content is locked. Lyndon one-pager edits = separate next task.

## Step 1 — Delete the Jo brief

- Delete `src/pages/FoundersJoBrief.tsx`
- Delete `public/founder-docs/jo-fertier-prebrief-v1.pdf`
- Remove the route from `src/App.tsx` (lazy import + `<Route path="/founders/jo-brief" ...>`)
- Remove the "Jo Fertier — Lyndon Brief" card from `src/components/founders/HubCardList.tsx`

## Step 2 — Build three new founder pages

All three follow the same pattern: gated by `<FounderRoute>`, mobile-first, semantic tokens only, header strip with back-to-Vault link, and a hub card on the Founders Vault landing.

### Page 1 — Competitive Landscape
- Route: `/founders/competitive-landscape`
- File: `src/pages/FoundersCompetitiveLandscape.tsx`
- Hero: "Why we're not SolarCoin (or anyone else)"
- Sections:
  1. **Comparison table** — ZenSolar vs SolarCoin, GridPay, Power Ledger, C+Charge, DeCharge, PowerPod (sourced from existing `AdminCompetitiveIntel.tsx` competitor data)
  2. **Three reasons we're different** — Verification, Supply, Moat (cards)
  3. **Per-competitor deep-dive cards** — one card each: what they do, where they fall short, our wedge
  4. **Category validation** — GridPay launching March 2026 proves the category is real; our nationwide multi-vertical scope is the moat
- Refactor: pull the `competitors` array out of `AdminCompetitiveIntel.tsx` into `src/data/competitors.ts` so both pages use one source

### Page 2 — The Ask
- Route: `/founders/the-ask`
- File: `src/pages/FoundersTheAsk.tsx`
- Hero: the v8.1 verbatim line — "Board seat — co-shape the tokenized energy economy from day one."
- Sections:
  1. **What we're asking for** — board seat (not capital). Big highlight card.
  2. **Why a board seat instead of a check** — Lyndon's operator credibility + SolarCity/Tesla network unlocks utility partnerships and OEM rails faster than money
  3. **What we offer in return** — early board influence on a category-defining protocol; equity terms TBD with him
  4. **What we're not asking for** — explicit "not raising from Lyndon" framing (avoids confusion with the $5M seed ask)
  5. **Cross-link** to `/founders/seed-ask` for the separate $5M lead-investor conversation

### Page 3 — Current Status (Live & Building)
- Route: `/founders/current-status`
- File: `src/pages/FoundersCurrentStatus.tsx`
- Hero: "We're not pitching a deck. We're shipping."
- Sections:
  1. **Live on Base L2** — contract address, real $ZSOLAR token, real on-chain mints (link to BaseScan if address available)
  2. **Live product** — beta.zen.solar, embedded Coinbase Wallet, Tap-to-Mint™ working today
  3. **Beta users** — pull live count from `useBetaMetrics` hook if available; otherwise show qualitative ("active beta users across solar/EV/battery"). Will not fabricate numbers.
  4. **OEM rails live** — Tesla ✓ · Enphase ✓ · Wallbox ✓ · SolarEdge (code-ready). Real production data flowing for Joseph, Tschida, Pessah, Golson.
  5. **IP filed** — SEGI™ provisional patent (Q1 2025) + 5 trademarks (Mint-on-Proof™, Proof-of-Delta™, Proof-of-Origin™, Proof-of-Genesis™, Tap-to-Mint™) + Device Watermark Registry on-chain spec
  6. **What's next** — short bulleted roadmap pulled from existing memory (mainnet launch tranches, Genesis Halving, Deason AI Phase 1)

## Step 3 — Founders Vault hub cards

Add three cards to `src/components/founders/HubCardList.tsx`, grouped together near the top so Joseph/Michael can hand-pick which to send Jo:

| Card | Eyebrow | Tone | Icon |
|------|---------|------|------|
| Competitive Landscape | "Pre-Meeting · Q1" | primary | Shield |
| The Ask | "Pre-Meeting · Q2" | amber | Banknote |
| Current Status | "Pre-Meeting · Q3" | eco | Activity |

## Out of scope

- No PDF generation (per your call: "Pages now, PDFs later")
- No edits to the v8.1 Lyndon one-pager (separate next task — you'll send the change list)
- No new business logic, no DB changes, no auth changes
- No fabricated metrics — anything not in the codebase or memory gets shown qualitatively or omitted
