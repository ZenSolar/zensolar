/**
 * carAutoFit — resolution-independent vehicle placement for the ZenEnergy
 * live scene.
 *
 * Problem this solves: the vehicle sprites are a mixed library (26 assets,
 * different intrinsic aspect ratios and different amounts of transparent
 * padding). Previously every car was drawn into one hard-coded 50×28 box
 * with `preserveAspectRatio="meet"`, so anything narrower than the box got
 * letterboxed — the sprite floated above its own ground shadow and slid out
 * of the garage bay. Squarer sprites overhung the bay instead.
 *
 * The fix is to stop positioning the *box* and start positioning the *car*:
 *
 *   1. every parking spot is declared as a BAY — a centre line, a contact
 *      (ground) line, and the maximum width/height the bay can swallow;
 *   2. the sprite's true aspect ratio is measured at runtime;
 *   3. the sprite is fitted inside the bay preserving that aspect, then
 *      seated so its wheels land exactly on the bay's contact line and
 *      clamped so it can never leave the scene.
 *
 * Everything is expressed in the scene's viewBox 0–100 space, which is
 * mapped with `preserveAspectRatio="xMidYMid meet"`, so the result is
 * identical on a 320px phone and a 1440px desktop — no device breakpoints.
 */

export type VehicleBay = Readonly<{
  /** Horizontal centre of the parking spot. */
  cx: number;
  /** Ground contact line — where the tyres must land. */
  groundY: number;
  /** Widest the vehicle may be drawn in this bay. */
  maxWidth: number;
  /** Tallest the vehicle may be drawn in this bay. */
  maxHeight: number;
}>;

export type FittedVehicle = Readonly<{
  /** <image> box. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Centre of the drawn sprite. */
  cx: number;
  cy: number;
  /** Contact line the ground shadows must sit on. */
  groundY: number;
}>;

/**
 * Fraction of the sprite box height at which the tyres sit. The library is
 * rendered with a small transparent margin below the wheels, so the visual
 * contact line is slightly above the box bottom.
 */
export const SPRITE_CONTACT_RATIO = 0.9;

/** Fallback aspect ratio (w/h) used until the real sprite has loaded. */
export const DEFAULT_SPRITE_ASPECT = 50 / 28;

/**
 * Opaque content box of a sprite, expressed as fractions of the full PNG.
 * The vehicle library is exported on square canvases with a lot of
 * transparent padding, so the PNG's own aspect ratio says nothing about the
 * car. Measuring the opaque pixels lets us fit the CAR to the bay instead of
 * fitting the empty canvas to the bay (which letterboxed every sprite down
 * to a fraction of the parking spot).
 */
export type SpriteContentBox = Readonly<{
  /** Left edge of the opaque content, 0–1 of image width. */
  left: number;
  /** Top edge of the opaque content, 0–1 of image height. */
  top: number;
  /** Opaque content width, 0–1 of image width. */
  width: number;
  /** Opaque content height, 0–1 of image height. */
  height: number;
  /** Opaque content aspect ratio (w/h) in absolute pixels. */
  aspect: number;
}>;

/** Content box used before the sprite has been measured. */
export const DEFAULT_CONTENT_BOX: SpriteContentBox = Object.freeze({
  left: 0,
  top: 0,
  width: 1,
  height: 1,
  aspect: DEFAULT_SPRITE_ASPECT,
});

/** Keeps the fitted sprite inside the visible viewBox. */
const VIEWBOX_PAD = 1;

/**
 * Fit a vehicle sprite into a bay, preserving its intrinsic aspect ratio.
 *
 * @param bay     target parking spot
 * @param aspect  sprite intrinsic width / height
 * @param scale   optional shrink factor (e.g. 0.84 when two cars share the
 *                driveway); clamped to (0, 1]
 */
export function fitVehicleToBay(
  bay: VehicleBay,
  aspect: number | SpriteContentBox,
  scale = 1,
): FittedVehicle {
  if (typeof aspect !== 'number') {
    return fitVehicleContentToBay(bay, aspect, scale);
  }
  const safeAspect =
    Number.isFinite(aspect) && aspect > 0 ? aspect : DEFAULT_SPRITE_ASPECT;
  const k = Math.min(1, Math.max(0.2, Number.isFinite(scale) ? scale : 1));

  const budgetW = bay.maxWidth * k;
  const budgetH = bay.maxHeight * k;

  // Contain: the larger of the two constraints wins, aspect never breaks.
  let width = budgetW;
  let height = width / safeAspect;
  if (height > budgetH) {
    height = budgetH;
    width = height * safeAspect;
  }

  // Seat the tyres on the bay's contact line.
  let x = bay.cx - width / 2;
  const y = bay.groundY - height * SPRITE_CONTACT_RATIO;

  // Clamp horizontally so a very wide sprite never spills off the canvas.
  if (x < VIEWBOX_PAD) x = VIEWBOX_PAD;
  if (x + width > 100 - VIEWBOX_PAD) x = 100 - VIEWBOX_PAD - width;

  return {
    x,
    y,
    width,
    height,
    cx: x + width / 2,
    cy: y + height / 2,
    groundY: bay.groundY,
  };
}

/**
 * Content-aware fit: sizes and seats the CAR (the opaque pixels) inside the
 * bay, then back-computes the <image> box that puts those pixels there. The
 * transparent padding is allowed to overflow the bay — it draws nothing.
 */
export function fitVehicleContentToBay(
  bay: VehicleBay,
  content: SpriteContentBox,
  scale = 1,
): FittedVehicle {
  const cw = clamp01(content.width) || 1;
  const ch = clamp01(content.height) || 1;
  const left = clamp01(content.left);
  const top = clamp01(content.top);
  const aspect =
    Number.isFinite(content.aspect) && content.aspect > 0
      ? content.aspect
      : DEFAULT_SPRITE_ASPECT;

  const k = Math.min(1, Math.max(0.2, Number.isFinite(scale) ? scale : 1));
  const budgetW = bay.maxWidth * k;
  const budgetH = bay.maxHeight * k;

  // Size the visible car inside the bay budget, aspect preserved.
  let carW = budgetW;
  let carH = carW / aspect;
  if (carH > budgetH) {
    carH = budgetH;
    carW = carH * aspect;
  }

  // Back out the full <image> box that places that content correctly.
  const width = carW / cw;
  const height = carH / ch;

  // Seat the tyres (content bottom) exactly on the bay contact line and
  // centre the CAR — not the canvas — on the bay centre line.
  let x = bay.cx - carW / 2 - left * width;
  const y = bay.groundY - carH - top * height;

  // Clamp on the visible car so it never leaves the scene.
  const carLeft = x + left * width;
  if (carLeft < VIEWBOX_PAD) x += VIEWBOX_PAD - carLeft;
  const carRight = x + left * width + carW;
  if (carRight > 100 - VIEWBOX_PAD) x -= carRight - (100 - VIEWBOX_PAD);

  return {
    x,
    y,
    width,
    height,
    cx: x + left * width + carW / 2,
    cy: y + top * height + carH / 2,
    groundY: bay.groundY,
  };
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}
