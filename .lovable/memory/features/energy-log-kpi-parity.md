---
name: Energy Log mirrors KPI hook
description: Per-tab source-of-truth tables and provider priority for /energy-log must match useDashboardData exactly
type: feature
---
`src/hooks/useEnergyLog.ts` MUST stay in lockstep with `src/hooks/useDashboardData.ts`. Tab → source rules:

| Tab | Source table(s) | Provider priority | Daily math |
|---|---|---|---|
| Solar | `energy_production` data_type=`solar` | Enphase > SolarEdge > Tesla (one OEM, never summed) | Enphase/SolarEdge/tesla_historical = MAX per day; Tesla = day-over-day cumulative deltas |
| Battery | `energy_production` data_type IN (`battery`,`battery_discharge`) | Tesla > Enphase > SolarEdge (one OEM, never summed) | All cumulative → day-over-day deltas; tesla_historical = MAX per day |
| EV miles | `energy_production` data_type=`ev_miles` | Tesla only | tesla cumulative odometer deltas; tesla_historical = MAX per day |
| EV charging | `charging_sessions` (charging_type=supercharger) + `home_charging_sessions` (status=completed) | n/a — sum of two disjoint sources | Sum per session date |

Schema gotcha: Tesla writes `data_type='battery_discharge'`, but Enphase/SolarEdge write `data_type='battery'`. The Energy Log battery query MUST `.in('data_type', ['battery','battery_discharge'])` or it will silently miss Enphase/SolarEdge owners.

EV charging tab MUST NOT read from `energy_production` — Tesla writes both there and to `charging_sessions`, so doing so would double-count.

**Tesla vehicle skip guard (SSOT):** `fetchHomeChargingRows` in `useEnergyLog.ts` checks `connected_devices` for any `device_type IN ('vehicle','ev','tesla_vehicle')` and returns `[]` when a Tesla vehicle is present. Tesla `charge_state` is the single source of truth for charging energy whenever the vehicle is connected; reading `home_charging_sessions` in parallel would credit the same charge twice (Wallbox / third-party charger reports the same kWh the vehicle does). Mirrors `pickSource('charging', …)` in `src/lib/dataSourcePriority.ts`.

If you add a new battery- or solar-capable provider, update both this hook AND `useDashboardData.ts` (and the priority arrays in `mint-onchain/index.ts`).
