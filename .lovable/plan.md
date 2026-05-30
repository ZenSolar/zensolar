# Energy Flow v3 — Whisper Halos + Dashed Traveling Dots

The v2 patch shipped, but halos render as opaque blobs and conduits still feel heavy with kinks. This pass tunes both to a premium, barely-there feel and re-anchors the endpoints to the actual house PNG.

## 1. Halos — barely-there breathing glow

In `EnergyFlowScene.tsx` `DeviceHalo` / `RoofHalo`:

- Drop peak opacity from `0.26 → 0.12` (outer) and `0.18 → 0.08` (inner).
- Increase blur (`filter: blur(14px)` outer, `blur(8px)` inner) so edges fully dissolve.
- Remove the hard inner ring on `strong` state; replace with a slightly brighter (0.18) inner pulse only. No crisp ring ever.
- Slow the pulse to `2.8–3.2s` with `ease-in-out` so it feels like breathing, not blinking.
- Shrink solar `RoofHalo` ellipse to ~60% of current radius so it sits **inside** the panel array, not covering it.
- Home-window halo: shrink radius to ~28px, anchor tighter on the lit-window cluster — must not bleed onto the door or driveway.

## 2. Flow lines — thin dashed traveling dots

Replace `FlowConduit` rendering for the picked primary flows with a new lightweight `DottedFlow`:

- 1px SVG `<path>` guide at `stroke-opacity: 0.18` (just a hint of the route).
- 3–4 small circles (`r=0.9`, fill = flow color, opacity 0.9) animated along the path using `<animateMotion>` with staggered `begin` times.
- 1.8s loop, `calcMode="linear"`, `keyPoints` from 0→1.
- Drop all the existing thick stroke/glow layers from `FlowConduit` for these primary flows. Conduit component stays in the file for any non-primary use but is no longer rendered.

## 3. Anchor fixes

Tune `ANCHOR` to match the actual house PNG positions:

| Anchor | old (x, y) | new (x, y) | Why |
|---|---|---|---|
| Home load | 62, 58 | 68, 66 | Lit-window cluster on right side of house, not mid-roof |
| Grid meter | 90, 66 | 92, 70 | Match utility box on far right baseline — removes the bent line |
| Solar roof | 50, 30 | 50, 32 | Sit slightly lower so halo lands inside panels |
| EV port | 30, 78 | 28, 82 | Aligns with charge-port side of parked Tesla |
| Powerwall | 76, 62 | 80, 68 | Right wall, lower — matches PNG geometry |

Bezier curves between these new anchors should flow cleanly without kinking through walls.

## 4. Files touched

- `src/components/dashboard/EnergyFlowScene.tsx` only
  - Tune `DeviceHalo` + `RoofHalo` (opacity, blur, pulse timing, remove hard ring)
  - Add `DottedFlow` component using `<animateMotion>`
  - Swap primary-flow renderer from `FlowConduit` → `DottedFlow`
  - Update `ANCHOR` table
- No changes to `EnergyFlowScene.scenes.ts`, `pickScene`, telemetry hooks, or tests.

## Success check

- **Idle**: nothing visible except the lit windows of the PNG itself. No green/amber blobs anywhere.
- **Solar producing + exporting** (current screenshot state): faint emerald breathing inside the panel array, faint cyan breathing at the meter, two dashed-dot streams (solar→home emerald, home→grid cyan) flowing smoothly with no kinks.
- **Night PW discharge + EV charging**: faint amber breath on right wall, faint emerald breath at EV port, two dot streams (pw→home amber, home→ev emerald).
- **Plugged idle**: emerald breath at EV port only, no dots.
- Art reads first, halos whisper, dots tell the story.
