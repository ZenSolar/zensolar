---
name: One OEM per capability (data source of truth)
description: Hard rule — every KPI pulls from exactly ONE OEM endpoint per user. SSOT module + per-KPI priorities + Joseph reference scan.
type: feature
---

# Hard rule: ONE OEM per capability per user

Every KPI pulls from **exactly one** OEM API. Never sum or merge the same metric across providers — that double-counts kWh.

**SSOT module:** `src/lib/dataSourcePriority.ts` (mirrored in `supabase/functions/_shared/dataSourcePriority.ts`). All hooks and edge functions that read telemetry MUST route source selection through `pickSource(capability, profile, devices)`.

## Per-capability rules

| Capability | Rule |
|---|---|
| **Solar production** | 1) `profiles.solar_installer === 'tesla'` → Tesla solar API. 2) Else `profiles.solar_inverter_brand` (enphase / solaredge / tesla / other). 3) Legacy fallback Enphase > SolarEdge > Tesla. **Powerwall CTs are NEVER used as the solar source.** |
| **Battery (discharge/export)** | Whichever battery hardware the user owns: Tesla Powerwall > Enphase IQ Battery > SolarEdge Home Battery. Never summed. |
| **Charging energy (home + Supercharger)** | Tesla vehicle connected → Tesla `charge_state` ONLY (skip `home_charging_sessions` to avoid double-count). Else → user's home charger (Wallbox / ChargePoint). |
| **Home consumption** | Same hardware that owns the battery / CTs: Powerwall site > Envoy > SolarEdge meter. |

## Onboarding captures the preference

- `SolarInstallerScreen` → `profiles.solar_installer` (tesla / other).
- `InverterBrandScreen` (only when installer = other) → `profiles.solar_inverter_brand`.
- Charging source is derived from claimed devices (Tesla vehicle present → tesla_vehicle).

Edit later from Profile → Solar Installer card.

## Wallbox live-kW gap

Wallbox API does not expose per-second active charging power. The Live cockpit must show today's session totals + lifetime kWh and label the tile with a friendly Info indicator: *"Live kW not yet available for Wallbox — showing today's totals."* Implementation: `ChargerTile` in `src/components/dashboard/ChargerOnlyLiveCard.tsx`.

## Battery-specific schema gotcha

Tesla writes `data_type='battery_discharge'`, Enphase/SolarEdge write `data_type='battery'`. Battery queries MUST `.in('data_type', ['battery','battery_discharge'])`.

## Code enforcement

- `src/hooks/useDashboardData.ts` — KPI hook (priority arrays mirror SSOT).
- `src/hooks/useEnergyLog.ts` — Energy Log tabs (see `energy-log-kpi-parity.md`).
- `supabase/functions/mint-onchain/index.ts` — mint pipeline.
- `supabase/functions/generate-weekly-digest/index.ts` — weekly digest totals.

Any new digest, report, or dashboard MUST import from the SSOT module. New OEM with solar/battery capability = update SSOT + all callsites in same migration.

## Joseph Maushart — reference account scan (2026-06-02)

`user_id = 331c79de-0c05-433c-a57e-9cdfcf2dc44d` ("ZenCasa")

Claimed devices:
| Provider | device_type | device_id |
|---|---|---|
| enphase | solar_system | 3304566 |
| tesla | powerwall | 2252296997237235 |
| tesla | vehicle | 5YJXCBE24MF323843 |

| Capability | Picked source | Status |
|---|---|---|
| Solar | Enphase (`solar_inverter_brand=enphase`) | ✅ Powerwall CTs explicitly excluded |
| Battery | Tesla Powerwall | ✅ |
| Charging | Tesla vehicle | ✅ Wallbox absent — no double-count risk |
| Consumption | Powerwall site | ✅ |

**Discrepancy fixed:** `solar_installer` was NULL. Backfilled to `other` + `solar_inverter_brand='enphase'` + `primary_charging_source='tesla_vehicle'` in migration `20260602180855` so the SSOT rule is deterministic, not coincidental fallback.

**Re-scan SQL for any beta user:**
```sql
SELECT cd.provider, cd.device_type, cd.device_id, cd.device_name
FROM connected_devices cd
WHERE cd.user_id = '<user-id>'
ORDER BY cd.provider;
```
Then apply `pickSource()` mentally per capability and confirm.

## Deason discrepancy support

`useOemDiagnostics` runs `detectSolarConflict` / `detectChargingConflict` + checks `energy_tokens.expires_at`. Findings surface in `OemDiagnosticsBanner` with friendly copy + reconnect deep link + "Ask Deason" CTA, and are logged to `oem_diagnostic_log` for team triage. See `deason-oem-diagnostics.md`.
