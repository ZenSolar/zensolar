/**
 * ConductorNetwork — trunk-and-branch energy routing for the ZenEnergy
 * Monitoring live card.
 *
 * TOPOLOGY (mirrors the Tesla app; one trunk, one junction, four branches)
 *
 *     roofArrayEdge ──▶ wallJunction ─┬─▶ gridWallEnd         (grid)
 *          (trunk)                    ├─▶ homeWallStub        (house load)
 *                                     ├─▶ powerwall           (battery)
 *                                     └─▶ evPort              (vehicle)
 *
 * A branch renders only when its flow is non-zero. Nothing draws to a device
 * that is idle or absent.
 *
 * ANCHORS — verified visually with the `?anchors=1` debug overlay against the
 * baked `house-day*.png` art (see /prototype/cockpit-anchors). Each entry
 * below names the physical object it sits on.
 *
 * STYLE — matches the Tesla app reference frame: every conductor is a THIN,
 * UNIFORM-WEIGHT line in a single neutral grey/white. Magnitude is carried by
 * the numeric label at each end, never by stroke width and never by hue.
 * (This supersedes the earlier "width proportional to kW / one accent per
 * source" rules.) EV is the sole exception — Tesla's app has no vehicle branch,
 * so ZenSolar's addition stays violet, but at the same thin uniform weight.

 */

export type Pt = Readonly<{ x: number; y: number }>;

/**
 * The house art is laid out at h-[92%] of the card while this overlay is
 * h-[88%] — both centred and square. Anchors are measured as percent of the
 * baked PNG, so convert once here.
 *
 *   overlay = (0.92 * img/100 - 0.02) * 100 / 0.88
 */
export function fromHouseImage(x: number, y: number): Pt {
  const conv = (v: number) => Math.round(((0.92 * v) / 100 - 0.02) * (100 / 0.88) * 100) / 100;
  return { x: conv(x), y: conv(y) };
}

/**
 * Named anchors in overlay space (0–100, square). Values below were read off
 * the `?anchors=1` capture, so they are given directly rather than through
 * `fromHouseImage`.
 *
 * v6 — UTILITY CLUSTER MOVED TO THE GARAGE SIDE. Previously the service
 * panel sat at gutter height on the right facade, directly across the window
 * bank, so every branch cut through glass and the home run terminated ON a
 * window. The whole cluster (panel + meter can + Powerwall) now sits at
 * wall-base height on the garage side, in the same zone as `chargePoint`,
 * which is where a real service entrance and battery are mounted anyway.
 *
 *   roofArrayEdge  lower-LEFT corner of the PV array, where it meets the eave
 *   wallJunction   service panel + meter can, garage-side facade at wall base
 *   homeWallStub   short wall-mounted load tap beside the window bank
 *   powerwall      battery cabinet, garage-side wall beside the panel
 *   gridWallEnd    bottom of the meter conduit on the equipment-wall foundation
 *   evPort         charge port on the near quarter of the parked vehicle
 */
export const SCENE_ANCHORS = Object.freeze({
  /** v13: eave line directly above the service panel. */
  roofArrayEdge: { x: 50.5, y: 34.6 } as Pt,
  /** v17: start of the solar run, up-RIGHT on the panel field so the diagonal
   *  descends from upper-right down-left into the gutter. */
  roofArrayMiddle: { x: 54.6, y: 24.0 } as Pt,
  /** v16: eave / gutter line directly above the service panel. The solar run
   *  reaches the roof edge here, then drops vertically down the facade. */
  roofGutter:    { x: 50.5, y: 30.6 } as Pt,
  /** Service panel + meter can, baked into the v13 equipment wall.
   *  The ONLY metering object in the scene.
   *  v18: dropped slightly (46.0 → 47.0) so the wall run sits lower. */
  wallJunction:  { x: 50.5, y: 47.0 } as Pt,
  /** v19: home load tap STOPS at the left outer frame edge of the 2x2 window
   *  cluster — it no longer runs over glass. Measured on the v13 plate: the
   *  left frame edge sits at x ≈ 685px (66.9%), and the run lands in the
   *  frame gap between the top and bottom window rows (y ≈ 499–511px). */
  homeWallStub:  { x: 66.4, y: 49.6 } as Pt,

  /** Powerwall cabinet, slightly higher than the panel on the same sloped
   *  perspective wall line. */
  powerwall:     { x: 33.3, y: 46.0 } as Pt,
  /** v18: true foundation line — where the facade meets the concrete plinth
   *  directly below the meter can (plate y ≈ 588px). The grid run drops
   *  vertically to here before bending into the yard diagonal. */
  gridWallEnd:   { x: 50.5, y: 57.4 } as Pt,
  /** v15: the grid run leaves the yard at the lower-LEFT of the visible ground,
   *  well clear of the charge cable's corridor at the garage corner. */
  gridYard:      { x: 30.2, y: 81.0 } as Pt,
  evPort:        { x: 24.9, y: 64.1 } as Pt,

  /** v15: wall box at the garage's far-LEFT corner. Cable drops straight to
   *  the apron and bends right to the car's rear. */
  chargePoint:   { x: 6.2, y: 41.8 } as Pt,

});


/**
 * v20 — SERVICE PANEL BOX GEOMETRY.
 *
 * `ServicePanelGlyph` draws the panel as a rounded rect centred on
 * `wallJunction`, with a meter can + conduit stub hanging below it. Conductors
 * must land on that box's EXTERIOR surface — no gap, no overlap into its
 * interior — so the exact rectangle is published here and every branch
 * terminates against it rather than at the abstract anchor.
 */
const PANEL_W = 3.4;
const PANEL_H = 4.4;
export const PANEL_BOX = Object.freeze({
  w: PANEL_W,
  h: PANEL_H,
  x: SCENE_ANCHORS.wallJunction.x - PANEL_W / 2,
  y: SCENE_ANCHORS.wallJunction.y - PANEL_H / 2 - 0.6,
});

/** Slope of the wall perspective line the battery/home runs follow. */
const wallSlope = (from: Pt, to: Pt, atX: number) =>
  from.y + ((to.y - from.y) / (to.x - from.x)) * (atX - from.x);

/**
 * Powerwall cabinet right-face contact point (see `POWERWALL_CORE` below).
 * Its x-coordinate is the verified no-overlap outline contact. Its y-coordinate
 * is the battery anchor's centerline, so the conductor points directly at the
 * red debug anchor while its cap still stops at the cabinet's right outline.
 */
const HOME_WALL_SLOPE =
  (SCENE_ANCHORS.homeWallStub.y - SCENE_ANCHORS.wallJunction.y) /
  (SCENE_ANCHORS.homeWallStub.x - SCENE_ANCHORS.wallJunction.x);
const POWERWALL_FACE_X = 35.75;
const PW_CORE = {
  x: POWERWALL_FACE_X,
  y: SCENE_ANCHORS.powerwall.y,
};

/** Exterior contact points on the panel box, one per branch. */
export const PANEL_PORTS = Object.freeze({
  /** Top face — the solar drop lands here. */
  solar: { x: SCENE_ANCHORS.wallJunction.x, y: PANEL_BOX.y } as Pt,
  /** Right face — the home run leaves here, on the wall's perspective line. */
  home: {
    x: PANEL_BOX.x + PANEL_W,
    y: wallSlope(SCENE_ANCHORS.wallJunction, SCENE_ANCHORS.homeWallStub, PANEL_BOX.x + PANEL_W),
  } as Pt,
  /** Left face — the Powerwall run leaves here. v24: its slope is the MIRROR
   *  of the home run's slope (same rise per unit of horizontal travel, opposite
   *  direction), so both sides of the junction read as one line bending only at
   *  the panel. `POWERWALL_CORE` is fixed, so the port height is solved back
   *  from it rather than from the old `powerwall` anchor. */
  battery: (() => {
    const j = SCENE_ANCHORS.wallJunction;
    // Aim the panel-side run directly at the battery anchor centerline.
    const x = PANEL_BOX.x;
    return { x, y: wallSlope(j, PW_CORE, x) } as Pt;
  })(),

  /** Bottom of the meter-can conduit stub — the grid run starts here. */
  grid: { x: SCENE_ANCHORS.wallJunction.x, y: PANEL_BOX.y + PANEL_H + 4.2 } as Pt,
});

/**
 * v23 — the Powerwall side STOPS AT the cabinet's outline. The conductor
 * approaches from the panel (east), so it lands on the cabinet's RIGHT face,
 * away from either corner and with no part of the stroke crossing into the
 * cabinet's body. The verified x contact remains fixed and y matches the
 * battery anchor, making the run point directly at the marked cabinet center.
 * The x value is pulled back by half the stroke width so the round cap kisses
 * the outline instead of overlapping it. Measured from a 12x render crop.
 */
export const POWERWALL_CORE = Object.freeze({ ...PW_CORE } as Pt);




/** Debug label order for the `?anchors=1` overlay. */
export const SCENE_ANCHOR_LIST = Object.entries(SCENE_ANCHORS) as ReadonlyArray<[string, Pt]>;

// Isometric axis: 30° rise over run (2:1 iso projection).
const ISO_SLOPE = 0.5;

/**
 * Two-leg isometric route between two anchors: one 30°/150° diagonal leg and
 * one vertical leg, ordered by `order`. Returns the polyline corner list.
 */
export function isoRoute(a: Pt, b: Pt, order: 'diag-first' | 'vert-first' = 'diag-first'): Pt[] {
  const dx = b.x - a.x;
  if (Math.abs(dx) < 0.001) return [a, b];

  const run = Math.abs(dx);
  const candidates: Pt[] = [
    { x: b.x, y: a.y + ISO_SLOPE * run }, // diag-first, down-slope
    { x: b.x, y: a.y - ISO_SLOPE * run }, // diag-first, up-slope
    { x: a.x, y: b.y - ISO_SLOPE * run }, // vert-first, down-slope
    { x: a.x, y: b.y + ISO_SLOPE * run }, // vert-first, up-slope
  ];
  const preferred = order === 'diag-first' ? [0, 1, 2, 3] : [2, 3, 0, 1];
  const lo = Math.min(a.y, b.y);
  const hi = Math.max(a.y, b.y);
  const excursion = (p: Pt) => Math.max(0, lo - p.y) + Math.max(0, p.y - hi);

  let corner = candidates[preferred[0]];
  let best = excursion(corner) * 10 + 0;
  preferred.forEach((idx, rank) => {
    const score = excursion(candidates[idx]) * 10 + rank;
    if (score < best) {
      best = score;
      corner = candidates[idx];
    }
  });

  corner = { x: corner.x, y: Math.min(hi, Math.max(lo, corner.y)) };
  return [a, corner, b];
}

/** Polyline → path string with short rounded corners at direction changes. */
export function roundedPath(pts: Pt[], r = 1.6): string {
  if (pts.length < 2) return '';
  const len = (p: Pt, q: Pt) => Math.hypot(q.x - p.x, q.y - p.y);
  const lerp = (p: Pt, q: Pt, t: number): Pt => ({
    x: p.x + (q.x - p.x) * t,
    y: p.y + (q.y - p.y) * t,
  });

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const next = pts[i + 1];
    const inLen = len(prev, cur);
    const outLen = len(cur, next);
    if (inLen < 0.01 || outLen < 0.01) continue;
    const rr = Math.min(r, inLen / 2, outLen / 2);
    const p1 = lerp(cur, prev, rr / inLen);
    const p2 = lerp(cur, next, rr / outLen);
    d += ` L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Q ${cur.x.toFixed(2)} ${cur.y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
  return d;
}

/** Midpoint of a polyline by arc length, plus the unit tangent there. */
export function polylineMidpoint(pts: Pt[]): { p: Pt; angle: number } {
  const segLens = pts.slice(1).map((q, i) => Math.hypot(q.x - pts[i].x, q.y - pts[i].y));
  const total = segLens.reduce((s, v) => s + v, 0);
  let target = total / 2;
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i] || i === segLens.length - 1) {
      const t = segLens[i] === 0 ? 0 : target / segLens[i];
      const a = pts[i];
      const b = pts[i + 1];
      return {
        p: { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t },
        angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
      };
    }
    target -= segLens[i];
  }
  return { p: pts[0], angle: 0 };
}

/**
 * kW → stroke width is NO LONGER used for conductor rendering. The reference
 * draws every run at the same thin weight; the helper stays exported because
 * `siteBalance` still asserts on it elsewhere.
 */
export { WIDTH_PER_KW, conductorWidth } from '@/lib/siteBalance';

/** Uniform conductor weight, in viewBox units. v20: thickened so the runs
 *  read as substantial at rest now that the direction chevrons are gone. */
export const CONDUCTOR_WIDTH = 0.78;

/**
 * The single neutral conductor colour. Grey-white, like the Tesla reference —
 * no per-source hue. Grid import/export, solar, home and battery all use it.
 */
export const CONDUCTOR_NEUTRAL = 'hsl(210 18% 82%)';

/**
 * GRID exception — the one run that leaves the building. Like the Tesla app it
 * is amber/gold where it leaves the meter (active flow at the house) and fades
 * to the plain muted conductor colour as it heads off toward the street.
 */
export const GRID_FLOW_STROKE = 'url(#grid-flow-fade)';

/** Gradient definition for `GRID_FLOW_STROKE`. Render once inside the scene SVG. */
export function GridFlowDefs() {
  const a = SCENE_ANCHORS.wallJunction;
  const b = SCENE_ANCHORS.gridYard;
  return (
    <defs>
      <linearGradient
        id="grid-flow-fade"
        gradientUnits="userSpaceOnUse"
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
      >
        <stop offset="0%" stopColor="hsl(42 96% 62%)" />
        <stop offset="38%" stopColor="hsl(42 80% 66%)" />
        <stop offset="100%" stopColor="hsl(215 12% 58%)" />
      </linearGradient>
    </defs>
  );
}


/** Legacy pulse timing helper — superseded by the uniform-speed flow sweep. */
const pulseDur = (kw: number) => Math.max(1.5, 3.4 - Math.min(Math.abs(kw), 8) * 0.2);
void pulseDur;


/**
 * Service panel + meter can mounted on the facade at `wallJunction`.
 *
 * In the Tesla reference the roof run drops into a small grey panel box on the
 * house wall and the grid run comes up out of the ground into the same box,
 * with a round meter can at its base. That rendered object is what makes the
 * diagram read as ONE electrical system rather than four unrelated lines, so
 * the junction is drawn, not merely implied.
 */
export function ServicePanelGlyph({ at = SCENE_ANCHORS.wallJunction }: { at?: Pt }) {
  const w = 3.4;
  const h = 4.4;
  const x = at.x - w / 2;
  const y = at.y - h / 2 - 0.6;
  return (
    <g style={{ pointerEvents: 'none' }} data-glyph="service-panel">
      {/* contact shadow */}
      <rect
        x={x + 0.25}
        y={y + 0.5}
        width={w}
        height={h}
        rx={0.5}
        fill="hsl(220 60% 4%)"
        opacity={0.5}
        style={{ filter: 'blur(0.5px)' }}
      />
      {/* panel body */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={0.5}
        fill="hsl(215 10% 42%)"
        stroke="hsl(210 16% 72%)"
        strokeWidth={0.22}
      />
      {/* door seam */}
      <line
        x1={x + 0.55}
        y1={y + 1.15}
        x2={x + w - 0.55}
        y2={y + 1.15}
        stroke="hsl(210 16% 78%)"
        strokeOpacity={0.5}
        strokeWidth={0.16}
      />
      {/* latch */}
      <circle cx={x + w - 0.75} cy={y + h / 2 + 0.4} r={0.22} fill="hsl(210 16% 80%)" opacity={0.7} />
      {/* meter can at the base */}
      <rect
        x={at.x - 1.0}
        y={y + h - 0.15}
        width={2.0}
        height={1.0}
        rx={0.25}
        fill="hsl(215 10% 38%)"
        stroke="hsl(210 16% 70%)"
        strokeWidth={0.18}
      />
      <circle
        cx={at.x}
        cy={y + h + 1.5}
        r={1.15}
        fill="hsl(215 12% 46%)"
        stroke="hsl(210 16% 76%)"
        strokeWidth={0.2}
      />
      <circle cx={at.x} cy={y + h + 1.5} r={0.62} fill="hsl(210 20% 88%)" opacity={0.55} />
      {/* service conduit down to grade */}
      <line
        x1={at.x}
        y1={y + h + 2.6}
        x2={at.x}
        y2={y + h + 4.2}
        stroke="hsl(215 10% 44%)"
        strokeWidth={0.42}
        strokeLinecap="round"
      />
    </g>
  );
}


export type ConductorLayer = 'behind' | 'front';

/**
 * FLOW COLOURS — fixed per conductor, never blended with the source mix.
 * The pipe itself stays neutral; only the travelling gradient segment is hued.
 */
export const FLOW_COLORS = Object.freeze({
  solar: 'hsl(38 98% 60%)',      // orange / gold
  grid: 'hsl(38 98% 60%)',       // v20: orange too — direction, not hue
  battery: 'hsl(151 76% 50%)',   // green
  home: 'hsl(38 98% 60%)',       // routed solar/grid — orange
  ev: 'hsl(265 90% 78%)',        // violet
});

/** Uniform travel speed, viewBox units per second. Never scales with kW. */
const FLOW_SPEED = 9;

/**
 * v21 — PHASE-LOCKED FLOW.
 *
 * Every travelling segment shares one wavelength and one period, so all SMIL
 * animations (which run on the shared SVG document timeline) stay in lockstep
 * for the life of the card. A branch that continues a wave arriving from
 * upstream declares how far that wave has already travelled (`phaseDist`);
 * the gradient origin is pushed back by that distance so the crest crossing
 * the junction leaves on the outgoing branches at the same instant it
 * arrives — one wave splitting, not three independent loops.
 */
const FLOW_WAVELENGTH = 22;
const FLOW_DUR = FLOW_WAVELENGTH / FLOW_SPEED;

/** Length of a polyline in viewBox units. */
export const polylineLength = (pts: Pt[]) =>
  pts.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);

export type ConductorSegment = {
  id: string;
  /** Ordered anchors — the route is built along the isometric axes. */
  points: Pt[];
  color: string;
  /** Fixed hue of the travelling gradient segment for this conductor. */
  flowColor?: string;
  kw: number;
  /** false → the travelling segment runs from the last point to the first. */
  forward?: boolean;
  layer: ConductorLayer;
  dimmed?: boolean;
  /** Renders grey, no pulse — the conduit exists but carries nothing. */
  idle?: boolean;
  /** Perpendicular-ish nudge, used to run two parallel lines on one path. */
  shiftY?: number;
  /** Suppress the base pipe — for the second line of a doubled run. */
  sweepOnly?: boolean;
  /** Arc distance the wave has already covered upstream, for phase locking. */
  phaseDist?: number;
};



/**
 * One anchor-to-anchor conductor. Reads as a physical run on the surface:
 *   1. soft dark shadow, offset down — attaches the run to the wall/roof
 *   2. solid conductor body, neutral at rest
 *   3. thin lighter stroke along the upper edge — a rounded conductor
 *      catching light
 *   4. a soft-edged colour segment travelling along the run
 *
 * v20: the static direction chevron is GONE. Direction is carried solely by
 * the motion of the travelling segment.
 */
export function Conductor({
  id,
  points,
  color,
  flowColor,
  kw,
  forward = true,
  dimmed,
  idle,
  shiftY = 0,
  sweepOnly,
  phaseDist = 0,
  reducedMotion,
}: Omit<ConductorSegment, 'layer'> & { reducedMotion?: boolean }) {
  const d = roundedPath(points);
  // Uniform weight — magnitude lives in the numeric labels, not the stroke.
  const w = CONDUCTOR_WIDTH;

  void kw;

  // Travelling gradient segment (Tesla-style soft sweep). v21: the gradient's
  // period is the SHARED wavelength, not this run's chord, and the origin is
  // pushed back by `phaseDist` so a wave continuing through the junction stays
  // continuous across branches.
  const start = points[0];
  const end = points[points.length - 1];
  const vx = end.x - start.x;
  const vy = end.y - start.y;
  const chord = Math.hypot(vx, vy) || 1;
  const ux = (forward ? vx : -vx) / chord;
  const uy = (forward ? vy : -vy) / chord;
  const dirX = ux * FLOW_WAVELENGTH;
  const dirY = uy * FLOW_WAVELENGTH;
  const anchorPt = forward ? start : end;
  // Slide the repeating gradient back along the travel direction by the
  // distance the wave already covered upstream.
  const sweepOrigin = {
    x: anchorPt.x - ux * phaseDist,
    y: anchorPt.y - uy * phaseDist,
  };
  const dur = FLOW_DUR;
  const maskId = `flow-mask-${id}`;
  const gradId = `flow-grad-${id}`;
  const sweepColor = flowColor ?? color;



  return (
    <g
      style={{ pointerEvents: 'none' }}
      opacity={dimmed ? 0.35 : 1}
      data-conductor={id}
      transform={shiftY ? `translate(0 ${shiftY.toFixed(2)})` : undefined}
    >
      {/* 1–3 — the physical pipe. Skipped for the second line of a doubled
              run: that one contributes only its travelling segment. */}
      {!sweepOnly && (
        <>
          {/* 1 — contact shadow, sits the run on the surface */}
          <path
            d={d}
            transform="translate(0 0.35)"
            stroke="hsl(220 60% 3%)"
            strokeOpacity={0.55}
            strokeWidth={w * 1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{ filter: 'blur(0.7px)' }}
          />
          {/* 2 — conductor body */}
          <path
            d={d}
            stroke={idle ? 'hsl(215 12% 42%)' : color}
            strokeOpacity={idle ? 0.5 : 0.72}
            strokeWidth={w}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* 3 — upper-edge highlight */}
          <path
            d={d}
            transform={`translate(0 ${(-w * 0.22).toFixed(2)})`}
            stroke={idle ? 'hsl(215 15% 68%)' : '#ffffff'}
            strokeOpacity={idle ? 0.18 : 0.3}
            strokeWidth={Math.max(0.16, w * 0.26)}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      )}
      {/* 4 — travelling gradient segment: soft-edged colour blob sliding along
              the pipe, fading to the neutral base at both of its ends. */}
      {!idle && (
        <>
          <defs>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              spreadMethod="repeat"
              x1={sweepOrigin.x - dirX}
              y1={sweepOrigin.y - dirY}
              x2={sweepOrigin.x}
              y2={sweepOrigin.y}
            >
              <stop offset="0%" stopColor="#000" />
              <stop offset="34%" stopColor="#000" />
              <stop offset="50%" stopColor="#fff" />
              <stop offset="66%" stopColor="#000" />
              <stop offset="100%" stopColor="#000" />
              {!reducedMotion && (
                <animateTransform
                  attributeName="gradientTransform"
                  type="translate"
                  from="0 0"
                  to={`${dirX.toFixed(3)} ${dirY.toFixed(3)}`}
                  dur={`${dur.toFixed(2)}s`}
                  repeatCount="indefinite"
                />
              )}
            </linearGradient>
            <mask id={maskId} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
              <path
                d={d}
                stroke={`url(#${gradId})`}
                strokeWidth={w * 2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </mask>
          </defs>
          <g mask={`url(#${maskId})`}>
            <path
              d={d}
              stroke={sweepColor}
              strokeOpacity={0.5}
              strokeWidth={w * 3.0}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              style={{ filter: 'blur(0.7px)' }}
            />
            <path
              d={d}
              stroke={sweepColor}
              strokeOpacity={1}
              strokeWidth={w * 1.12}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d={d}
              stroke="#ffffff"
              strokeOpacity={0.55}
              strokeWidth={w * 0.34}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>
        </>
      )}
    </g>
  );
}

/**
 * Builds the trunk/branch segment list for the current power reading.
 *
 *   trunk         roofArrayEdge → wallJunction         (total production)
 *   branch-home   wallJunction  → homeWallStub         (house load)
 *   branch-grid   wallJunction  → gridWallEnd           (export, or reversed
 *                                                       and re-hued on import)
 *   branch-pw     wallJunction  → powerwall            (charge / discharge)
 *   branch-ev     wallJunction  → evPort               (charging at this site)
 *
 * Sign conventions match EnergyFlowData: grid > 0 imports, battery > 0
 * charges the pack, ev > 0 charges the vehicle.
 */
export function buildConductorSegments(args: {
  solar: number;
  home: number;
  grid: number;
  /** + charging the pack, − discharging. Omit/0 when no battery. */
  battery?: number;
  /** + charging the vehicle at this site. Omit/0 when not charging here. */
  ev?: number;
  colors: { solar: string; home: string; export: string; import: string; ev?: string };
  dimSolar?: boolean;
  hideGrid?: boolean;
}): ConductorSegment[] {
  const A = SCENE_ANCHORS;
  // `colors` is accepted for call-site compatibility but only the EV hue is
  // honoured — every other branch renders in the single neutral conductor
  // colour, matching the reference.
  const { solar, home, grid, colors } = args;
  void colors;
  const battery = args.battery ?? 0;
  const ev = args.ev ?? 0;
  const segments: ConductorSegment[] = [];

  const producing = solar > 0.1;
  const importing = grid > 0.05;
  const exporting = grid < -0.05;

  // v20: every branch starts/ends on the SERVICE PANEL's exterior surface
  // (`PANEL_PORTS`), not at the abstract `wallJunction` centre, so no line
  // overlaps the box's interior and none stops short of it.
  const batteryDischarging = battery < -0.05;

  // TRUNK — v16: two segments. Diagonal across the panel field from
  // `roofArrayMiddle` to the eave at `roofGutter`, then a straight vertical
  // drop down the facade onto the TOP face of the service panel.
  const trunkPoints = [
    A.roofArrayMiddle,
    A.roofGutter,
    { x: A.roofGutter.x, y: PANEL_PORTS.solar.y },
  ];
  // v21: distance the solar wave has already travelled by the time it reaches
  // the junction. Downstream branches inherit it so the crest arriving from
  // the roof leaves toward home and grid in the same instant.
  const trunkDist = producing ? polylineLength(trunkPoints) : 0;

  if (producing) {
    segments.push({
      id: 'trunk',
      points: trunkPoints,
      color: CONDUCTOR_NEUTRAL,
      flowColor: FLOW_COLORS.solar,
      kw: solar,
      layer: 'front',
      dimmed: args.dimSolar,
    });
  }

  // HOME BRANCH — leaves the panel's RIGHT face and runs to the load tap
  // beside the windows, sloping gently with the wall's perspective line.
  // When the battery is ALSO feeding the house, a SECOND REAL LINE (its own
  // grey pipe, offset just below) appears carrying the green segment — and it
  // disappears entirely, pipe included, when the battery is not contributing.
  if (home > 0.05) {
    segments.push({
      id: 'branch-home',
      points: [PANEL_PORTS.home, A.homeWallStub],
      color: CONDUCTOR_NEUTRAL,
      flowColor: FLOW_COLORS.home,
      kw: home,
      layer: 'front',
      shiftY: batteryDischarging ? -0.62 : 0,
      phaseDist: trunkDist,
      dimmed: args.dimSolar && producing,
    });
    if (batteryDischarging) {
      segments.push({
        id: 'branch-home-battery',
        points: [PANEL_PORTS.home, A.homeWallStub],
        color: CONDUCTOR_NEUTRAL,
        flowColor: FLOW_COLORS.battery,
        kw: Math.abs(battery),
        layer: 'front',
        shiftY: 0.92,
        // v21: a real pipe, not a bare sweep — same timing as the orange run.
        phaseDist: trunkDist,
        dimmed: args.dimSolar && producing,
      });
    }
  }

  // BATTERY BRANCH — leaves the panel's LEFT face along the same sloped wall
  // line and stops the instant it meets the Powerwall cabinet's right-hand
  // outline (`POWERWALL_CORE`), centred on that face. No elbow, no overlap.
  if (Math.abs(battery) > 0.05) {
    segments.push({
      id: battery > 0 ? 'branch-pw-charge' : 'branch-pw-discharge',
      points: [
        PANEL_PORTS.battery,
        POWERWALL_CORE,
      ],

      color: CONDUCTOR_NEUTRAL,
      flowColor: FLOW_COLORS.battery,
      kw: battery,

      // Discharge flows out of the pack, back toward the junction.
      forward: battery > 0,
      layer: 'front',
    });
  }



  // EV BRANCH — only when a vehicle is charging at this site. Runs from the
  // driveway charge point down to the car's port. Rendered by `EvChargeCable`,
  // not by `Conductor`: it is a cable, not a fixed conduit run.
  if (ev > 0.05) {
    segments.push({
      id: 'branch-ev',
      points: isoRoute(A.chargePoint, A.evPort, 'vert-first'),
      color: args.colors.ev ?? colors.import,
      flowColor: FLOW_COLORS.ev,
      kw: ev,
      layer: 'front',
      dimmed: args.dimSolar,
    });
  }


  // GRID BRANCH — v20: starts at the BOTTOM of the meter-can conduit stub,
  // drops to the true foundation line (`gridWallEnd`), then one diagonal
  // across the yard toward the street tie point.
  if (!args.hideGrid && (importing || exporting)) {
    segments.push({
      id: exporting ? 'branch-grid-export' : 'branch-grid-import',
      points: [PANEL_PORTS.grid, A.gridWallEnd, A.gridYard],
      color: CONDUCTOR_NEUTRAL,
      flowColor: FLOW_COLORS.grid,
      kw: grid,
      // Import reverses: the travelling segment runs inward from the grid.
      forward: exporting,
      // Export continues the same wave that came down from the roof; import is
      // an incoming wave of its own, so it starts its phase at the yard.
      phaseDist: exporting ? trunkDist : 0,
      layer: 'front',
    });
  }





  return segments;
}

/**
 * EvChargeCable — the visible connection between the wall charge point and the
 * car's charge port. Deliberately styled apart from the fixed conductor runs:
 * a sagging catenary, violet, with a moving dash so it reads as live current
 * rather than a permanent conduit.
 */
export function EvChargeCable({
  from = SCENE_ANCHORS.chargePoint,
  to,
  color = 'hsl(265 90% 78%)',
  reducedMotion,
}: {
  from?: Pt;
  to: Pt;
  color?: string;
  reducedMotion?: boolean;
}) {
  // v15: wall box at the garage's left corner → straight drop to the apron →
  // short bend right along the ground to the car's rear port.
  const dropY = Math.max(from.y + 2, to.y - 1.2);
  const d = roundedPath([from, { x: from.x, y: dropY }, { x: to.x, y: dropY }, to], 1.4);


  return (
    <g style={{ pointerEvents: 'none' }} data-testid="ev-charge-cable">
      <path
        d={d}
        stroke={color}
        strokeOpacity={0.35}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
        style={{ filter: 'blur(1px)' }}
      />
      <path
        d={d}
        stroke={color}
        strokeOpacity={0.85}
        strokeWidth={0.55}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={d}
        stroke="#ffffff"
        strokeOpacity={0.9}
        strokeWidth={0.4}
        strokeLinecap="round"
        fill="none"
        strokeDasharray="1.6 4.4"
        strokeDashoffset={reducedMotion ? 0 : 6}
      >
        {!reducedMotion && (
          <animate attributeName="stroke-dashoffset" from="6" to="0" dur="0.9s" repeatCount="indefinite" />
        )}
      </path>
    </g>
  );
}
