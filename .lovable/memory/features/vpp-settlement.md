---
name: VPP Settlement & Token Timing
description: Locked rule for how VPP earnings are split and when tokens vs cash hit the user — real-time tokens, monthly cash
type: feature
---

# VPP Settlement Rule (Phase 2 — Locked)

## Two earning streams, two cadences

| Stream | When | Why |
|---|---|---|
| **$ZSOLAR tokens** | Real-time, auto-minted to wallet within 30–60 sec of dispatch event ending | Instant gratification, on-chain proof, reuses Tap-to-Mint™ / DCA engine, brand-aligned |
| **Cash earnings** | Monthly, 1st of month — ACH deposit OR subscription credit | Standard utility settlement cycle, lower payment processing fees, "payday" feel |

Never batch tokens daily for VPP. Per-event minting is the locked UX.

## Per-dollar split (after aggregator cut, e.g. Leap takes ~30% of gross)

- **50% → LP injection** (preserves universal 50% rule)
- **30% → user cash** (paid monthly)
- **15% → operating revenue** (ZenSolar)
- **5% → tokens minted to user** (real-time per event)

## Launch mechanics (when Phase 2 unlocks post-seed)

- Recommended shortcut: white-label dispatch infra via **Leap Energy** in CA first ("Powered by Leap")
- OEM partner-tier API required: Tesla Energy Partner Program, Enphase Grid Services, SolarEdge VPP
- Aggregator registration with ISO/RTO needed per market (CAISO, ERCOT, etc.) — 3–9 mo each
- Capital to launch first market: $550K–$2.9M

## Patent anchor

VPP dispatch metering is a separate patent claim (added to `/founders/patent-expansion`) — owns the link between OpenADR-class grid signal + verified discharge + real-time on-chain settlement.
