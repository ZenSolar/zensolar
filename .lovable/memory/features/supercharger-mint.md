---
name: Tesla Charging Experience v2 — Phase 4 (PoG receipt + edge cases)
description: Tesla REC badge + dual CO₂ line on PoG receipt + ReceiptDrawer, third-party DC handling, L3 reserved milestones
type: feature
---

Phase 4 ships the calm receipt surfaces and locks the edge-case rules for the
Tesla Charging Experience v2.

## Receipt surfaces (live)

- `TeslaRecBadge` component renders the locked copy whenever a mint includes
  Supercharger-attributed energy (`source_breakdown.supercharging_kwh > 0`):
  - Badge: `⚡ Tesla Supercharger · 100% REC-matched clean energy`
  - Dual CO₂ line: `0.00 t via Tesla REC · X.XX t vs local grid avg`
- Mounted on:
  - `VerifyPoAContent` (the canonical /verify/:chain_hash receipt page) —
    centred, beneath `MintedForBadge`.
  - `ReceiptDrawer` (Quick-View peek) — compact variant in the header chip
    row, sized to not compete with the source pill.
- CO₂ math comes from `teslaRecCo2(kwh)` — single source of truth.

## Edge-case rules (locked)

- **Non-Tesla DC fast chargers** (`source: 'third_party_dc'`):
  - 0.5× mint multiplier applied server-side during classify (NOT in UI).
  - `SuperchargerLiveCard` renders without orange accent — uses primary token
    colour for the SOC ring, kW number, and cable glow is suppressed.
  - `TeslaRecBadge` does NOT render (no REC claim).
- **Connectivity loss**: client buffers the active session locally; the
  classify edge function is idempotent on session id, so reconnect just
  replays without double-credit. UI keeps showing the last-known kW/kWh.
- **Multi-vehicle**: `TeslaStatusCard` shows the most-recently-updated Tesla
  by `connected_devices.updated_at`. Nicknames come from
  `connected_devices.device_name`.
- **Tier-based start**:
  - Free / new users → one-tap Claim to confirm the session (no silent
    auto-start; teaches the rhythm).
  - Paid users → silent auto-start, no confirmation.
  - Source of truth: `useUserTier()`.
- **L3 Delight** is reserved for: first-ever mint, lifetime 1k kWh, lifetime
  10k $ZSOLAR. No confetti, no audio — scale-in + sparkle only.

## What did NOT change

- Mint Split v3.1 unchanged. Receipts continue to show 1 kWh = 1 $ZSOLAR (the
  user's 50% share, presented 1:1). Backend splits remain invisible.
- Loudness levels unchanged: L1 silent default; L2 only for first-ever or
  paused/resumed/error; L3 only for milestones.
- No light-mode reintroduced. Dark-mode only.
