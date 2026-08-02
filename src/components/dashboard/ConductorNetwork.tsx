/**
 * ConductorNetwork — trunk-and-branch energy routing for the ZenEnergy
 * Monitoring live card.
 *
 * TOPOLOGY (mirrors the Tesla app; one trunk, one junction, four branches)
 *
 *     roofArrayEdge ──▶ wallJunction ─┬─▶ meter ─▶ gridEdge   (grid)
 *          (trunk)                    ├─▶ homeWall            (house load)
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
 * WIDTH CARRIES MAGNITUDE — stroke width is strictly proportional to kW
 * (`conductorWidth`), so the trunk is visibly as wide as the sum of its
 * active branches. See the function for the constant.
 *
 * COLOUR IS BINARY — one accent for everything solar-sourced, grey for idle,
 * and a single distinct hue for grid import (a genuinely different flow, and
 * the only case where direction reverses). Never a hue change mid-run.
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
 *   roofArrayEdge  lower-RIGHT corner of the PV array, where it meets the eave
 *   wallJunction   right facade directly beneath the eave — where the roof run
 *                  terminates and every branch begins. Brand-neutral: it is a
 *                  routing node, not a device
 *   homeWall       centre of the lit window cluster (interior load)
 *   powerwall      white Tesla battery cabinet on the front-right facade
 *   meter          grey utility pedestal / service entrance at the right edge
 *                  of the slab
 *   gridEdge       off the property, past the right frame edge
 *   evPort         charge port on the rear quarter of the parked vehicle
 */
export const SCENE_ANCHORS = Object.freeze({
  roofArrayEdge: { x: 59.5, y: 43.5 } as Pt,
  wallJunction:  { x: 70.5, y: 51.5 } as Pt,
  homeWall:      { x: 77.5, y: 55.5 } as Pt,
  powerwall:     { x: 73.0, y: 68.0 } as Pt,
  meter:         { x: 94.0, y: 65.0 } as Pt,
  gridEdge:      { x: 108.0, y: 72.0 } as Pt,
  evPort:        { x: 34.0, y: 75.0 } as Pt,
  /** Charge point serving the driveway — mounted on the garage-side facade,
   *  directly above and behind the parked vehicle. The EV conductor starts
   *  HERE, not at wallJunction: power reaching a car on the driveway does not
   *  travel over the roofline, and reusing the junction made the EV run read
   *  as a branch of the solar-to-home line. */
  chargePoint:   { x: 42.0, y: 66.0 } as Pt,
});


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
 * kW → stroke width. Defined once in `@/lib/siteBalance` alongside the
 * balance assertion that keeps the claim honest:
 *
 *   width(kW) = 0.30 × kW,  clamped to [0.30, 3.0]
 *
 * Strictly proportional and through the origin, so widths ADD. The floor only
 * protects sub-1 kW runs from vanishing; the ceiling keeps a 12 kW import from
 * swamping the house. When either clamp engages, `computeSiteBalance().clamped`
 * is true and widths are no longer comparable — the assertion says so rather
 * than pretending.
 */
export { WIDTH_PER_KW, conductorWidth } from '@/lib/siteBalance';
import { conductorWidth } from '@/lib/siteBalance';

/** Travelling-pulse period: higher power travels faster, never frantic. */
const pulseDur = (kw: number) => Math.max(1.5, 3.4 - Math.min(Math.abs(kw), 8) * 0.2);

export type ConductorLayer = 'behind' | 'front';

export type ConductorSegment = {
  id: string;
  /** Ordered anchors — the route is built along the isometric axes. */
  points: Pt[];
  color: string;
  kw: number;
  /** false → the pulse and chevron travel from the last point to the first. */
  forward?: boolean;
  layer: ConductorLayer;
  dimmed?: boolean;
  /** Renders grey, no pulse — the conduit exists but carries nothing. */
  idle?: boolean;
};

/**
 * One anchor-to-anchor conductor. Reads as a physical run on the surface:
 *   1. soft dark shadow, offset down — attaches the run to the wall/roof
 *   2. solid conductor body in the flow colour
 *   3. thin lighter stroke along the upper edge — a rounded conductor
 *      catching light
 *   4. a single bright pulse travelling with the flow (not marching dashes)
 *   5. one chevron at the midpoint, ON the path, so direction survives a
 *      still screenshot
 */
export function Conductor({
  id,
  points,
  color,
  kw,
  forward = true,
  dimmed,
  idle,
  reducedMotion,
}: Omit<ConductorSegment, 'layer'> & { reducedMotion?: boolean }) {
  const d = roundedPath(points);
  const w = conductorWidth(kw);
  const dur = pulseDur(kw);
  const { p, angle } = polylineMidpoint(points);
  const chevronAngle = forward ? angle : angle + 180;

  // Pulse: one short lit run inside a very long gap, so exactly one bright
  // packet travels the conduit at a time.
  const pulseLen = Math.max(3, w * 4);
  const gap = 120;
  const from = forward ? gap : -pulseLen;
  const to = forward ? -pulseLen : gap;

  return (
    <g style={{ pointerEvents: 'none' }} opacity={dimmed ? 0.35 : 1} data-conductor={id}>
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
      {/* 4 — travelling pulse */}
      {!idle && (
        <path
          d={d}
          stroke={color}
          strokeOpacity={0.98}
          strokeWidth={w}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={`${pulseLen} ${gap}`}
          strokeDashoffset={reducedMotion ? 0 : from}
        >
          {!reducedMotion && (
            <animate
              attributeName="stroke-dashoffset"
              from={from}
              to={to}
              dur={`${dur}s`}
              repeatCount="indefinite"
            />
          )}
        </path>
      )}
      {/* 5 — still-frame direction cue */}
      <g transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${chevronAngle.toFixed(1)})`}>
        <path
          d="M -0.9 -1.15 L 0.9 0 L -0.9 1.15"
          fill="none"
          stroke={idle ? 'hsl(215 12% 55%)' : color}
          strokeWidth={Math.max(0.42, w * 0.7)}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={idle ? 0.5 : 0.95}
        />
      </g>
    </g>
  );
}

/**
 * Builds the trunk/branch segment list for the current power reading.
 *
 *   trunk         roofArrayEdge → wallJunction         (total production)
 *   branch-home   wallJunction  → homeWall             (house load)
 *   branch-grid   wallJunction  → meter → gridEdge     (export, or reversed
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
  colors: { solar: string; home: string; export: string; import: string };
  dimSolar?: boolean;
  hideGrid?: boolean;
}): ConductorSegment[] {
  const A = SCENE_ANCHORS;
  const { solar, home, grid, colors } = args;
  const battery = args.battery ?? 0;
  const ev = args.ev ?? 0;
  const segments: ConductorSegment[] = [];

  const producing = solar > 0.1;
  const importing = grid > 0.05;
  const exporting = grid < -0.05;

  // TRUNK — roof array down the visible roof face to the wall junction.
  // Draws in FRONT: this run is on the near roof plane and near facade.
  if (producing) {
    segments.push({
      id: 'trunk',
      points: isoRoute(A.roofArrayEdge, A.wallJunction, 'vert-first'),
      color: colors.solar,
      kw: solar,
      layer: 'front',
      dimmed: args.dimSolar,
    });
  }

  // HOME BRANCH — junction up-right to the window cluster.
  if (home > 0.05) {
    segments.push({
      id: 'branch-home',
      points: isoRoute(A.wallJunction, A.homeWall),
      color: producing ? colors.home : colors.import,
      kw: home,
      layer: 'front',
      dimmed: args.dimSolar && producing,
    });
  }

  // BATTERY BRANCH — only while charging or discharging.
  if (Math.abs(battery) > 0.05) {
    segments.push({
      id: battery > 0 ? 'branch-pw-charge' : 'branch-pw-discharge',
      points: isoRoute(A.wallJunction, A.powerwall, 'vert-first'),
      color: colors.solar,
      kw: battery,
      // Discharge flows out of the pack, back toward the junction.
      forward: battery > 0,
      layer: 'front',
      dimmed: args.dimSolar && battery > 0,
    });
  }

  // EV BRANCH — only when a vehicle is charging at this site. Runs along the
  // slab in front of the porch, so it stays in FRONT of the silhouette.
  if (ev > 0.05) {
    segments.push({
      id: 'branch-ev',
      points: [
        A.wallJunction,
        { x: A.wallJunction.x - 4, y: 79.5 },
        { x: A.evPort.x + 6, y: 79.5 },
        A.evPort,
      ],
      color: colors.solar,
      kw: ev,
      layer: 'front',
      dimmed: args.dimSolar,
    });
  }

  // GRID BRANCH — junction → meter → off-property. Terminates ON the meter
  // and continues past the frame edge, never stopping short of the post.
  if (!args.hideGrid && (importing || exporting)) {
    segments.push({
      id: exporting ? 'branch-grid-export' : 'branch-grid-import',
      points: [
        ...isoRoute(A.wallJunction, A.meter),
        ...isoRoute(A.meter, A.gridEdge).slice(1),
      ],
      color: exporting ? colors.export : colors.import,
      kw: grid,
      // Import reverses: pulse and chevron travel inward from the grid.
      forward: exporting,
      layer: 'front',
    });
  }

  return segments;
}
