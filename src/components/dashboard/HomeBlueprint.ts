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
 */

export type BlueprintAnchor = Readonly<{ x: number; y: number }>;

export const HOME_BLUEPRINT = Object.freeze({
  /** Center of the solar panel array on the roof (front-facing slope). */
  solar:        { x: 58, y: 38 } as BlueprintAnchor,
  /** White Powerwall cabinet, mounted on the right gable wall (top unit). */
  powerwall:    { x: 82, y: 65 } as BlueprintAnchor,
  /** Optional second Powerwall, stacked vertically below the first. */
  powerwall2:   { x: 82, y: 76 } as BlueprintAnchor,
  /** Lit 4-window cluster — raised up toward the roof eave to free wall space. */
  windows:      { x: 78, y: 52 } as BlueprintAnchor,
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
 * lines hug the silhouette of the house (roof slope → vertical wall drop →
 * baseline) rather than cutting diagonals through the building.
 */
const B = HOME_BLUEPRINT;
export const BLUEPRINT_PATHS = Object.freeze({
  /** Solar roof → lit windows. Tracks down the right roof slope to the eave. */
  solarToHome:        `M ${B.solar.x} ${B.solar.y} C 64 40 72 46 ${B.windows.x} ${B.windows.y}`,
  /** Solar roof → top Powerwall. Down the slope, then vertical along right wall. */
  solarToPowerwall:   `M ${B.solar.x} ${B.solar.y} C 70 42 82 50 ${B.powerwall.x} ${B.powerwall.y}`,
  /** Solar roof → bottom (stacked) Powerwall. */
  solarToPowerwall2:  `M ${B.solar.x} ${B.solar.y} C 70 42 82 55 ${B.powerwall2.x} ${B.powerwall2.y}`,
  /** Top Powerwall → windows. Tight vertical arc hugging the right wall. */
  powerwallToHome:    `M ${B.powerwall.x} ${B.powerwall.y} C 82 60 80 55 ${B.windows.x} ${B.windows.y}`,
  /** Bottom Powerwall → windows. Same wall, longer reach. */
  powerwall2ToHome:   `M ${B.powerwall2.x} ${B.powerwall2.y} C 82 68 80 58 ${B.windows.x} ${B.windows.y}`,
  /** Grid meter → windows. Up the wall, then up to the lit cluster. */
  gridToHome:         `M ${B.gridMeter.x} ${B.gridMeter.y} C 90 68 82 58 ${B.windows.x} ${B.windows.y}`,
  /** Windows → grid meter (export). Down the wall, then along baseline. */
  homeToGrid:         `M ${B.windows.x} ${B.windows.y} C 82 58 90 68 ${B.gridMeter.x} ${B.gridMeter.y}`,
  /** Wall charger → parked EV. Out of the garage and down the driveway curve. */
  chargerToEv:        `M ${B.wallCharger.x} ${B.wallCharger.y} C 24 70 30 76 ${B.carPark.x} ${B.carPark.y}`,
} as const);
