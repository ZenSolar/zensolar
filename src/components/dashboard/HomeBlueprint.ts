/**
 * HomeBlueprint — single source of truth for every spatial anchor used by
 * the ZenEnergy Monitoring Live card.
 *
 * v5 Phase 1: anchors retuned to the new pure-SVG HouseSceneV5 geometry.
 * Coordinate system unchanged (0–100 viewBox, square, xMidYMid meet) so all
 * downstream halos, flow paths, and the dynamic Tesla overlay stay aligned.
 *
 * Geometry map (matches HouseSceneV5.tsx exactly):
 *   • Roof apex (50, 16) → eaves (4, 42) / (96, 42)
 *   • Solar array on left roof slope, center ~ (35, 31)
 *   • Garage block:   x 4..40,  y 46..80    opening 7..37 × 50..76
 *   • Living block:   x 40..96, y 42..80
 *   • Windows cluster x 58..92, y 48..63   (BIG — 2x2 grid)
 *   • Front door      x 44..52, y 58..80
 *   • Grid meter      (93.75, 68.4)
 *   • Driveway slab   x 3..38,  y 68..96
 */

export type BlueprintAnchor = Readonly<{ x: number; y: number }>;

export const HOME_BLUEPRINT = Object.freeze({
  /** Solar panel array center on the front-facing roof slope. */
  solar:        { x: 35, y: 31 } as BlueprintAnchor,
  /** Powerwall cabinet on the porch, immediately left of the lit windows. */
  powerwall:    { x: 46, y: 72 } as BlueprintAnchor,
  /** Optional second Powerwall, stacked horizontally next to the first. */
  powerwall2:   { x: 51, y: 72 } as BlueprintAnchor,
  /** Center of the BIG 2x2 lit-window cluster. */
  windows:      { x: 75, y: 54 } as BlueprintAnchor,
  /** Recessed front door (center of porch). */
  frontDoor:    { x: 48, y: 70 } as BlueprintAnchor,
  /** Small grey utility/grid meter box at the right edge of the front wall. */
  gridMeter:    { x: 94, y: 68 } as BlueprintAnchor,
  /** Tesla Wall Connector inside the garage, mounted on the back wall. */
  wallCharger:  { x: 14, y: 58 } as BlueprintAnchor,
  /** Driveway parking spot in front of the garage. Anchor = car center. */
  carPark:      { x: 22, y: 84 } as BlueprintAnchor,
  /** "Charging at home" anchor — centered just inside the garage opening. */
  garageFront:  { x: 22, y: 70 } as BlueprintAnchor,
  /** Rectangle over the garage opening — used to paint a warm "door open" bloom. */
  garageOpening: { x: 7, y: 50, w: 30, h: 26 } as Readonly<{
    x: number; y: number; w: number; h: number;
  }>,
  /** Dynamic-vehicle <image> overlay dimensions, % of viewBox.
   *  v5 Phase 1: ~38% scene width (was 44 effective) — feels like a real
   *  car centered in the new larger garage opening. */
  carWidth: 36,
  carHeight: 20,
  /**
   * v5 multi-battery support — up to 5 Powerwall units stacked horizontally
   * along the porch wall between the garage and the windows. Slot 0 ==
   * legacy `powerwall` anchor.
   */
  powerwallSlots: [
    { x: 46, y: 72 },
    { x: 50.5, y: 72 },
    { x: 55, y: 72 },
    { x: 55, y: 76 },
    { x: 50.5, y: 76 },
  ] as readonly BlueprintAnchor[],
} as const);

/**
 * Cubic-bezier paths between blueprint anchors. Control points hug the
 * new HouseSceneV5 silhouette (roof slope → eave → front wall → driveway).
 */
const B = HOME_BLUEPRINT;
export const BLUEPRINT_PATHS = Object.freeze({
  /** Solar roof → lit windows. Down the front roof slope to the right. */
  solarToHome:        `M ${B.solar.x} ${B.solar.y} C 50 30 65 42 ${B.windows.x} ${B.windows.y}`,
  /** Solar roof → Powerwall (front porch). Slope down to the facade. */
  solarToPowerwall:   `M ${B.solar.x} ${B.solar.y} C 40 42 42 60 ${B.powerwall.x} ${B.powerwall.y}`,
  /** Solar roof → second Powerwall. */
  solarToPowerwall2:  `M ${B.solar.x} ${B.solar.y} C 42 44 46 62 ${B.powerwall2.x} ${B.powerwall2.y}`,
  /** Powerwall → windows. Short rightward arc along the front facade. */
  powerwallToHome:    `M ${B.powerwall.x} ${B.powerwall.y} C 55 70 65 60 ${B.windows.x} ${B.windows.y}`,
  /** Second Powerwall → windows. */
  powerwall2ToHome:   `M ${B.powerwall2.x} ${B.powerwall2.y} C 60 70 68 60 ${B.windows.x} ${B.windows.y}`,
  /** Grid meter → windows. Short leftward arc along the front wall. */
  gridToHome:         `M ${B.gridMeter.x} ${B.gridMeter.y} C 90 64 84 58 ${B.windows.x} ${B.windows.y}`,
  /** Windows → grid meter (export). Reverse of above. */
  homeToGrid:         `M ${B.windows.x} ${B.windows.y} C 84 58 90 64 ${B.gridMeter.x} ${B.gridMeter.y}`,
  /** Wall charger → parked EV. Short arc out of the garage to the driveway. */
  chargerToEv:        `M ${B.wallCharger.x} ${B.wallCharger.y} C 16 68 18 76 ${B.carPark.x} ${B.carPark.y}`,
} as const);
