# Remix Manifest v2 — Refined Production App (3-Pillar Build)

**Supersedes** `REMIX_MANIFEST.md` (v1) for structural intent. v1 route/edge-function lists still apply where unchanged.

## North Star
The remix ships exactly **three customer-facing products**, each with a dedicated top-level surface in the bottom nav. Everything else is supporting infrastructure (auth, wallet, settings, receipts).

---

## The Three Pillars (from /investor due-diligence)

### Pillar 1 — Clean Energy Center (CEC)
**What it is:** The home screen. Live multi-OEM energy flow + Tap-to-Mint™ + today's $ZSOLAR + balance + Proof-of-Genesis receipt drawer.
**Why it's #1:** It's the engine the entire token economy rests on. Investor framing = "Verified kWh → $ZSOLAR." This is where verified kWh becomes currency.
**Remix routes:** `/app` (CEC home), `/app/mint` (history), `/app/proof-of-genesis/:mintId` (unified receipt — SSOT per `proof-of-genesis-unified-receipt` memory).
**Core components:** `EnergyFlowCard`, `TapToMintButton`, `MintReceiptDrawer`, `ProofOfGenesisPage`. Tokenomics SSOT = `src/lib/tokenomics.ts` (50/25/20/5, locked).
**Economics enforced:** UI shows **1 kWh = 1 $ZSOLAR** (user's 50% share). Backend mints raw 100% and splits per v3.1. Sepolia at launch (chain 84532) → flip to Base mainnet via `VITE_CHAIN_ENV`.

### Pillar 2 — Deason AI (Home Energy Optimizer + Chat)
**What it is:** Premium AI add-on ($4.99/mo on top of any sub tier). Bill analysis, rate-plan optimization, device-aware advice, Monthly Clean Energy Report. Conversational chat interface.
**Why it's #2:** Investor Engine 01 upgrade path. The ONLY reason a Regular-tier customer upgrades to Power — turns subscription into recurring value, not just an access fee.
**Remix routes:** `/app/deason` (chat + insights home), `/app/deason/reports` (monthly reports archive), `/app/deason/upload` (bill/document drop).
**Core components (new, build fresh):** `DeasonChatWindow` (AI Elements composition per `chat-ui-composition` directive — assistant has no bg, user bubble = primary/primary-foreground, real domain logo not Sparkles), `DeasonInsightsPanel`, `MonthlyReportCard`, `BillUploadDrop`.
**Backend:** Lovable AI Gateway via Edge Function `deason-chat` (streaming `useChat` + thread routing per `chat-agent-ui-contract`). Reuse tables `deason_threads` / `deason_messages` / `deason_documents` / `deason_monthly_reports` / `deason_insights`. **Storage choice = ASK USER before building** (threaded vs single, DB vs localStorage).
**Edge functions to bring over:** `deason-chat` (new, streams via Gemini 3 flash), `analyze-bill`, `generate-energy-insights-report`, `onboarding-concierge` (Deason concierge variant). These were in the v1 "drop" list — **promote them back** for the remix.
**Economics enforced:** Hard paywall on premium add-on — gate via `useSubscription` + `useDeasonEntitlement`. Free tier = read-only insights, no chat.

### Pillar 3 — Zen Monitoring Cockpit (Multi-OEM Live Telemetry)
**What it is:** First-of-its-kind unified cockpit showing Tesla + Enphase + SolarEdge + Wallbox in one UI. Per-device deep-dive, health, historical, real-time signals.
**Why it's #3:** The **foundational moat** (per `investor-pitch-v2` memory). Both Pillar 1 and Pillar 3 depend on its data layer. Without this, there is no minting and no aggregated-data revenue engine.
**Remix routes:** `/app/cockpit` (overview — all OEMs at a glance), `/app/cockpit/:deviceId` (per-device drill-down), `/app/devices` (manage/add/remove — same shell as v1 manifest).
**Core components:** `CockpitOverview`, `OEMStatusGrid` (Tesla/Enphase/SolarEdge/Wallbox tiles), `DeviceTelemetryChart`, `DeviceHealthCard`, `DataSourceOfTruthBadge` (per `data-source-of-truth` memory — one OEM owns each capability to prevent double-counting).
**Edge functions:** All `*-auth`, `*-data`, `*-devices` per v1 list. Add `tesla-fsd-sampler` (just made FSD work — must come). Add `tesla-historical` for the per-device drill-down chart.
**Economics enforced:** Cockpit access is the **subscription value-prop** ($9.99 base unlocks it). Free trial = 7-day cockpit access then paywall.

---

## Refined Bottom Nav (5 tabs, mobile-first)
1. **Home** → `/app` (Clean Energy Center)
2. **Deason** → `/app/deason` (AI optimizer + chat)
3. **Mint** → `/app/mint` (history + balance peek)
4. **Cockpit** → `/app/cockpit` (multi-OEM monitoring)
5. **More** → wallet, devices, referrals, profile, settings, help

Updates `bottomNavRoutes` in `routes.config.ts` — replaces the current Home/Mint/Wallet/Devices/More layout to put Deason and Cockpit on equal footing with Mint.

---

## Updated Economics (carry into remix at v3.1 lock)
- Mint split: **50% user / 25% LP / 20% burn / 5% treasury** (sums to 100%).
- Separate **3% transfer tax** → LP only.
- Subscription tiers: **$9.99 Base / $19.99 Regular / $49.99 Power**. Each $ → 50% LP / 50% treasury.
- Deason add-on: **+$4.99/mo** on any tier.
- Mint ratio: 10 kWh = 1 $ZSOLAR (raw); UI shows 1:1 via 50% user share.
- Launch price: **$0.10 USDC LP-seeded** on Base. Sepolia until production gate.
- 1T hard cap, continuous 20% burn (Genesis Halving deprecated narrative-wise; constant kept in code for optional re-activation).

---

## Edge Functions — Delta from v1 Manifest
**Promote back into remix (v1 dropped these, v2 keeps them):**
- `deason-chat` (new — streaming Lovable AI)
- `analyze-bill` (Deason)
- `generate-energy-insights-report` (Deason monthly reports)
- `onboarding-concierge` (Deason variant only — drop the investor concierge variant)
- `tesla-fsd-sampler` + `tesla-historical` (Cockpit drill-down + FSD mile accrual)
- `tesla-telemetry-config` (needed for FSD webhook subscription mgmt)

**Still dropped:** all `admin-*`, `investor-*`, `founders-*`, `vault-*`, `deck-*`, `cheetah-*`, `starlink-*`, `notify-vip-*`, weekly digest functions.

Net edge-function count: ~30 (vs v1's ~25, vs lab's 80).

---

## DB Tables — Delta from v1 Manifest
**Add back for Pillar 2 (Deason):** `deason_threads`, `deason_messages`, `deason_documents`, `deason_doc_analyses`, `deason_monthly_reports`, `deason_insights`, `deason_usage`, `deason_weather_cache`.
**Add back for Pillar 3 (Cockpit):** `device_telemetry_cache`, `oem_diagnostic_log`, `home_charging_sessions`, `charging_sessions`, `bidirectional_mint_events`.
**Stripe entitlement:** keep `energy_subscriptions` (already in v1 list) — add a `deason_premium` flag/column or separate row.

---

## Open Decisions Before Remix Build Starts
1. **Deason chat shape** (threaded vs single conversation; DB-backed vs localStorage) — must answer per `chat-agent-ui-contract` before writing chat UI.
2. **Cockpit free-trial** length (7-day? 14-day?) and what's visible pre-paywall (full data? read-only flow only?).
3. **Bottom-nav order** — confirm Deason at slot 2 (vs Cockpit at 2). Recommend Deason because it's the upgrade lever.
4. **Onboarding flow** — does new user land on `/onboarding` → connect OEMs → CEC, or new user lands on a 3-pillar tour first?

---

## Status
**Build status:** Not yet — remix project not created. Per `remix-transition` memory, holding generation of new prep artifacts after this doc until the remix project exists. This v2 manifest + v1 manifest + `routes.config.ts` are the complete handoff package.
