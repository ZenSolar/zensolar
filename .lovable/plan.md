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
- `wallJunction`, `powerwall`, and `chargePoint` cluster together on the new utility wall adjacent to the garage.
- `homeWall` becomes a short stub at that same cluster instead of a distant anchor.
- `roofArrayEdge` moves toward the utility-wall side of the roof.
- `carPark`, `garageFront`, and `bays` stay untouched.
- Re-verify conductor routing in `ConductorNetwork.tsx` and the `GarageDoorOpen` overlay alignment, then confirm with a live screenshot and the anchor overlay.

## Technical notes

- Art files live in `src/assets/zencasa/house-*.png`, keyed from `EnergyFlowScene.scenes.ts` and drawn by `HouseSceneV5.tsx`.
- Anchors are viewBox 0-100 space; existing tests `carAutoFit.test.ts` and `dashboard-layout.regression.test.ts` must stay green after Step 3.
