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
 * The house art is laid out at h-[92%] of the card while this overlay is
 * h-[88%] — both centred and square. Anchors were measured directly off the
 * baked PNG (percent of the image), so convert once here instead of eyeballing
 * the offset per anchor.
 *
 *   overlay = (0.92 * img/100 - 0.02) * 100 / 0.88
 */
export function fromHouseImage(x: number, y: number): Pt {
  const conv = (v: number) => Math.round(((0.92 * v) / 100 - 0.02) * (100 / 0.88) * 100) / 100;
  return { x: conv(x), y: conv(y) };
}

/**
 * Named anchors, given as percent of the baked house PNG and converted once
 * into overlay space. Every one was re-measured against
 * `house-day-export.png` (the variant that renders while exporting) and
 * checked with the `?anchors=1` debug overlay — each lands on a visible object.
 *
 *   roofPlane      centroid of the PV array on the front roof slope
 *   roofEave       lower-right corner of the array, where conduit leaves the roof
 *   wallJunction   grey service-disconnect box on the front-right facade —
 *                  brand-neutral on purpose: the white cabinet on the garage
 *                  face is baked Powerwall art and this account has no battery
 *                  connected, so nothing routes through it
 *   homeInterior   centre of the lit-window cluster
 *   utilityPost    utility pedestal at the right edge of the slab
 *
 * `mainPanel` was retired: there is no second visible panel between the wall
 * box and the pedestal, so it was an anchor in empty wall.
 */
export const SCENE_ANCHORS = Object.freeze({
  roofPlane:    fromHouseImage(44, 33),
  roofEave:     fromHouseImage(62, 45),
  wallJunction: fromHouseImage(69.8, 68.7),
  homeInterior: fromHouseImage(75.7, 58),
  utilityPost:  fromHouseImage(93, 60),
  /** Charge port of a vehicle pulled up to the garage apron. */
  evPort:       fromHouseImage(41, 74),
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
  // Prefer the requested ordering, then the corner that stays inside the
  // a→b bounding box — an overshooting corner reads as a kink in the run.
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

  // On short runs the exact 30° corner can overshoot past the destination and
  // read as a kink. Clamp it back inside the run's vertical span: the leg
  // stays within a couple of degrees of the iso axis and looks like conduit.
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
 * trunk        roofPlane → roofEave → wallJunction    (total production)
 * home branch  wallJunction → homeInterior            (home load share)
 * grid branch  wallJunction → utilityPost             (export share) or
 *              utilityPost → wallJunction             (import, reversed)
 *
 * The split sits at the junction, not at the far end of the facade, so both
 * branches leave one node heading right with no hairpin reversal.
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
        ...isoRoute(A.roofEave, A.wallJunction).slice(1),
      ],
      color: colors.solar,
      kw: solar,
      layer: 'front',
      dimmed: args.dimSolar,
    });
  }

  // Home-load branch. Leaves the junction heading up-right to the windows —
  // no doubling back, because the split happens at the junction rather than
  // out at the pedestal end of the run.
  if (home > 0.05) {
    segments.push({
      id: 'branch-home',
      points: isoRoute(A.wallJunction, A.homeInterior),
      color: producing ? colors.home : colors.import,
      kw: home,
      layer: 'front',
      dimmed: args.dimSolar && producing,
    });
  }

  // Grid branch. Also leaves the junction rightward, along the facade to the
  // pedestal, so both branches fan out from one node in the same direction.
  if (!args.hideGrid && (importing || exporting)) {
    segments.push({
      id: exporting ? 'branch-grid-export' : 'branch-grid-import',
      points: isoRoute(A.wallJunction, A.utilityPost),
      color: exporting ? colors.export : colors.import,
      kw: grid,
      // Import reverses the branch: dash and chevron both travel inward.
      forward: exporting,
      layer: 'front',
    });
  }


  return segments;
}
