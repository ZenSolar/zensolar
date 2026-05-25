---
name: Battery minting — provider priority mirrors KPI
description: mint-onchain must read battery_discharge_wh from solar device rows for Enphase/SolarEdge with tesla > enphase > solaredge priority
type: feature
---
`supabase/functions/mint-onchain/index.ts` aggregates battery deltas the SAME way as the Battery Exported KPI in `useDashboardData.ts`:

1. A device is a battery candidate if `isBatteryDevice(device_type)` OR (`isSolarDevice(device_type)` AND `battery_discharge_wh > 0`). This is required because Enphase IQ Battery and SolarEdge StorEdge merge `battery_discharge_wh` onto the solar device row (no separate battery device exists in those provider APIs).
2. After collecting candidates, apply provider priority `tesla > enphase > solaredge` and credit ONLY the chosen provider's deltas. Never sum across providers (one OEM per battery).
3. Baselines on the chosen devices are then bumped as usual.

If you add a new battery-capable provider, update BOTH this function and the `priority` array in `useDashboardData.ts` to keep mint and KPI in lockstep.
