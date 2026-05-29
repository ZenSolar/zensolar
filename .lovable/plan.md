
## Why the current card feels weak

Two separate problems collided:

**1. Data bindings are wrong** (this is why your numbers are blank)

Looking at the actual cached telemetry for joe@zen.solar:

- **Enphase solar** — the cached payload is `{ totals: { energy_today_wh: 23420 }, per_system: [{ system_id, energy_today_wh, lifetime_wh, pending_wh }] }`. There is **no `current_power_w` field at the top level**, but the `SolarTile` only reads `current_power_w` / `solar_power`. → renders 0.00 kW. The Enphase Summary endpoint (which returns `current_power`) is also not being hit reliably; we need to call it directly in the telemetry branch and also fall back to `per_system[0]` shape.
- **Tesla Powerwall** — cached payload nests live values inside `energy_sites[0]` (`percentage_charged` actually isn't even returned by the current sync, only `battery_power` / `solar_power` / `grid_power`). The `BatteryTile` reads top-level `percentage_charged` → blank SOC. We need to (a) make the telemetry branch actually call `/live_status` and surface `percentage_charged`, and (b) have the tile read from `energy_sites[0]` as a fallback.
- **Tesla vehicle** — cached payload nests under `vehicles[0]` with `battery_level: 0, charging_state: "Unknown", odometer: 74590.4`. The `EVTile` reads top-level `battery_level` → blank. We need to read from `vehicles[0]` and surface the **odometer** (you specifically called it out).

Root cause: the front-end hook is storing whatever shape the edge function returns, and right now the heavy sync response is being cached instead of the lean telemetry response. The tiles need to be defensive about both shapes, and the edge functions need to short-circuit cleanly on `mode: 'telemetry'`.

**2. It doesn't feel like a $4.99 product**

You're right. Three tiny tiles with a number on each is what a free widget looks like. For paid, this needs to feel like a *cockpit*.

---

## The plan

### Part A — Fix the data (must-have, no debate)

1. **`LiveEnergyMonitoringCard.tsx`** — make every value reader fall back through both shapes:
   - Solar `currentW`: `current_power_w` → `per_system[0].current_power_w` → `solar_power` → `energy_sites[0].solar_power`
   - Solar `todayWh`: `energy_today_wh` → `totals.energy_today_wh` → `per_system[0].energy_today_wh`
   - Battery `soc`: `percentage_charged` → `energy_sites[0].percentage_charged` → `battery_soc`
   - Battery `power`: `battery_power` → `energy_sites[0].battery_power`
   - EV `soc/range/state/odometer/charge_rate`: top-level → `vehicles[0].*` → `response.charge_state.*`
2. **`tesla-data` telemetry branch** — when capability=battery, also include `energy_sites[0]` snapshot so the FE always has a shape it knows. When capability=ev, add `odometer` (from `drive_state.odometer`).
3. **`enphase-data` telemetry branch** — ensure summary call actually fires (deployed code looks correct; force a redeploy and surface `last_report_at` so we can show "updated 2 min ago").
4. **Bust the stale cache** — when the hook fetches, if the cached payload is missing the new canonical keys, ignore the cache and refetch. This unsticks joe's current bad payload without a migration.

### Part B — Make it feel premium (the actual upgrade)

Replace the 3-tile grid with a single **"Home Energy Cockpit"** layout:

```text
┌────────────────────────────────────────────────────────────────┐
│  ZenEnergy Monitoring · Live           Updated 12s ago   ⚡    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   ┌──────────── ENERGY FLOW (live, animated) ────────────┐    │
│   │   ☀ Solar 4.26 kW  →  🏠 House 1.11 kW              │    │
│   │                    ↓                                  │    │
│   │   🔋 Powerwall 87% (idle)   →   ⚡ Grid -3.15 kW    │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│   │ TODAY        │  │ THIS WEEK    │  │ ZENX             │    │
│   │ 23.4 kWh ☀  │  │ +158.7 kWh ☀│  │ 74,590 mi 🚗   │    │
│   │ 12.1 kWh 🏠 │  │ -42.3 kWh 🔋│  │ 67% · 218 mi    │    │
│   │ Net +11.3kWh │  │ Self-suff 78%│  │ Idle · plugged   │    │
│   └──────────────┘  └──────────────┘  └──────────────────┘    │
│                                                                │
│   ZenSolar minted today: 47.2 $ZSOLAR  ·  CO₂ saved: 11.8 kg  │
│                                                                │
│   [ Open Insights → ]                                          │
└────────────────────────────────────────────────────────────────┘
```

Specifics:

- **Live energy flow strip** at the top — reuse the existing `AnimatedEnergyFlow` but parameterize it with the real solar/load/battery/grid kW values so the particle direction and speed reflect actual flow. This is the "wow" moment.
- **Three context tiles** (Today / This Week / ZenX) replacing the current shallow tiles. ZenX tile now shows **odometer**, SOC, range, plug state — and when charging, swaps in the live charge-session row (kW, charger type badge, % SOC, min to full).
- **Mint + CO₂ footer ribbon** — pulls today's mint total and CO₂-tons-equivalent from the existing PoG hook. This is what makes it feel like *Zen.Solar's* monitor, not Enphase's.
- **"Updated Xs ago" pill** in the header — real freshness signal, color-coded (green <2min, amber <15min, gray cached).
- **Tap any element → drill-in drawer** (out of scope this round; just wire the hover state so it feels alive).

Visual polish:
- Subtle radial gradient behind the flow strip (primary at 5% opacity).
- Numbers use tabular-nums + count-up animation on value change.
- Charging state on ZenX gets a pulsing primary ring around the icon.
- Mobile (390px): tiles stack vertically, flow strip collapses to a single-row sparkline.

### Files touched

- `src/components/dashboard/LiveEnergyMonitoringCard.tsx` — full rewrite into cockpit layout
- `src/components/dashboard/AnimatedEnergyFlow.tsx` — accept `flow={{ solar, load, battery, grid }}` props (additive, won't break empty-state usage)
- `src/hooks/useDeviceTelemetry.ts` — defensive readers + stale-shape cache busting
- `supabase/functions/tesla-data/index.ts` — include `energy_sites[0]` in battery telemetry, add `odometer` to ev telemetry
- `supabase/functions/enphase-data/index.ts` — surface `last_report_at` in telemetry response
- Force redeploy of both edge functions

No DB migrations, no new secrets, no new subscriptions logic.

---

### Out of scope (call out so we don't sneak it in)

- Historical charts (that's the "Open Insights" page)
- Push alerts ("Powerwall full", "Cheapest charging window now")
- VPP earnings card

Both are great next-round upgrades to keep the $4.99 ladder feeling alive — happy to plan them after this lands.
