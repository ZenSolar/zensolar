/**
 * HomeBlueprint — single source of truth for every spatial anchor used by
 * the ZenEnergy Monitoring Live card.
 *
 * v5.1: anchors re-measured against the baked PNGs in
 * `src/assets/zencasa/house-*.png`. In those renders the Powerwall sits
 * front-left of the porch (not on the right) and the grid meter sits on
 * the far-right wall — earlier anchors had these swapped, which made the
 * pw→home flow look like it leaked from the grid into the front door.
 *
 * All values are in viewBox 0–100 space (square, xMidYMid meet).
 *
 *   Garage / driveway (left)  →  Powerwall (front-left of porch)
 *                             →  Front door / windows (center-right)
 *                             →  Grid meter (far right wall)
 */

export type BlueprintAnchor = Readonly<{ x: number; y: number }>;

export const HOME_BLUEPRINT = Object.freeze({
  /** Solar panel array center on the front-facing roof slope. */
  solar:        { x: 58, y: 30 } as BlueprintAnchor,
  /** Center of the lit-window cluster on the front-right wall. */
  windows:      { x: 75, y: 58 } as BlueprintAnchor,
  /** Primary Powerwall — white cabinet tucked against the front-left
   *  porch wall in the baked PNG. */
  powerwall:    { x: 40, y: 68 } as BlueprintAnchor,
  /** Optional second Powerwall stacked just below the first. */
  powerwall2:   { x: 40, y: 74 } as BlueprintAnchor,
  /** Front door (porch). */
  frontDoor:    { x: 53, y: 70 } as BlueprintAnchor,
  /** Utility grid meter — small box mounted on the far-right wall. */
  gridMeter:    { x: 90, y: 62 } as BlueprintAnchor,
  /** Tesla Wall Connector mounted inside the garage. */
  wallCharger:  { x: 18, y: 60 } as BlueprintAnchor,
  /** Driveway parking spot in front of the garage (car center). */
  carPark:      { x: 22, y: 82 } as BlueprintAnchor,
  /** "Charging at home" anchor — pulls the car up to the garage apron. */
  garageFront:  { x: 22, y: 76 } as BlueprintAnchor,
  /** Rectangle over the garage opening — used to paint a warm "door open" bloom. */
  garageOpening: { x: 4, y: 50, w: 26, h: 22 } as Readonly<{
    x: number; y: number; w: number; h: number;
  }>,
  /** Dynamic-vehicle <image> overlay dimensions, % of viewBox. */
  carWidth: 54,
  carHeight: 30,

  /**
   * v5 multi-battery support — up to 5 Powerwall units stacked along
   * the front-left porch wall. Slot 0 == legacy `powerwall` anchor.
   */
  powerwallSlots: [
    { x: 40, y: 68 },
    { x: 40, y: 74 },
    { x: 44, y: 68 },
    { x: 44, y: 74 },
    { x: 44, y: 80 },
  ] as readonly BlueprintAnchor[],
} as const);

/**
 * Cubic-bezier paths between blueprint anchors.
 *
 * v5.1: re-routed for the corrected anchor map. `powerwallToHome` arcs
 * LEFT→RIGHT along the foundation (not straight up into the roof), and
 * `gridToHome` arcs IN from the right wall (not horizontally through
 * the front door).
 */
const B = HOME_BLUEPRINT;
export const BLUEPRINT_PATHS = Object.freeze({
  /** Solar roof → lit windows. Down the facade to the window cluster. */
  solarToHome:        `M ${B.solar.x} ${B.solar.y} C ${B.solar.x + 4} 42 ${B.windows.x - 2} 50 ${B.windows.x} ${B.windows.y}`,
  /** Solar roof → primary Powerwall. Down-left along the gable. */
  solarToPowerwall:   `M ${B.solar.x} ${B.solar.y} C 52 42 44 56 ${B.powerwall.x} ${B.powerwall.y}`,
  /** Solar roof → second Powerwall. */
  solarToPowerwall2:  `M ${B.solar.x} ${B.solar.y} C 52 46 44 62 ${B.powerwall2.x} ${B.powerwall2.y}`,
  /** Powerwall → windows. Rightward arc along the front wall. */
  powerwallToHome:    `M ${B.powerwall.x} ${B.powerwall.y} C 50 68 62 62 ${B.windows.x} ${B.windows.y}`,
  /** Second Powerwall → windows. */
  powerwall2ToHome:   `M ${B.powerwall2.x} ${B.powerwall2.y} C 50 72 62 64 ${B.windows.x} ${B.windows.y}`,
  /** Grid meter → windows. Leftward arc in from the right wall. */
  gridToHome:         `M ${B.gridMeter.x} ${B.gridMeter.y} C 86 60 80 58 ${B.windows.x} ${B.windows.y}`,
  /** Windows → grid meter (export). Mirror of import arc. */
  homeToGrid:         `M ${B.windows.x} ${B.windows.y} C 80 58 86 60 ${B.gridMeter.x} ${B.gridMeter.y}`,
  /** Solar → grid direct export. Over-the-ridge arc to the right meter. */
  solarToGrid:        `M ${B.solar.x} ${B.solar.y} C 72 32 86 50 ${B.gridMeter.x} ${B.gridMeter.y}`,
  /** Wall connector → parked EV charge port. Short, taut arc. */
  chargerToEv:        `M ${B.wallCharger.x} ${B.wallCharger.y} C ${B.wallCharger.x} 72 ${B.carPark.x + 4} 78 ${B.carPark.x + 8} ${B.carPark.y - 2}`,
} as const);
