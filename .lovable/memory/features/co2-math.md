---
name: CO₂ avoidance math
description: Per-source CO₂ factors used on Proof-of-Genesis receipts; never re-add a flat grid-avg multiply
type: feature
---
CO₂ avoidance on every Proof-of-Genesis receipt is computed PER-SOURCE, not via a single flat grid-average multiply. Source of truth: `src/lib/co2Math.ts` (`computeCo2()`), consumed by `VerifyPoAContent.tsx`.

Factors:
- `solar_kwh`         → 0.709 kg/kWh (U.S. EIA grid avg displaced)
- `battery_kwh`       → 0.709 kg/kWh (conservative; uses grid avg, NOT peaker marginal — easier to defend, undersells real impact. Peaker-weighted upgrade is parked until hour-of-export data lands on chain.)
- `home_charging_kwh` → kWh × 3.5 mi/kWh × 0.364 kg/mi ≈ 1.274 kg/kWh (credits ICE miles avoided)
- `supercharging_kwh` → SAME as home_charging (≈1.274 kg/kWh). Tesla retires the REC so we do NOT credit the grid offset, but the driver still didn't burn gasoline — credit the ICE-miles-avoided side only.
- `ev_miles`          → 0.364 kg/mi (24.4-mpg ICE counterfactual)

Rules:
- NEVER reintroduce a single `kwh * GRID_KG_PER_KWH` calc on receipts — it double-counts Supercharging (REC already retired) and miscredits home charging (should be ICE-miles framing).
- Legacy mints with no `source_breakdown` fall back to Supercharging-only framing per the unified-receipt spec.
- If a new source key is added to `source_breakdown`, add a matching entry to `CO2_FACTORS` in `src/lib/co2Math.ts` or it will contribute 0 kg.
