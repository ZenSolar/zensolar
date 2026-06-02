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

Known telemetry-mode gaps in OEM edge functions (not blocking today since no beta user depends on them as sole source):
- `wallbox-data` does not parse `{ mode: 'telemetry' }` — Wallbox EV charger live snapshot is unavailable; session totals still flow via useEVTotals.
- `solaredge-data` does not implement `mode: 'telemetry'` — no live SolarEdge user onboarded yet (per oem-live-status.md).
Fix these before onboarding a SolarEdge-only user or surfacing real-time Wallbox draw.
