# House redesign: windowless utility wall next to the garage

## Step 1 (this approval only): one concept image

Produce a single new `day` variant of the house art with the revised facade layout. Nothing else changes — no other scene variants, no anchor edits, no scene code touched.

Layout brief for the concept render, matched to the existing asset so it drops in cleanly:
- Same isometric camera angle, same square 1024x1024 framing, same transparent/white background, same matte-black cladding, warm interior glow, grey concrete plinth, full black solar roof.
- Garage stays in the same left-side position and at the same scale, so `carPark`, `garageFront`, and the `bays` anchors stay valid.
- Immediately right of the garage: a dedicated windowless, doorless wall segment. Clustered on it at wall-base height — grey service panel with meter-can below it, and a white Powerwall cabinet. No charge connector on this wall: the EV charger is an interior garage fixture, drawn only inside the lit garage volume as part of the `GarageDoorOpen` art, so it never appears in this exterior concept image.
- Front door moves to the center/right of the facade, with the porch reading naturally there.
- Windows occupy only the far-right wall bay, with clear separation from the utility wall — no hardware over glass.
- Roof solar array edge shifted toward the utility-wall side so the roof-to-panel conduit run is short.

Delivered as a single image for review. If the first render misses the layout, iterate on the render before showing it.

## Step 2 (only after the layout is approved)

Regenerate the remaining 7 scene keys — `day-export`, `dusk`, `night`, `rain`, `night-ev`, `night-pw-discharge`, `night-pw-discharge-ev` — from the approved facade, and fix while re-cutting:
- Lighting consistency: dusk/night/rain get scene-correct lighting on the house and its hardware, not daylight lighting pasted onto a dark plate.
- Remove the baked-in car from `night-ev` and `night-pw-discharge-ev`; those become car-free plates so the presence-gated dynamic sprite is the only vehicle in the scene, same as the other keys.

## Step 3 (after Step 2)

Update `src/components/dashboard/HomeBlueprint.ts` against the new facade, measured from a `?anchors=1` overlay rather than estimated:
- `wallJunction` and `powerwall` cluster together on the new utility wall adjacent to the garage.
- `chargePoint` moves inside the garage volume (interior wall connector), not onto the exterior utility wall.
- `homeWall` becomes a short stub at that same cluster instead of a distant anchor.
- `roofArrayEdge` moves toward the utility-wall side of the roof.
- `carPark`, `garageFront`, and `bays` stay untouched.
- Add the interior wall-connector fixture to `GarageDoorOpen.tsx` so the charger is visible inside the lit bay.
- Re-verify conductor routing in `ConductorNetwork.tsx` and the `GarageDoorOpen` overlay alignment, then confirm with a live screenshot and the anchor overlay.

### EvChargeCable: two distinct path types

`EvChargeCable` currently draws one fixed short catenary. Split it into two purpose-built paths selected by which bay the car occupies:
1. **Interior run** — car in the garage bay: short cable from the interior connector to the charge port, contained entirely within the lit interior volume, drawn under the door header so it reads as inside.
2. **Ground run** — car in the driveway bay with the door open: its own path that exits through the doorway, drops to the apron, and lies across the driveway to the car. Authored as a distinct ground-plane curve, not a stretched interior catenary.

Explicitly check on screen, with both visible at once, that the ground run does not cross or overlap the grid conductor's ground-level run near the meter; reroute the ground cable if it does.

### Out of scope, decided

No backed-in / rear-facing vehicle pose. Parked-not-charging stays nose-in; charging is communicated by the cable and chip alone. No new sprite work.

### Step 3 verification

- Six-spoke worst case (solar, home, grid, powerwall, EV, and export all active) renders without collisions or overlapping labels.
- Both directions of grid (import and export) and battery (charge and discharge) verified on screen.

## Technical notes

- Art files live in `src/assets/zencasa/house-*.png`, keyed from `EnergyFlowScene.scenes.ts` and drawn by `HouseSceneV5.tsx`.
- Anchors are viewBox 0-100 space; existing tests `carAutoFit.test.ts` and `dashboard-layout.regression.test.ts` must stay green after Step 3.
