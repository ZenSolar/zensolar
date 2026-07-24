---
name: Home Charging KPI — max, not sum
description: Tesla billing home_ac, Wallbox lifetime, and home_charging_sessions all track the SAME physical home kWh; use MAX to avoid oscillation
type: feature
---
For a Tesla plugged into a home AC charger, the same kWh is reported by:
- Tesla billing API (`home_ac_charging_kwh` / `wall_connector_kwh`)
- Wallbox lifetime (`home_charger_kwh`) if the customer uses a Wallbox
- `home_charging_sessions.total_session_kwh` (written by `tesla-charge-monitor`)

`useDashboardData.ts` MUST take `Math.max(teslaHomeAcKwh, wallboxChargerKwh, homeChargingMonitorKwh)` for `homeChargerKwh` (and mirror it for `pendingHomeCharger`). Summing them double/triple-counts and causes the KPI to jump wildly (e.g. 1,550 → 2,664) as each source refreshes async. Same rule for the Wallbox-only branch: `Math.max(wallboxChargerKwh, homeChargingMonitorKwh)`.

Mirrors the SSOT rule in `energy-log-kpi-parity.md`: Tesla vehicle is the single source of truth for charging energy when connected.
