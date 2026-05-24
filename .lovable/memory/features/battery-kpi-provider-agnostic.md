---
name: Battery Exported KPI — provider-agnostic
description: Tesla, Enphase, and SolarEdge batteries all flow into battery_discharge_wh
type: feature
---
Battery Exported KPI is fed by `connected_devices.lifetime_totals.battery_discharge_wh` summed across all providers.

- **Tesla Powerwall**: `tesla-data` writes lifetime via Owner API battery_discharge field.
- **SolarEdge StorEdge / Home Battery**: `solaredge-data` calls `/site/{siteId}/storageData` (7-day window) and uses the latest `lifeTimeEnergyDischarged` Wh per battery (cumulative, monotonic).
- **Enphase IQ Battery / Encharge**: `enphase-data` calls `/systems/{id}/telemetry/battery` incrementally using `extra_data.battery_last_sync_at` as the dedup marker, accumulating window `discharge` into lifetime.

All three write a Proof-of-Delta™ row to `energy_production` with `data_type='battery'`. KPI hook (`useDashboardData`) is already provider-agnostic — no frontend changes needed when adding new battery providers.
