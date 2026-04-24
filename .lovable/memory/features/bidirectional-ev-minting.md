---
name: Bi-Directional EV Minting (Phase 3)
description: V2G/V2H/V2L + FSD miles tokenization roadmap and patent claim
type: feature
---

# Bi-Directional EV Minting — Phase 3 Mintable Surface

**Status:** Patent claim filed (or in queue with counsel). App feature deferred to Phase 3 (post-VPP / post-mainnet maturity). NOT in immediate launch scope.

## Mintable Flows
- **V2G** — Vehicle-to-Grid (EV → utility) — highest grid value
- **V2H** — Vehicle-to-Home (EV → residence backup/peak shaving)
- **V2L** — Vehicle-to-Load (EV → external device)
- **FSD autonomous miles** — adjacent claim, treated as a distinct mint event class

## Patent Strategy
- **File now, ship later.** Priority date is what matters.
- Dependent claims off existing Proof-of-Delta™ + Proof-of-Origin™ method.
- **Killer claim:** the *separation method* — distinguishing import vs export kWh in a single bi-directional session and tokenizing them as **two independent mint events**.
- Claim ref: `ZSOLAR-BIDIR-V1`
- Internal page: `/founders/patent-expansion` (founder-gated + PIN)
- Never publish technical claim language publicly until counsel confirms filing.

## Implementation Anchor
- Table: `public.bidirectional_mint_events`
  - `direction` ∈ {import, export}
  - `flow_type` ∈ {charge, v2g, v2h, v2l}
  - `session_id` links related events from the same physical session
  - `patent_claim_ref` defaults to `ZSOLAR-BIDIR-V1`
- Backed by RLS (user-owned) — admins/editors/viewers read all.
- Schema-only today; no UI consumes it. Reduces patent claim to practice.

## Why It Matters
- Hardware already shipping: Ford Lightning, Cybertruck, GM Ultium, Hyundai/Kia E-GMP.
- Tesla V2G committed for 2026.
- When V2G APIs land, plug directly into existing Proof-of-Delta engine — no re-architecture.
- Total mintable surface becomes **9 distinct event types** (5 Phase 1 + 4 Phase 3).
- Pairs with FSD miles to form the "Tesla as yield-bearing asset" thesis.

## Tier Pairing (when shipped)
- Bi-directional minting earns a **1.5x multiplier** vs unidirectional (V2G has higher grid value).
- Will be an **Elite-tier** feature when launched.

## Do Not
- Do not build UI for this in Phase 1 or Phase 2.
- Do not publish claim text publicly.
- Do not conflate with VPP enrollment (separate Phase 2 program).
