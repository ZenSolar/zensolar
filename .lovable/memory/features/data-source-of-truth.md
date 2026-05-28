---
name: One OEM per capability (data source of truth)
description: Hard rule — every KPI in the Clean Energy Center pulls from exactly ONE OEM endpoint per user. Never sum across OEMs for the same metric.
type: feature
---

# Hard rule: ONE OEM per capability per user

For any given user, each KPI category must pull from **exactly one** OEM API. Never sum or merge the same metric across providers — that double-counts kWh.

## Per-capability priority (when user has multiple providers connected)

| Capability | Allowed sources | Priority order | Why |
|---|---|---|---|
| **Solar production** | Tesla, Enphase, SolarEdge | Enphase > SolarEdge > Tesla | Inverter-side OEMs are the authoritative producer; Tesla solar data is derived from Powerwall site telemetry |
| **Battery (export/discharge)** | Tesla Powerwall, Enphase IQ Battery (Encharge), SolarEdge Home Battery | Tesla > Enphase > SolarEdge | Whichever battery hardware the user actually owns is the only valid source — if they own an Enphase IQ Battery, pull from Enphase, NOT Tesla |
| **EV miles driven** | Tesla Fleet API only | Tesla | Only OEM we have vehicle integration with today |
| **EV charging — supercharger** | Tesla Fleet API (`charging_sessions` table, `charging_type='supercharger'`) | Tesla | n/a |
| **EV charging — home** | Tesla Wall Connector (via Tesla Fleet), Wallbox (myWallbox API) | Whichever charger the user actually owns | These are physically disjoint hardware — never both for the same session |

## Real-world example (Joseph)

Joseph has Tesla Powerwall + Tesla solar reporting AND Enphase microinverters reporting. The system MUST pick ONE for solar production. Priority says Enphase wins. Tesla's solar number is ignored entirely for the solar KPI. (Tesla still wins for battery because his battery hardware IS a Powerwall.)

## Code enforcement

- `src/hooks/useDashboardData.ts` — KPI hook
- `src/hooks/useEnergyLog.ts` — Energy Log tabs (must match KPI hook exactly, see `energy-log-kpi-parity.md`)
- `supabase/functions/mint-onchain/index.ts` — mint pipeline priority arrays
- `supabase/functions/generate-weekly-digest/index.ts` — weekly email totals

Any new digest, narrative, report, or dashboard that surfaces these KPIs MUST use the same priority logic. If you add a new provider with solar or battery capability, update ALL of the above in the same migration.

## Battery-specific note

Schema gotcha: Tesla writes `data_type='battery_discharge'`, but Enphase/SolarEdge write `data_type='battery'`. Battery queries MUST `.in('data_type', ['battery','battery_discharge'])` or they silently miss Enphase/SolarEdge owners.

## Narrative emails (Deason weekly story)

The hyper-personalized narrative email follows the same rule — when it cites "your solar produced X kWh", that number comes from the SAME single OEM the dashboard uses. The narrative may pull RICHER detail from a non-priority OEM (e.g. per-panel Enphase data for color, even when SolarEdge is the priority) but the headline kWh totals stay aligned with the dashboard's chosen OEM.
