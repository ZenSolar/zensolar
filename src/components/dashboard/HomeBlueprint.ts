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
 * Calibrated against `house-day.png` v4 (Powerwall on right gable wall).
 * All four hero variants (day/night/night-ev/rain) share identical camera
 * and feature positions, so this blueprint locks every halo across scenes.
 *
 * NEVER hard-code `bottom-[X%] left-[Y%]` for scene overlays again. If a
 * device feels mis-aligned, tweak ONE number here and every halo, dot, and
 * dynamic-vehicle overlay updates in lockstep.
 */

export type BlueprintAnchor = Readonly<{ x: number; y: number }>;

export const HOME_BLUEPRINT = Object.freeze({
  /** Center of the solar panel array on the roof (front-facing slope). */
  solar:        { x: 58, y: 38 } as BlueprintAnchor,
  /** White Powerwall cabinet, mounted on the right gable wall. */
  powerwall:    { x: 82, y: 65 } as BlueprintAnchor,
  /** Lit 4-window cluster on the right gable — used as the home-load anchor. */
  windows:      { x: 78, y: 58 } as BlueprintAnchor,
  /** Recessed front door (center of porch). */
  frontDoor:    { x: 48, y: 65 } as BlueprintAnchor,
  /** Small grey utility/grid meter box at the far-right baseline. */
  gridMeter:    { x: 94, y: 72 } as BlueprintAnchor,
  /** Tesla Wall Connector, mounted inside the garage on the left wall. */
  wallCharger:  { x: 22, y: 62 } as BlueprintAnchor,
  /** Driveway parking spot in front of the garage. Anchor = car center. */
  carPark:      { x: 37, y: 76 } as BlueprintAnchor,
  /** Dynamic-vehicle <image> overlay dimensions, % of viewBox. */
  carWidth: 30,
  carHeight: 16,
} as const);

/**
 * Cubic-bezier paths between blueprint anchors. Control points are tuned so
 * lines hug the silhouette of the house rather than crossing it.
 *
 * Path syntax: `M startX startY C ctrl1X ctrl1Y, ctrl2X ctrl2Y, endX endY`.
 */
const B = HOME_BLUEPRINT;
export const BLUEPRINT_PATHS = Object.freeze({
  /** Solar roof → lit windows (home load). Arcs down the right roof slope. */
  solarToHome:        `M ${B.solar.x} ${B.solar.y} C 62 42 72 52 ${B.windows.x} ${B.windows.y}`,
  /** Solar roof → Powerwall. Down the right slope to the cabinet. */
  solarToPowerwall:   `M ${B.solar.x} ${B.solar.y} C 65 44 76 56 ${B.powerwall.x} ${B.powerwall.y}`,
  /** Powerwall → home windows. Short upward arc along the right wall. */
  powerwallToHome:    `M ${B.powerwall.x} ${B.powerwall.y} C 82 63 80 60 ${B.windows.x} ${B.windows.y}`,
  /** Grid meter → home windows. Arc inward along the right wall. */
  gridToHome:         `M ${B.gridMeter.x} ${B.gridMeter.y} C 90 68 84 62 ${B.windows.x} ${B.windows.y}`,
  /** Home windows → grid meter (export). Reverse of above. */
  homeToGrid:         `M ${B.windows.x} ${B.windows.y} C 84 62 90 68 ${B.gridMeter.x} ${B.gridMeter.y}`,
  /** Wall charger → parked EV. Short horizontal arc out of the garage. */
  chargerToEv:        `M ${B.wallCharger.x} ${B.wallCharger.y} C 26 70 32 75 ${B.carPark.x} ${B.carPark.y}`,
} as const);
