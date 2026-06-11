/**
 * HomeBlueprint — single source of truth for every spatial anchor used by
 * the ZenEnergy Monitoring Live card.
 *
 * v5 Final: anchors tuned to the baked 3-D house PNGs in
 * `src/assets/zencasa/house-*.png`. These are the same PNGs the v3 hero
 * rendered against (the premium-depth, lit-window version the user
 * approved as the base) so halos, flow paths, and the dynamic Tesla
 * overlay land precisely on real geometry — not on the flat SVG
 * silhouette the Phase 1 rebuild experimented with.
 *
 * All values are in viewBox 0–100 space (square, xMidYMid meet).
 *
 *   Garage / driveway (left)  →  House body (center)  →  Powerwall (right)
 *                              → Grid meter (far right)
 */

export type BlueprintAnchor = Readonly<{ x: number; y: number }>;

export const HOME_BLUEPRINT = Object.freeze({
  /** Solar panel array center on the front-facing roof slope. */
  solar:        { x: 50, y: 30 } as BlueprintAnchor,
  /** Center of the lit-window cluster on the front-right wall. */
  windows:      { x: 60, y: 60 } as BlueprintAnchor,
  /** Primary Powerwall cabinet on the right side of the house. */
  powerwall:    { x: 80, y: 66 } as BlueprintAnchor,
  /** Optional second Powerwall stacked just below the first. */
  powerwall2:   { x: 80, y: 72 } as BlueprintAnchor,
  /** Front door (porch). */
  frontDoor:    { x: 52, y: 70 } as BlueprintAnchor,
  /** Utility grid meter at the right foundation edge. */
  gridMeter:    { x: 86, y: 76 } as BlueprintAnchor,
  /** Tesla Wall Connector mounted inside the garage. */
  wallCharger:  { x: 22, y: 64 } as BlueprintAnchor,
  /** Driveway parking spot in front of the garage (car center). */
  carPark:      { x: 22, y: 82 } as BlueprintAnchor,
  /** "Charging at home" anchor — pulls the car up to the garage apron. */
  garageFront:  { x: 22, y: 76 } as BlueprintAnchor,
  /** Rectangle over the garage opening — used to paint a warm "door open" bloom. */
  garageOpening: { x: 8, y: 54, w: 28, h: 22 } as Readonly<{
    x: number; y: number; w: number; h: number;
  }>,
  /** Dynamic-vehicle <image> overlay dimensions, % of viewBox.
   *  v5 Final: large enough to read as a real car in the driveway,
   *  matching the IMG_0549 isometric reference. */
  carWidth: 46,
  carHeight: 26,
  /**
   * v5 multi-battery support — up to 5 Powerwall units stacked vertically
   * along the right exterior wall. Slot 0 == legacy `powerwall` anchor.
   */
  powerwallSlots: [
    { x: 80, y: 66 },
    { x: 80, y: 72 },
    { x: 84, y: 66 },
    { x: 84, y: 72 },
    { x: 84, y: 78 },
  ] as readonly BlueprintAnchor[],
} as const);

/**
 * Cubic-bezier paths between blueprint anchors.
 *
 * v5 Final: routed against the baked PNG geometry (roof at top-center,
 * windows on front-right wall, Powerwall on right side, grid meter at
 * far right, driveway on left). Every curve traces the silhouette so
 * flow lines never cut through the roof or punch out of a wall.
 */
const B = HOME_BLUEPRINT;
export const BLUEPRINT_PATHS = Object.freeze({
  /** Solar roof → lit windows. Down the front slope, eased into the facade. */
  solarToHome:        `M ${B.solar.x} ${B.solar.y} C 52 46 56 56 ${B.windows.x} ${B.windows.y}`,
  /** Solar roof → primary Powerwall. Diagonal down across the ridge. */
  solarToPowerwall:   `M ${B.solar.x} ${B.solar.y} C 62 42 74 56 ${B.powerwall.x} ${B.powerwall.y}`,
  /** Solar roof → second Powerwall. */
  solarToPowerwall2:  `M ${B.solar.x} ${B.solar.y} C 64 46 76 62 ${B.powerwall2.x} ${B.powerwall2.y}`,
  /** Powerwall → windows. Leftward arc back to the lit cluster. */
  powerwallToHome:    `M ${B.powerwall.x} ${B.powerwall.y} C 74 66 66 64 ${B.windows.x} ${B.windows.y}`,
  /** Second Powerwall → windows. */
  powerwall2ToHome:   `M ${B.powerwall2.x} ${B.powerwall2.y} C 74 70 66 66 ${B.windows.x} ${B.windows.y}`,
  /** Grid meter → windows. Up and left along the right foundation. */
  gridToHome:         `M ${B.gridMeter.x} ${B.gridMeter.y} C 78 72 68 66 ${B.windows.x} ${B.windows.y}`,
  /** Windows → grid meter (export). Reverse of the import arc. */
  homeToGrid:         `M ${B.windows.x} ${B.windows.y} C 68 66 78 72 ${B.gridMeter.x} ${B.gridMeter.y}`,
  /** Solar → grid (direct overproduction export). Across the ridge to the meter. */
  solarToGrid:        `M ${B.solar.x} ${B.solar.y} C 64 36 78 60 ${B.gridMeter.x} ${B.gridMeter.y}`,
  /** Wall connector → parked EV. Out of the garage, down to the driveway car. */
  chargerToEv:        `M ${B.wallCharger.x} ${B.wallCharger.y} C 22 70 22 76 ${B.carPark.x} ${B.carPark.y}`,
} as const);
