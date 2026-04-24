---
name: Proof-of-Genesis Receipt — CO₂ + EV Math
description: Context-aware CO₂ framing per source and EV-miles token formula for receipts
type: feature
---
**EV mint math** (canonical):
- 1 $ZSOLAR per mile driven, then × 0.75 user share (20% burn / 3% LP / 2% treasury).
- kWh equivalent for display: miles ÷ 3.0 mi/kWh (Tesla Model Y/3 baseline).

**Receipt CO₂ framing — context-aware per primary source:**
- `ev_charging` → "Gasoline Avoided" in gallons + kg CO₂ avoided vs ICE (24.4 mpg, 8.887 kg CO₂/gal).
- `solar` / `battery` / `mixed` → "Grid CO₂ Displaced" in kg (0.709 kg CO₂/kWh, U.S. EIA grid avg).

**Always include "vs. Bitcoin Proof-of-Work" chip:**
- Every mint is 1 on-chain tx → compare to ~707 kg CO₂/BTC tx (Cambridge CCAF / Digiconomist).
- Anchors Proof-of-Genesis™ as the regenerative inverse of PoW.

**Hero stat rule:**
- EV mint → "Miles Driven" as the primary unit (kWh shown as footnote).
- Solar/battery/mixed mint → "Verified Energy" in kWh.
