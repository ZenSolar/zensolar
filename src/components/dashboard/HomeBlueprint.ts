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
  /** Center of the solar panel array on the roof. */
  solar:        { x: 40, y: 33 } as BlueprintAnchor,
  /** White Powerwall cabinet, mounted on the right gable wall. */
  powerwall:    { x: 74, y: 67 } as BlueprintAnchor,
  /** Lit 4-window cluster on the right gable — used as the home-load anchor. */
  windows:      { x: 80, y: 60 } as BlueprintAnchor,
  /** Recessed front door (center of porch). */
  frontDoor:    { x: 48, y: 65 } as BlueprintAnchor,
  /** Small grey utility/grid meter box at the far-right baseline. */
  gridMeter:    { x: 90, y: 68 } as BlueprintAnchor,
  /** Tesla Wall Connector, mounted inside the garage on the left wall. */
  wallCharger:  { x: 10, y: 60 } as BlueprintAnchor,
  /** Driveway parking spot in front of the garage. Anchor = car center. */
  carPark:      { x: 22, y: 82 } as BlueprintAnchor,
  /** Dynamic-vehicle <image> overlay dimensions, % of viewBox. */
  carWidth: 34,
  carHeight: 18,
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
  solarToHome:        `M ${B.solar.x} ${B.solar.y} C 55 38 70 52 ${B.windows.x} ${B.windows.y}`,
  /** Solar roof → Powerwall. Tight arc down the right slope. */
  solarToPowerwall:   `M ${B.solar.x} ${B.solar.y} C 58 40 70 55 ${B.powerwall.x} ${B.powerwall.y}`,
  /** Powerwall → home windows. Short upward arc. */
  powerwallToHome:    `M ${B.powerwall.x} ${B.powerwall.y} C 76 64 78 62 ${B.windows.x} ${B.windows.y}`,
  /** Grid meter → home windows. Short horizontal arc along the right wall. */
  gridToHome:         `M ${B.gridMeter.x} ${B.gridMeter.y} C 86 66 84 62 ${B.windows.x} ${B.windows.y}`,
  /** Home windows → grid meter (export). Reverse of above. */
  homeToGrid:         `M ${B.windows.x} ${B.windows.y} C 84 62 86 66 ${B.gridMeter.x} ${B.gridMeter.y}`,
  /** Wall charger → parked EV. Short horizontal arc inside the garage. */
  chargerToEv:        `M ${B.wallCharger.x} ${B.wallCharger.y} C 14 68 18 78 ${B.carPark.x} ${B.carPark.y}`,
} as const);
