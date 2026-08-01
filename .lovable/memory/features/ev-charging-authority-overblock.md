---
name: ev_charging authority filter is a temporary over-block
description: The mint-path rule excluding all EVSE energy when any vehicle is connected is a deliberate fail-closed placeholder, not the intended final design
type: constraint
---

`supabase/functions/_shared/issuanceAuthority.ts` currently demotes EVERY
`ev_charging` row to observer status whenever the account has any connected
vehicle. That is deliberate and stays in place for now — it is fail-closed
against double-counting the same electrons through both the car's onboard
meter and the EVSE.

**It is an over-block, not the intended rule.** A household with a Tesla and a
non-Tesla EV on a Wallbox has the entire Wallbox excluded, so the non-Tesla car
can never earn — even though nothing else measures it.

The eventual rule (section E2, the Residual Method): a charger is authoritative
only for energy that no connected vehicle accounts for. Per session, subtract
the sum of vehicle-reported charging that overlaps the EVSE session window; the
remainder is the charger's own issuable energy.

Whoever builds E2 must not inherit the blanket exclusion as the design intent.
Non-Tesla EV support is intended-but-unbuilt, gated on the OEM having a clean
open API — not out of scope.
