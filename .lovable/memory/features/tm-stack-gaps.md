---
name: TM Stack Gap Roadmap
description: Nine-item gap roadmap covering missing consumer surfaces and verification primitives across the trademark stack
type: feature
---

# TM Stack Gaps — Roadmap

Each gap = a trademark or layer that does NOT yet have a first-class consumer surface or technical implementation.

| # | Gap | Layer | Horizon | Status |
|---|-----|-------|---------|--------|
| 1 | VerifyOnChainDrawer on every PoG Receipt | L2/L3 surface | **Phase 1 — now** | 🚧 |
| 2 | 7-char PoA hash chip on receipt face | L4 surface | **Phase 1 — now** | 🚧 |
| 3 | Per-device Proof-of-Origin™ page (`/devices/:id/origin`) | L3 surface | **Phase 1 — now** | 🚧 |
| 4 | Public `/verify/:poa` route (no auth required) | L4 surface | **Phase 1 — now** | 🚧 |
| 5 | Proof-of-Permanence™ Merkle anchor cycle viz (snapshot interval, last anchor block, next anchor ETA) | L4 surface | Phase 1.5 | ⏳ |
| 6 | Genesis Anchor™ — first-ever-mint commemorative on PoO page | L3/L5 | Phase 1.5 | ⏳ |
| 7 | Proof-of-Custody™ — device ownership transfer ledger surface | L3 | Phase 2 | ⏳ |
| 8 | Cross-platform attestation viewer (compare ZenSolar Merkle root against competitor claims) | L4 | Phase 2 | ⏳ |
| 9 | Organizational Aggregation Hub UI (commercial/fleet PoO rollup) | L3/L5 | Phase 3 | ⏳ |

## Phase definitions
- **Phase 1 (this work session):** Items 1–4. Pure UI + routing, no schema changes.
- **Phase 1.5:** Items 5–6. Requires Merkle snapshot scheduler in edge functions.
- **Phase 2:** Items 7–8. Requires `device_ownership_history` table + cross-platform proof verification edge function.
- **Phase 3:** Item 9. Requires `organizations` table + org-level role gating.
