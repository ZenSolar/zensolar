/**
 * HomeBlueprint — single source of truth for every spatial anchor used by
 * the ZenEnergy Monitoring Live card.
 *
 * Coordinate system: 0–100 normalized, matching the SVG overlay's viewBox
 * which itself is sized to the hero PNG's content box (h-80%, square,
 * preserveAspectRatio="xMidYMid meet"). Because the hero PNG and the
 * overlay SVG share identical layout classes, normalized coords here map
 * 1:1 to pixels in the rendered house art.
 *
 * Calibrated by measuring painted device centers in the rendered
 * `house-day.png` at 390×844, using the 80%-of-card-height centered square
 * as the (0,0)–(100,100) reference frame.
 */

export type BlueprintAnchor = Readonly<{ x: number; y: number }>;

export const HOME_BLUEPRINT = Object.freeze({
  /** Solar panel array center on the front-facing roof slope. */
  solar:        { x: 41, y: 33 } as BlueprintAnchor,
  /** White Powerwall cabinet on front wall, immediately left of windows. */
  powerwall:    { x: 69, y: 63 } as BlueprintAnchor,
  /** Optional second Powerwall, stacked horizontally next to the first. */
  powerwall2:   { x: 64, y: 65 } as BlueprintAnchor,
  /** 4-window lit cluster on the right side of the front facade. */
  windows:      { x: 83, y: 59 } as BlueprintAnchor,
  /** Recessed front door (center of porch). */
  frontDoor:    { x: 55, y: 66 } as BlueprintAnchor,
  /** Small grey utility/grid meter box at the right edge of the front wall. */
  gridMeter:    { x: 92, y: 63 } as BlueprintAnchor,
  /** Tesla Wall Connector inside the garage, mounted on the back wall. */
  wallCharger:  { x: 27, y: 64 } as BlueprintAnchor,
  /** Driveway parking spot in front of the garage. Anchor = car center. */
  carPark:      { x: 16, y: 73 } as BlueprintAnchor,
  /** Dynamic-vehicle <image> overlay dimensions, % of viewBox. */
  carWidth: 28,
  carHeight: 15,
} as const);

/**
 * Cubic-bezier paths between blueprint anchors. Control points hug the
 * actual silhouette of the rendered house (roof slope → eave → front wall →
 * baseline) instead of cutting diagonals through it.
 */
const B = HOME_BLUEPRINT;
export const BLUEPRINT_PATHS = Object.freeze({
  /** Solar roof → lit windows. Down the front roof slope to the right eave. */
  solarToHome:        `M ${B.solar.x} ${B.solar.y} C 55 40 70 52 ${B.windows.x} ${B.windows.y}`,
  /** Solar roof → Powerwall (front wall). Slope down to the facade. */
  solarToPowerwall:   `M ${B.solar.x} ${B.solar.y} C 50 42 60 54 ${B.powerwall.x} ${B.powerwall.y}`,
  /** Solar roof → second Powerwall. */
  solarToPowerwall2:  `M ${B.solar.x} ${B.solar.y} C 48 44 56 56 ${B.powerwall2.x} ${B.powerwall2.y}`,
  /** Powerwall → windows. Short rightward arc along the front wall. */
  powerwallToHome:    `M ${B.powerwall.x} ${B.powerwall.y} C 73 62 78 60 ${B.windows.x} ${B.windows.y}`,
  /** Second Powerwall → windows. */
  powerwall2ToHome:   `M ${B.powerwall2.x} ${B.powerwall2.y} C 70 63 76 61 ${B.windows.x} ${B.windows.y}`,
  /** Grid meter → windows. Short leftward arc along the front wall. */
  gridToHome:         `M ${B.gridMeter.x} ${B.gridMeter.y} C 89 62 86 60 ${B.windows.x} ${B.windows.y}`,
  /** Windows → grid meter (export). Reverse of above. */
  homeToGrid:         `M ${B.windows.x} ${B.windows.y} C 86 60 89 62 ${B.gridMeter.x} ${B.gridMeter.y}`,
  /** Wall charger → parked EV. Short arc out of the garage to the driveway. */
  chargerToEv:        `M ${B.wallCharger.x} ${B.wallCharger.y} C 24 67 20 70 ${B.carPark.x} ${B.carPark.y}`,
} as const);

