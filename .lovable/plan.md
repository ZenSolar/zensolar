
# Tesla Charging Experience v2 — Phased Production Build

Split into 4 phases so each is independently shippable, testable, and billable. You approve phase-by-phase.

---

## Phase 1 — Foundations (data + primitives)

**Goal:** Schema, hooks, and shared utilities. No visible UI yet.

- Supabase migration:
  - `charging_sessions.source` enum: `home | wallbox | supercharger | third_party_dc`
  - `charging_sessions.site_id`, `clean_claim` (`self_produced | tesla_rec | unknown`)
  - `supercharger_sites` table (id, name, lat/lng, address) + GRANTs + RLS
  - `profiles.first_supercharger_at`, `profiles.first_home_charge_at` (for one-time L2)
- New hooks/libs:
  - `useActiveChargingSession.ts` — unified active session (home / wallbox / supercharger)
  - `useUserTier.ts` — free vs paid (drives auto-start vs tap-to-claim)
  - `useMintLoudness.ts` — returns `L1 | L2 | L3` per event using rules in `mem://features/minting-loudness-levels.md`
  - `useTeslaVehicleStatus.ts` — SOC, range, charging_state, fast_charger_brand
  - `co2Math.ts` extension: `teslaRecCO2()` returns 0 + grid-avg comparator
  - `originVerification.ts` extension: `supercharger` + `tesla_rec` claim
- Edge function: `classify-charging-session` (POI lookup, brand detect, writes source/site_id/clean_claim)
- Memory files: `mem://features/supercharger-mint.md`, `mem://features/minting-loudness-levels.md`
- Unit tests for loudness rules, classifier, CO2 math

**Out of scope this phase:** any UI changes.

---

## Phase 2 — SuperchargerLiveCard + Tesla Status Card (calm visual layer)

**Goal:** Premium calm UI for active Supercharger sessions, plus persistent Tesla Status Card.

- `SuperchargerLiveCard.tsx`:
  - Muted header `Supercharging • live` (small, low-contrast), tiny status dot
  - Bold kW number with **soft orange glow only on the number** (no card-wide accent)
  - Thin SOC ring, single quiet `$ZSOLAR minting` line
  - Muted italic `↳ Strengthening LP for all holders`
  - Subtle orange cable glow on the connector icon
  - Buttons (small, secondary): `[View Progress] [Pause] [Done]`
  - No particles, no audio, no pulsing on default
- `SuperchargerDetailSheet.tsx`: opt-in deeper view from `View Progress`
- `TeslaStatusCard.tsx`: compact card shown below main card whenever a Tesla is connected — SOC ring, range (mi/km per pref), status pill (`Idle | Charging | Driving`). Always visible when vehicle linked, regardless of active session.
- Mount logic in Clean Energy Center / Dashboard
- Storybook-equivalent demo route under existing demo fixture; investor demo mode wiring

**Depends on:** Phase 1.

---

## Phase 3 — Home charging silent line + Loudness Banner system

**Goal:** Almost-invisible home charging surface, plus the L2 banner used for first-time and exceptions.

- `SilentChargingStatus.tsx`: thin one-liner `● Home charging • accruing silently` inside Clean Energy Center. No card, no toast, no card takeover.
- `SuperchargerBanner.tsx` (L2): thin semi-transparent top banner, 8s auto-dismiss, no sound. Used for:
  - First-ever Supercharger session
  - First-ever home charging session (single message: `This is the rhythm.`)
  - Paused / resumed / classifier error
- One-time gating via `profiles.first_supercharger_at` / `first_home_charge_at` — guaranteed to fire once per user, then never again (Phase 1 schema).
- Repeat sessions at known sites → strict L1 (no banner, no toast, no card growth).
- KPI cards animate value changes only (no celebration on normal accrual).

**Depends on:** Phase 1.

---

## Phase 4 — PoG receipt integration + edge cases + polish

**Goal:** Make the receipt and edge behaviors production-grade.

- PoG unified receipt additions:
  - Badge: `⚡ Tesla Supercharger · 100% REC-matched clean energy`
  - Dual CO₂ line: `0.00 t via Tesla REC · vs local grid avg X.XX t`
  - `source` + `clean_claim` surfaced in receipt metadata; share link unchanged
- Edge cases:
  - Non-Tesla DC fast chargers → `third_party_dc`, 0.5× mint, no orange accent
  - Connectivity loss → local buffer, reconcile on reconnect
  - Multi-vehicle nicknames in card header
  - Pause/resume preserves `session_id`
- Tier-based start behavior:
  - Free/new → require one-tap Claim to start mint
  - Any paid → silent auto-start (no toast under L1)
- L3 Delight reserved strictly for: first-ever mint, 1k kWh, 10k $ZSOLAR. Scale-in only, no confetti.
- Tests: loudness matrix, first-time gating, classifier edge cases, receipt snapshot.

**Depends on:** Phases 1–3.

---

## Locked rules (apply across all phases)

- Mint Split v3.1 unchanged. UI always shows 1 kWh = 1 $ZSOLAR (50% share, 401(k)-match framing). Backend reconciles on raw 100%.
- No crypto jargon. "Strengthening the LP" everywhere.
- Dark-mode only. Mobile-first 390×844. Existing design tokens; no hardcoded colors.
- No audio anywhere in this feature.

---

## Suggested approval flow

Approve phases individually. Each phase ends with a working, deployable slice and its own bill. Reply with which phase(s) to start, or "all" to proceed sequentially.
