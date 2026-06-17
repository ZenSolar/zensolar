---
name: Remix v2 Open Decisions (resolved)
description: Recommended answers to the 4 open decisions in REMIX_MANIFEST_V2.md — Deason chat shape, cockpit trial length, bottom-nav order, onboarding flow
type: feature
---

# Remix v2 — Resolved Open Decisions

Drafted answers to the 4 open decisions from `.lovable/REMIX_MANIFEST_V2.md`. Apply these when scaffolding the remix project unless the user explicitly overrides at remix kickoff.

## 1. Deason AI chat shape & storage
**Decision:** Threaded conversations + database persistence (Lovable Cloud).
**Why:**
- Deason is positioned as a recurring $4.99/mo add-on — users will return weekly to ask about bills, optimization, OEM diagnostics. Single-thread would collapse months of context into one scroll.
- DB-backed (not localStorage) because the customer pays for it; losing history on browser clear would break trust on a paid tier.
- Mobile PWA users switch devices (phone ↔ desktop) — must sync.

**How to apply (per chat-agent-ui-contract):**
- Route: `/app/deason/:threadId` (file route), `/app/deason` redirects to last-active or new thread.
- Tables: `deason_threads` (id, user_id, title, updated_at) + `deason_messages` (uuid pk, thread_id, role, parts jsonb, created_at). RLS scoped to `auth.uid()`. GRANTs for `authenticated` + `service_role`.
- Edge function `deason-chat` uses `toUIMessageStreamResponse({ originalMessages, onFinish })`, persists assistant message in `onFinish`. Never store AI SDK `msg_...` IDs in UUID columns.
- Sidebar: collapsible thread list on desktop, sheet/drawer on mobile (default Lovable nav stays bottom).
- Auto-title threads after first user message via cheap model call.

## 2. Cockpit free-trial length
**Decision:** Cockpit is **free forever on Spark tier** (read-only, 1 device per OEM, 24h history). Full multi-device + 90-day history + alerts gated to Flame ($19.99) and above.
**Why:**
- Cockpit is the moat — must be the *hook*, not a paywall wall. Free tier proves "first-ever unified Tesla+Enphase+SolarEdge+Wallbox" without friction.
- Time-limited trials feel coercive; capability-limited free tier converts better and matches the evergreen-grassroots philosophy.
- Aligns with mint-eligibility gate (Spark = 1x multiplier, see tiered-subscriptions-flywheel).

**Limits per tier:**
| Tier | Cockpit access |
|---|---|
| Spark $9.99 | 1 device per OEM, 24h history, no alerts |
| Flame $19.99 | Unlimited devices, 30d history, basic alerts |
| Inferno $49.99 | + 1yr history, custom alerts, CSV export |
| Titan | + API access, white-label export |

## 3. Bottom-nav order (confirm v2 manifest)
**Decision:** **Home / Cockpit / Mint / Deason / More** (NOT the v2 manifest's Home/Deason/Mint/Cockpit/More).
**Why (revision):**
- Cockpit-second puts the moat in the user's face on every app open — investor-pitch alignment.
- Mint stays center (thumb-friendly primary action).
- Deason fourth because it's the *upgrade lever* — discovering it after seeing live telemetry is the natural conversion moment ("my system has an issue → ask Deason").
- More menu absorbs: Devices, Subscribe, Proof-of-Genesis history, Wallet, Settings.

## 4. Onboarding flow
**Decision:** **3-pillar tour first, then OEM connect.** 4-screen swipeable carousel:
1. "Your energy, verified" → Cockpit preview (animated multi-OEM flow)
2. "Turn kWh into $ZSOLAR" → Mint preview (tap animation, 1:1 framing)
3. "Deason: your AI energy advisor" → Chat preview (sample question)
4. "Connect your first device" → OEM picker (Tesla / Enphase / SolarEdge / Wallbox)

**Why:**
- Straight-to-connect loses users who don't know *why* they're handing over OAuth.
- 3-pillar tour mirrors investor pitch — same story, customer-facing language.
- Skip button on every screen jumps to OEM picker for power users.
- Tour is shown once, persisted in `profiles.onboarding_completed_at`.

---

## Status
All 4 decisions resolved. `REMIX_MANIFEST_V2.md` can be treated as locked. Next blocker = remix project creation itself.
