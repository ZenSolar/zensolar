---
name: Live Energy Flow — beta access rule
description: Who sees LiveEnergyMonitoringCard vs the static AnimatedEnergyFlow on the main dashboard
type: feature
---
`EnergyFlowGlowCard` (hero on ZenSolarDashboard) renders `LiveEnergyMonitoringCard` (real telemetry via useSolarTelemetry/useBatteryTelemetry/useEVChargerTelemetry → OEM edge functions) for:
1. Founders / admins (via `useIsFounder`)
2. Users with an active `energy_subscriptions` row
3. **Any user with ≥1 row in `connected_devices`** — pre-launch beta auto-grant (added so Pessah, Golson, Tschida, and every future beta user with hardware wired up see live data, not a static animation)

Logic lives in `src/hooks/useEnergyInsightsSubscription.ts`. Tier stays `standard` for beta auto-grants so the Pro upgrade CTA still surfaces.

## Render matrix inside `LiveEnergyMonitoringCard` (first match wins)

Detection:
- `has.solar`   = `solar.data.length > 0`
- `has.battery` = `battery.data.length > 0`
- `has.tesla`   = `ev.data.some(t => t.oem === 'tesla')`
- `has.charger` = `chargers.data.length > 0` (from `useChargerDevices` — selects `connected_devices` rows where `device_type='home_charger'`)

```
loading                                  → skeleton
has.solar && (has.battery || has.tesla)  → rich EnergyFlowScene (unchanged)
!has.solar && (has.battery || has.tesla) → rich EnergyFlowScene (solar node hides)
has.solar && !has.battery && !has.tesla  → SolarPlusCard (+ ChargerTile if has.charger)
has.charger only                         → ChargerOnlyLiveCard
nothing connected                        → AnimatedEnergyFlow + "Connect a device" CTA
```

The legacy `AnimatedEnergyFlow` mock is now allowed ONLY in:
- the "nothing connected" branch of `LiveEnergyMonitoringCard`
- the unsubscribed teaser in `ZenSolarDashboard`
- the `AdminLiveEnergyFlow` admin tool

It MUST NOT appear on homepage / investor / demo / marketing surfaces. Those always use the rich `InvestorEnergyFlowCard` (or a screenshot of it) so visitors see Joseph's canonical multi-device example:
- Tesla actively charging from a Wallbox
- Solar panels generating power
- Powerwall discharging at high SOC
- Wallbox session live

`public/investor/one-pager/zen-monitoring.png` is regenerated against this same canonical scene and is referenced from `src/pages/InvestorOnePager.tsx`.

Known telemetry-mode gaps in OEM edge functions (not blocking today since no beta user depends on them as sole source):
- `wallbox-data` does not parse `{ mode: 'telemetry' }` — Wallbox live snapshot is unavailable; `ChargerOnlyLiveCard` / `ChargerTile` show an honest "Idle" pill and surface lifetime + today totals instead. Session totals still flow via `useEVTotals`.
- `solaredge-data` does not implement `mode: 'telemetry'` — no live SolarEdge user onboarded yet (per oem-live-status.md).
Fix these before onboarding a SolarEdge-only user or surfacing real-time Wallbox draw.
