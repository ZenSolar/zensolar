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
  /** "Charging at home" anchor — pulls the car up to the garage apron.
   *  v5.2: nudged left/down so the sprite reads as sitting inside the
   *  garage bay instead of floating across the driveway. */
  garageFront:  { x: 26, y: 76 } as BlueprintAnchor,
  /** Rectangle over the garage opening — used to paint a warm "door open" bloom. */
  garageOpening: { x: 4, y: 50, w: 26, h: 22 } as Readonly<{
    x: number; y: number; w: number; h: number;
  }>,
  /** Dynamic-vehicle <image> overlay dimensions, % of viewBox.
   *  v5.2: scaled down so the car matches the house's isometric scale
   *  and tucks into the bay rather than overhanging it.
   *  v5.3: these are now the BUDGET for the auto-fit (see `bays` below),
   *  not the literal drawn box — the sprite is contained inside them at
   *  its own aspect ratio. */
  carWidth: 50,
  carHeight: 28,
  /** Car dimensions when two vehicles share the driveway. */
  carWidthDual: 42,
  carHeightDual: 24,

  /**
   * v5.3 — parking BAYS. Each bay declares a centre line, the ground
   * contact line the tyres must land on, and the largest box the spot can
   * swallow. `fitVehicleToBay()` contains the sprite inside that budget at
   * its true aspect ratio, so mixed-aspect sprites all seat identically and
   * the layout is resolution-independent (viewBox 0–100 space).
   *
   * Contact lines are derived from the legacy anchors so today's render is
   * preserved: groundY = anchor.y + boxHeight * 0.358.
   */
  bays: {
    /** Retained for API compatibility; EV1 no longer parks in the bay. */
    garage:    { cx: 22, groundY: 70.0, maxWidth: 26, maxHeight: 15 },
    /** v12c driveway apron in front of the garage (plate px cx 266,
     *  contact line y 784). Single fixed pose, parallel to the facade. */
    driveway:  { cx: 26, groundY: 76.5, maxWidth: 32, maxHeight: 18 },
  } as Readonly<
    Record<'garage' | 'driveway', Readonly<{
      cx: number; groundY: number; maxWidth: number; maxHeight: number;
    }>>
  >,




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
  /**
   * Wall connector → charge port of a vehicle that has pulled up to the
   * garage apron (`garageFront`). While charging the car sits at a
   * different anchor than `carPark`, so reusing `chargerToEv` drew the
   * current into empty driveway and read as a moving car. This path lands
   * on the same port coordinate the charge-port pulse uses:
   *   x = garageFront.x + carWidth * 0.30, y = garageFront.y - carHeight * 0.05
   */
  chargerToEvCharging: `M ${B.wallCharger.x} ${B.wallCharger.y} C ${B.wallCharger.x} ${B.garageFront.y - 6} ${B.garageFront.x + B.carWidth * 0.10} ${B.garageFront.y - 1} ${B.garageFront.x + B.carWidth * 0.30} ${B.garageFront.y - B.carHeight * 0.05}`,
} as const);

/**
 * SCENE CAMERA — framing only, never layout.
 *
 * The baked art is a 1024² square in which the house occupies only
 * y≈18.5%–86%: a wide band of empty sky above the roofline and empty
 * pavement below the driveway edge. At that framing a ~9-unit conductor
 * run (grid's short local drop, the EV cable) reads as a faint mark.
 *
 * This is a crop of the SAME coordinate system — every anchor keeps its
 * existing 0–100 value. Layers just view a sub-window of it:
 *   · SVG layers  → viewBox = SCENE_CAMERA.viewBox
 *   · <img> layer → scaled/offset to match that window exactly
 *   · HTML chips  → mapped through camPctX / camPctY
 *
 * Margin above the roof (13 → 18.5) is kept for the corner readouts and
 * the sun/moon band; margin below the apron (86 → 91) seats the ground
 * shadows. All 7 scene variants inherit this framing.
 */
export const SCENE_CAMERA = Object.freeze({
  x: 0,
  y: 18,
  w: 100,
  h: 70,
  viewBox: '0 18 100 70',
  /** CSS aspect-ratio for every stage box, so img and SVG stay in register. */
  aspect: '100 / 70',
  /** <img> sizing that reproduces the viewBox crop exactly. */
  imgStyle: {
    width: '100%',
    height: `${(100 / 70) * 100}%`,
    marginTop: `${-(18 / 70) * 100}%`,
  } as const,
});


/** Map a blueprint x (0–100 source space) to a % offset inside the camera box. */
export const camPctX = (x: number) => ((x - SCENE_CAMERA.x) / SCENE_CAMERA.w) * 100;
/** Map a blueprint y (0–100 source space) to a % offset inside the camera box. */
export const camPctY = (y: number) => ((y - SCENE_CAMERA.y) / SCENE_CAMERA.h) * 100;
