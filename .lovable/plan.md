## Goal

Stop showing the legacy `AnimatedEnergyFlow` mock to beta users whose connected devices don't include the full Tesla solar + Powerwall + EV combo. Render the right card per device combination, and standardize on Joseph's rich multi-device setup (Tesla + Solar + Powerwall + Wallbox in an active state) for every homepage / investor / demo visual.

## Render matrix (first match wins)

```text
loading                                  → existing skeleton
has.solar && (has.battery || has.tesla)  → existing rich EnergyFlowScene  (unchanged)
!has.solar && (has.battery || has.tesla) → existing rich EnergyFlowScene  (solar node hides; already supported)
has.solar && !has.battery && !has.tesla  → new SolarPlusCard (+ ChargerTile if has.charger)
has.charger only                         → new ChargerOnlyLiveCard
nothing connected                        → keep AnimatedEnergyFlow + "Connect a device" CTA  (the ONLY remaining caller)
```

Detection inside `LiveEnergyMonitoringCard`:
- `has.solar`   = `solar.data.length > 0`
- `has.battery` = `battery.data.length > 0`
- `has.tesla`   = `ev.data.some(t => t.oem === 'tesla')`
- `has.charger` = `chargers.data.length > 0` from new `useChargerDevices`

## New files

1. **`src/hooks/useChargerDevices.ts`** — one-shot select on `connected_devices` where `device_type='home_charger'`. Returns `{ device_id, device_name, provider, lifetime_kwh, total_sessions, last_synced_at }` parsed from the `lifetime_totals` JSONB.
2. **`src/components/dashboard/LiveCardHeader.tsx`** — shared header (Sparkles + "ZenEnergy Monitoring · Live" + subtitle + freshness pill + refresh button). Lifted from the inline JSX in `LiveEnergyMonitoringCard` (L676–699).
3. **`src/components/dashboard/ChargerOnlyLiveCard.tsx`** — `<LiveCardHeader />` + per-charger `<ChargerTile />` (provider + device_name, "Idle" pill — honest fallback for the documented `wallbox-data` telemetry gap, today's kWh from `useEVTotals(1)`, lifetime kWh + total sessions from the device row). Footer "Unlock the full live cockpit" → `/clean-energy-center`. Exports `ChargerTile` for reuse.
4. **`src/components/dashboard/SolarPlusCard.tsx`** — `<LiveCardHeader />` + solar tile (current kW, today kWh, lifetime MWh, OEM label via local `solarSnapshot`) + optional `<ChargerTile />` when `has.charger`. Footer "Add a Powerwall or your Tesla" → `/clean-energy-center`.

All four files use dark-mode-only styling, mobile-first (390×844), semantic tokens only (no raw hex).

## Edited files

5. **`src/components/dashboard/LiveEnergyMonitoringCard.tsx`**
   - Import `useChargerDevices`, `SolarPlusCard`, `ChargerOnlyLiveCard`, `LiveCardHeader`.
   - Compute `has.solar / has.battery / has.tesla / has.charger`.
   - Replace the single `empty` early-return at L657 with the render matrix above (the existing `<AnimatedEnergyFlow />` block now only fires when none of the four flags are true; CTA copy updated to "Connect solar, a battery, your Tesla, or a charger").
   - Replace the inline header JSX (L676–699) inside the rich cockpit with `<LiveCardHeader />` so all three views share styling.
6. **`src/components/home/DashboardShowcase.tsx`** — swap `<AnimatedEnergyFlow />` at L125 for `<InvestorEnergyFlowCard />` (already a fixture-driven rich Solar + Powerwall + Tesla + Wallbox scene; no live data; safe for public homepage).
7. **`public/investor/one-pager/zen-monitoring.png`** — regenerate via `imagegen` showing Joseph's canonical rich state: solar panels generating, Powerwall discharging at high SOC, Tesla actively charging from a Wallbox, on a dark-mode mobile phone frame matching the in-app cockpit aesthetic.
8. **`.lovable/memory/features/live-energy-flow-beta-access.md`** — append the render matrix, document the new `useChargerDevices` hook, list the only legitimate `AnimatedEnergyFlow` callers (no-devices branch in `LiveEnergyMonitoringCard`, unsubscribed teaser in `ZenSolarDashboard`, `AdminLiveEnergyFlow`), and codify the rule that all marketing / demo visuals must use Joseph's canonical rich multi-device example (Tesla + Solar + Powerwall + Wallbox in an active state).

## Sweep

`rg -n "AnimatedEnergyFlow" src/pages src/components/home src/components/investor` must return zero hits in `pages/Investor*.tsx`, `components/home/*`, and `components/investor/*` after the change.

## Out of scope

- No new edge functions; `wallbox-data` telemetry-mode gap stays documented and handled by graceful "Idle" copy.
- No changes to `useEnergyInsightsSubscription` (Tschida already qualifies as founder).
- No business-logic, pricing, tokenomics, or auth changes.
