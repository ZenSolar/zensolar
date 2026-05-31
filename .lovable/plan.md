## Investor Pitch v2 — Flywheel + Three Revenue Engines + Live Multi-OEM Monitoring

Final plan with all framing decisions baked in.

### What gets built

**1. New module — `src/components/investor/ThreeRevenueEngines.tsx`**

Flywheel headline at top: **Verified kWh → Data → AI → $ZSOLAR** (color-coded, arrows between, caption below).

Three engine cards below:

- **Engine 01 · Aggregated Energy Data** (sky accent)
  - Tagline: *"Aggregated kWh data, sold to utilities."*
  - Body: Verified production/consumption/device telemetry from Tesla, Enphase, SolarEdge, Wallbox already flowing through us to power minting. **Anonymized and aggregated — never per-household PII.** High-value to utilities for load forecasting, DER visibility, rate-plan design. Secondary buyers: ISOs / RTOs, REC registries (M-RETS, WREGIS, PJM-GATS), climate researchers. **Closing line: "This dataset is only possible because we built the first unified multi-OEM monitoring layer — competitors selling utility data are locked to a single manufacturer's API."**
  - Metric: `$2B+` · U.S. utility analytics TAM

- **Engine 02 · Deason AI Home Energy Optimizer** (eco accent) — emphasized
  - Tagline: *"SaaS revenue, day one."*
  - Body: AI bill analysis, rate-plan optimization, device-aware advice. Saturday Weekly Energy Report (Gemini Pro on premium), **Monthly Clean Energy Report** after every bill cycle, **ZenHome Flow** progression (insight → action → autonomy). Primary upgrade incentive into Power tier.
  - Highlight bullets: $4.99/mo · Monthly Clean Energy Report · ZenHome Flow · $50M+ ARR at 1M subs @ 15% attach
  - Metric: `$4.99/mo` · add-on · $19.99 audit · Power $49.99

- **Engine 03 · Token Economics** (amber accent)
  - Tagline: *"LP fees + 2% treasury, on every mint."*
  - Body: 1T cap, 75/20/3/2 split, $0.10 LP-seeded launch on Base, transfer tax compounds LP + treasury perpetually.
  - Metric: `1T cap` · $0.10 launch · 75/20/3/2 · LP + treasury yield

**2. New page — `src/pages/InvestorPitch.tsx` at `/investor/pitch`**

Sections top→bottom:

1. **Top nav** — "← Investor home" + ZenSolar logo
2. **Hero** — Eyebrow "Investor Pitch · v2" → H1 "Creating Currency From Energy." → Subhead: *"The first patent-pending protocol turning verified clean-energy production into a hard-capped digital currency — built on the first-ever unified multi-manufacturer monitoring app, live today across Tesla, Enphase, SolarEdge, and Wallbox."* → 3-stat row: `$3M Strategic Seed` / `$15M Post-money cap` / `$5M Hard cap`
3. **The Catalyst** — 3 cards:
   - `$1.7T` — Annual clean-energy capex globally, nobody has tokenized the kWh itself
   - `Patent-pending` — U.S. App. 19/634,402: Tap-to-Mint™, Mint-on-Proof™, Proof-of-Delta™
   - **`First of its kind` — One app, one UI, every major OEM. Tesla + Enphase + SolarEdge + Wallbox monitoring in a single homeowner experience — live today. The data foundation the other two engines depend on.** *(replaces old "Live in beta" card)*
4. **Three Revenue Engines** — H2 "Three Revenue Engines. One Flywheel." + lead-in → renders `<ThreeRevenueEngines />`
5. **Why Us** — Joseph Maushart + Michael Tschida, ex-SolarCity, 200B pact-locked, 9 jurisdictions, OEM telemetry live, 3.34M+ kWh verified
6. **The Ask** — `$3M target · $5M hard cap · Strategic Seed (SAFE, post-money)` → bullets: $15M post cap (stretch $18–20M), milestones (mainnet TGE on Base 8453, 1K verified homes, Deason ARR live, 2nd LP tranche, Series A in 18–24mo, **+ post-launch VPP dispatch revenue: 15% of gross**), capital efficiency (37% LP / 32% team / rest audits+growth+legal) → 2 CTAs: "Enter live demo" + "Schedule a call" → walk-off: *"Bitcoin tokenized scarcity. We're tokenizing abundance."*
7. **Footer** — "ZenSolar, LLC · Austin, TX · joe@zen.solar · Confidential under NDA"

**3. Wire into `/investor`** — `src/pages/Investor.tsx`

In the post-NDA `UnlockedPanel`:
- Embed `<ThreeRevenueEngines />` inline above the unlock-card grid.
- Add new card at position 1 (Sparkles icon): "Investor Pitch · v2" → `/investor/pitch`.

**4. Routing** — `src/App.tsx`

Lazy-import `InvestorPitch`, add `<Route path="/investor/pitch">` under the existing `/investor` route.

**5. Archive flags — data, not deletions**

Insert into `page_cleanup_flags` (action=archive, status=pending, admin user id) with note "Superseded by /investor/pitch — Investor Pitch v2":
- `/founders/lyndon-pitch-v2`
- `/founders/seed-pitch-companion-deck`
- `/founders/spacex`
- `/founders/app-overhaul`
- `/founders/catchup`
- `/admin/coffee-pitch`
- `/admin/investor-pitch`
- `/admin/investor-one-pager`

Kept untouched (still cited / source-of-truth): FoundersSeedPitch, FoundersSecondaryRevenue, FoundersDeasonUtilityAI, FoundersDeasonV3, FoundersCurrentStatus, FoundersChangelog.

**6. Memory**

- New `mem://features/investor-pitch-v2.md` — documents `/investor/pitch` + `<ThreeRevenueEngines />` as canonical, locks number-SSOT rules, notes archive flags, captures the multi-OEM monitoring positioning.
- New Core line in `mem://index.md`: *"Investor pitch SSOT lives at /investor/pitch + the `<ThreeRevenueEngines />` module. Don't add net-new investor narrative pages without archiving an old one. First-of-its-kind multi-OEM monitoring (Tesla + Enphase + SolarEdge + Wallbox in one UI) is the foundational moat — surface it in every investor framing."*

### Out of scope
- No new revenue numbers / modeling — every figure traces to existing SSOT
- No PDF export (separate pass after you review the live page)
- No edits to NDA, PIN gate, tokenomics math, founder bios
- VPP gets one mention in the Ask milestones, nothing more