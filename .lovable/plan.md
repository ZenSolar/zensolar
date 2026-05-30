# Clean Energy Flow + Device Glow System (Hybrid) — v2

Replace the busy multi-conduit overlay with: **device halos as the primary language**, **at most two flow lines** for dominant movement, and a **locked spatial blueprint** for the scene.

## 1. Spatial blueprint (locked)

```text
┌──────────────────────────────────────────────────────┐
│            ☀ solar roof (center, wide)               │
│   ┌─────────┐ ┌────────────────┐                     │
│   │ GARAGE  │ │   HOUSE BODY   │ ▮ Powerwall  ⚡Grid │
│   │  (car)  │ │  lit windows   │   (right wall)     │
│   └────🚗───┘ └────────────────┘                     │
│       driveway                                        │
└──────────────────────────────────────────────────────┘
```

Anchor positions (viewBox 0–100, matches house PNG):

| Anchor | x, y | Notes |
|---|---|---|
| Solar roof | 50, 30 | center of panel array |
| Home load  | 62, 58 | lit windows |
| Powerwall  | 76, 62 | **right wall** of house |
| Grid meter | 90, 66 | far right utility box |
| EV port    | 30, 78 | **driveway in front of garage** |

Tesla vehicle stays parked in front of the garage (`bottom-[16%] left-[16%]`) — never near the front door.

## 2. Device halos (new primary visual)

Each device gets a stacked radial pulse anchored on the art. Idle = invisible.

| Device | Color | Trigger |
|---|---|---|
| Solar roof | emerald (wide ellipse) | `solar > 0.1 kW` |
| Powerwall  | emerald (charging) / amber (discharging) | `\|battery\| > 0.05` |
| EV port    | emerald — strong pulse when charging, faint static ring when plugged-idle | tesla state |
| Grid meter | sky (import) / cyan (export) | `\|grid\| > 0.05` |
| Home windows | warm amber, faint | `home > 0.05` |

Intensity scales with kW; pulse 2.2–2.4s. Charging states get a crisp inner ring (`strong`).

## 3. Max-2 flow lines (priority queue)

```text
1. solar producing  → Solar → Home    (emerald)
2. PW charging      → Solar → Powerwall (emerald)
   PW discharging   → Powerwall → Home (amber)
3. EV charging      → Home → EV       (emerald)
4. grid export      → Home → Grid     (cyan)
5. grid import      → Grid → Home     (sky)
```

Top 2 win and render via existing `FlowConduit` with **thinner stroke (0.7)** and **lower base opacity (0.6)** so halos read first. Everything else is halo-only — no criss-crossing.

## 4. Files touched

- `src/components/dashboard/EnergyFlowScene.tsx`
  - Update `ANCHOR` map to the new spatial blueprint.
  - Add `DeviceHalo`, `RoofHalo`, `pickPrimaryFlows`.
  - Remove the small white anchor `<circle>` debug dots.
  - Render halos for every active device; render only winning conduits.
  - Keep the dynamic Tesla overlay and charge-port glow as-is.
- No changes to `EnergyFlowScene.scenes.ts` or telemetry hooks.

## Success check

- **Idle**: only faint warm home-window glow, no lines.
- **Solar + export**: emerald roof halo + cyan grid halo + 2 lines (solar→home, home→grid).
- **Night PW discharge + EV charging**: amber PW halo + emerald EV halo + 2 lines (pw→home, home→ev).
- **Plugged idle**: emerald EV halo only, no line.
- Clean energy = emerald; discharge = amber; grid = sky/cyan.
