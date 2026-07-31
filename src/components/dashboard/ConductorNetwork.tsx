/**
 * ConductorNetwork — trunk-and-branch energy routing for the ZenEnergy
 * Monitoring live card.
 *
 * Replaces the two independent point-to-point bezier arcs (roof→home and
 * roof→grid) that both terminated near the utility post. Real topology is a
 * trunk that divides:
 *
 *     roofPlane ─▶ roofEave ─▶ gateway ─▶ mainPanel ─┬─▶ homeInterior
 *                      (trunk = total production)    └─▶ utilityPost
 *
 * The trunk carries total production; the two branches carry the home load
 * and the grid share, and stroke weight scales with kW so a viewer can see
 * that the branches are shares of the trunk.
 *
 * Routing rules
 *   · Every segment runs anchor-to-anchor. Nothing terminates in empty space.
 *   · Segments follow the 30°/150° isometric axes of the house geometry (plus
 *     vertical drops), with short rounded corners at direction changes.
 *   · Each segment declares a z-layer: `front` draws over the house, `behind`
 *     draws under it, so no conductor crosses the silhouette.
 *   · Direction reads in a still frame: dash offset travels with the flow and
 *     a single chevron sits at each segment midpoint. On grid import the grid
 *     branch reverses — dash, chevron and colour all flip.
 */

export type Pt = Readonly<{ x: number; y: number }>;

/**
 * Named anchors in overlay viewBox (0–100) space, measured against the baked
 * `house-*.png` renders. Every one is tied to visible geometry.
 *
 *   roofPlane     centroid of the PV array on the front roof slope
 *   roofEave      lower-right corner of the array where the conduit drops
 *   gateway       white wall cabinet on the front-right facade
 *   mainPanel     service junction on the wall right of the gateway
 *   homeInterior  centre of the lit-window cluster
 *   utilityPost   utility meter / post at the right edge of the slab
 */
export const SCENE_ANCHORS = Object.freeze({
  roofPlane:    { x: 44, y: 33 } as Pt,
  roofEave:     { x: 62, y: 45 } as Pt,
  gateway:      { x: 72, y: 63 } as Pt,
  mainPanel:    { x: 84, y: 66 } as Pt,
  homeInterior: { x: 80, y: 58 } as Pt,
  utilityPost:  { x: 91, y: 64 } as Pt,
  /** Charge port of a vehicle pulled up to the garage apron. */
  evPort:       { x: 41, y: 74 } as Pt,
});

// Isometric axis: 30° rise over run (2:1 iso projection).
const ISO_SLOPE = 0.5;

/**
 * Two-leg isometric route between two anchors: one 30°/150° diagonal leg and
 * one vertical leg, ordered by `order`. Returns the polyline corner list.
 */
export function isoRoute(a: Pt, b: Pt, order: 'diag-first' | 'vert-first' = 'diag-first'): Pt[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) < 0.001) return [a, b];

  const run = Math.abs(dx);
  // Pick the diagonal sense (down-slope or up-slope) that leaves the least
  // vertical remainder — that keeps conductors hugging the surfaces.
  const downRemainder = dy - ISO_SLOPE * run;
  const upRemainder = dy + ISO_SLOPE * run;
  const useDown = Math.abs(downRemainder) <= Math.abs(upRemainder);
  const diagDy = useDown ? ISO_SLOPE * run : -ISO_SLOPE * run;

  const corner: Pt =
    order === 'diag-first'
      ? { x: b.x, y: a.y + diagDy }
      : { x: a.x, y: b.y - diagDy };

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

/** Line weight scales with power so branches read as shares of the trunk. */
export function conductorWidth(kw: number): number {
  return 0.5 + Math.min(Math.abs(kw), 9) * 0.115;
}

/** Physics-y crawl: higher power travels faster, but never frantic. */
const dashDur = (kw: number) => Math.max(1.6, 3.6 - Math.min(Math.abs(kw), 8) * 0.22);

const DASH = 2.2;
const GAP = 2.8;
const PERIOD = DASH + GAP;

export type ConductorLayer = 'behind' | 'front';

export type ConductorSegment = {
  id: string;
  /** Ordered anchors — the route is built along the isometric axes. */
  points: Pt[];
  color: string;
  kw: number;
  /** false → dash + chevron travel from the last point to the first. */
  forward?: boolean;
  layer: ConductorLayer;
  dimmed?: boolean;
};

/** One anchor-to-anchor conductor: glow, dashed core, and a midpoint chevron. */
export function Conductor({
  id,
  points,
  color,
  kw,
  forward = true,
  dimmed,
  reducedMotion,
}: Omit<ConductorSegment, 'layer'> & { reducedMotion?: boolean }) {
  const d = roundedPath(points);
  const w = conductorWidth(kw);
  const dur = dashDur(kw);
  const { p, angle } = polylineMidpoint(points);
  const chevronAngle = forward ? angle : angle + 180;
  const from = forward ? 0 : -PERIOD;
  const to = forward ? -PERIOD : 0;

  return (
    <g style={{ pointerEvents: 'none' }} opacity={dimmed ? 0.35 : 1} data-conductor={id}>
      {/* Soft halo — sells the conductor without a drop shadow */}
      <path
        d={d}
        stroke={color}
        strokeOpacity={0.2}
        strokeWidth={w * 2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{ filter: 'blur(1.3px)' }}
      />
      {/* Static conductor body */}
      <path
        d={d}
        stroke={color}
        strokeOpacity={0.28}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Travelling dash — direction of flow */}
      <path
        d={d}
        stroke={color}
        strokeOpacity={0.95}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={`${DASH} ${GAP}`}
        strokeDashoffset={from}
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
      {/* Still-frame direction cue */}
      <g transform={`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${chevronAngle.toFixed(1)})`}>
        <path
          d="M -0.9 -1.15 L 0.9 0 L -0.9 1.15"
          fill="none"
          stroke={color}
          strokeWidth={Math.max(0.42, w * 0.75)}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.95}
        />
      </g>
    </g>
  );
}

/**
 * Builds the trunk/branch segment list for the current power reading.
 *
 * trunk        roofPlane → roofEave → gateway → mainPanel   (total production)
 * home branch  mainPanel → homeInterior                     (home load share)
 * grid branch  mainPanel → utilityPost                      (export share) or
 *              utilityPost → mainPanel                      (import, reversed)
 */
export function buildConductorSegments(args: {
  solar: number;
  home: number;
  grid: number;
  colors: { solar: string; home: string; export: string; import: string };
  dimSolar?: boolean;
  hideGrid?: boolean;
}): ConductorSegment[] {
  const A = SCENE_ANCHORS;
  const { solar, home, grid, colors } = args;
  const segments: ConductorSegment[] = [];

  const producing = solar > 0.1;
  const importing = grid > 0.05;
  const exporting = grid < -0.05;

  if (producing) {
    segments.push({
      id: 'trunk',
      points: [
        A.roofPlane,
        ...isoRoute(A.roofPlane, A.roofEave).slice(1),
        ...isoRoute(A.roofEave, A.gateway).slice(1),
        ...isoRoute(A.gateway, A.mainPanel).slice(1),
      ],
      color: colors.solar,
      kw: solar,
      layer: 'front',
      dimmed: args.dimSolar,
    });
  }

  // Home-load branch. Present whenever the house is drawing, sourced from the
  // trunk when solar is up and from the grid branch when it isn't.
  if (home > 0.05) {
    segments.push({
      id: 'branch-home',
      points: isoRoute(A.mainPanel, A.homeInterior, 'vert-first'),
      color: producing ? colors.home : colors.import,
      kw: home,
      layer: 'front',
      dimmed: args.dimSolar && producing,
    });
  }

  if (!args.hideGrid && (importing || exporting)) {
    segments.push({
      id: exporting ? 'branch-grid-export' : 'branch-grid-import',
      points: isoRoute(A.mainPanel, A.utilityPost),
      color: exporting ? colors.export : colors.import,
      kw: grid,
      // Import reverses the branch: dash and chevron both travel inward.
      forward: exporting,
      layer: 'front',
    });
  }

  return segments;
}
