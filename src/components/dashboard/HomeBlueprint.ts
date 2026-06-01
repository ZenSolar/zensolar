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
  solar:        { x: 48, y: 27 } as BlueprintAnchor,
  /** White Powerwall cabinet on porch, immediately left of the lit windows. */
  powerwall:    { x: 78, y: 62 } as BlueprintAnchor,
  /** Optional second Powerwall, stacked horizontally next to the first. */
  powerwall2:   { x: 72, y: 64 } as BlueprintAnchor,
  /** 4-window lit cluster on the right side of the front facade. */
  windows:      { x: 85, y: 58 } as BlueprintAnchor,
  /** Recessed front door (center of porch). */
  frontDoor:    { x: 55, y: 66 } as BlueprintAnchor,
  /** Small grey utility/grid meter box at the right edge of the front wall. */
  gridMeter:    { x: 95, y: 62 } as BlueprintAnchor,
  /** Tesla Wall Connector inside the garage, mounted on the back wall. */
  wallCharger:  { x: 28, y: 60 } as BlueprintAnchor,
  /** Driveway parking spot in front of the garage. Anchor = car center. */
  carPark:      { x: 15, y: 71 } as BlueprintAnchor,
  /** "Charging at home" anchor — centered just outside the open garage door. */
  garageFront:  { x: 24, y: 76 } as BlueprintAnchor,
  /** Rectangle over the garage opening — used to paint a warm "door open" bloom. */
  garageOpening: { x: 13, y: 50, w: 22, h: 22 } as Readonly<{
    x: number; y: number; w: number; h: number;
  }>,
  /** Dynamic-vehicle <image> overlay dimensions, % of viewBox. */
  carWidth: 38,
  carHeight: 21,
} as const);

/**
 * Cubic-bezier paths between blueprint anchors. Control points hug the
 * actual silhouette of the rendered house (roof slope → eave → front wall →
 * baseline) instead of cutting diagonals through it.
 */
const B = HOME_BLUEPRINT;
export const BLUEPRINT_PATHS = Object.freeze({
  /** Solar roof → lit windows. Down the front roof slope to the right eave. */
  solarToHome:        `M ${B.solar.x} ${B.solar.y} C 65 30 78 45 ${B.windows.x} ${B.windows.y}`,
  /** Solar roof → Powerwall (front porch). Slope down to the facade. */
  solarToPowerwall:   `M ${B.solar.x} ${B.solar.y} C 60 30 70 48 ${B.powerwall.x} ${B.powerwall.y}`,
  /** Solar roof → second Powerwall. */
  solarToPowerwall2:  `M ${B.solar.x} ${B.solar.y} C 58 32 65 50 ${B.powerwall2.x} ${B.powerwall2.y}`,
  /** Powerwall → windows. Short rightward arc along the front facade. */
  powerwallToHome:    `M ${B.powerwall.x} ${B.powerwall.y} C 80 61 83 59 ${B.windows.x} ${B.windows.y}`,
  /** Second Powerwall → windows. */
  powerwall2ToHome:   `M ${B.powerwall2.x} ${B.powerwall2.y} C 76 62 80 60 ${B.windows.x} ${B.windows.y}`,
  /** Grid meter → windows. Short leftward arc along the front wall. */
  gridToHome:         `M ${B.gridMeter.x} ${B.gridMeter.y} C 92 61 88 59 ${B.windows.x} ${B.windows.y}`,
  /** Windows → grid meter (export). Reverse of above. */
  homeToGrid:         `M ${B.windows.x} ${B.windows.y} C 88 59 92 61 ${B.gridMeter.x} ${B.gridMeter.y}`,
  /** Wall charger → parked EV. Short arc out of the garage to the driveway. */
  chargerToEv:        `M ${B.wallCharger.x} ${B.wallCharger.y} C 24 64 19 68 ${B.carPark.x} ${B.carPark.y}`,
} as const);

