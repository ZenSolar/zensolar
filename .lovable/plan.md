Goal: stop gating Tschida (Enphase solar + Wallbox, no battery) behind an "Add a battery" upsell, and give him a real live flow diagram.

Changes:

1. Relax the upsell copy in `SolarPlusCard`
   - Remove the "Add a battery to unlock real-time energy flow…" gate language.
   - Keep a soft upgrade nudge only when something is genuinely missing, and never imply the diagram itself is locked.

2. Add a lightweight live flow diagram for the solar (+ optional charger / EV) case
   - New small component `SolarChargerFlowScene` that renders an honest, animated diagram:
     - Always: Solar node → Home node (flow animates when solar kW > 0).
     - When a charger is connected: Solar → Charger node, with a sub-arrow to a Vehicle silhouette (greyed-out when no live EV telemetry).
     - When solar kW is 0 (e.g. Mike right now): nodes still render, flow lines are dimmed and labeled "Idle" — no fake numbers.
   - Used by `SolarPlusCard` directly above the existing tiles, so the card now shows:
     - Live flow diagram (solar → home, solar → charger).
     - Enphase solar tile (existing).
     - Wallbox charger tile (existing).
     - Optional soft upgrade nudge.

3. Update the render matrix in `LiveEnergyMonitoringCard`
   - `empty` only when the user has zero of solar / battery / Tesla / charger (unchanged).
   - Solar-only OR solar+charger (no battery, no Tesla EV) → `SolarPlusCard` (now with the new flow diagram).
   - Charger-only (no solar / battery / Tesla) → `ChargerOnlyLiveCard` (unchanged).
   - Anything with battery or Tesla → existing rich `EnergyFlowScene` cockpit (unchanged — that path needs Powerwall geometry).

4. Verify
   - View-As Michael Tschida: card renders the new solar→home / solar→charger flow with his Enphase tile and Wallbox tile, no battery prompt, no Tesla/Powerwall copy.
   - Exit View-As: admin's full cockpit (battery + Tesla) still renders via `EnergyFlowScene`.
   - User with zero devices still sees the existing placeholder + "Connect a device" call to action.