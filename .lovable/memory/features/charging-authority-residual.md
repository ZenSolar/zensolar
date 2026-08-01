---
name: Charger authority uses the residual method (E2)
description: EVSE energy is issuable for whatever no connected vehicle accounts for; the old blanket over-block is retired
type: feature
---

The blanket rule — "any connected vehicle demotes EVERY EVSE row to observer" —
was removed on 2026-08-01. It made a non-Tesla EV on a Wallbox permanently
unearnable even though nothing else metered it.

**Current rule (E2, residual method), in
`supabase/functions/_shared/issuanceAuthority.ts`:**

- `resolveExclusions()` no longer contains any charging rule. Chargers are
  "Metered" in the cockpit even when a vehicle is present.
- `applyChargingResidual(rows, devices)` resolves charging authority PER ROW,
  per UTC day: `residual = max(0, evse_wh - vehicle_reported_wh)`.
- Rows are consumed whole, so the residual is realised by dropping whole EVSE
  rows smallest-first until the dropped total covers the vehicle-reported
  total. This is fail-closed: it can exclude slightly more than the overlap,
  never less.
- `mint-onchain` calls it after `filterIssuableRows()`. Dropped rows are not
  consumed and not credited.

Non-Tesla EV support remains intended-but-unbuilt, gated on the OEM having a
clean open API — the charger path is what lets those households earn today.

`src/test/chargingResidual.test.ts` pins the behaviour.
