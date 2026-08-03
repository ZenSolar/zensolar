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
 *   homeWall       foundation line beneath the window bank — the interior load
 *                  tap. Deliberately BELOW the glass: nothing terminates on a
 *                  window
 *   powerwall      battery cabinet, garage-side wall beside the panel
 *   gridEdge       off the property, past the right frame edge, along grade
 *   evPort         charge port on the near quarter of the parked vehicle
 */
export const SCENE_ANCHORS = Object.freeze({
  /** v12c: eave line directly above the service panel (plate px 515,390). */
  roofArrayEdge: { x: 50.3, y: 38.1 } as Pt,
  /** Service panel + meter can, baked into the v12c equipment wall
   *  (plate px 515,519). The ONLY metering object in the scene. */
  wallJunction:  { x: 50.3, y: 50.7 } as Pt,
  /** Foundation line beneath the window bank (plate px 745,697). */
  homeWall:      { x: 72.8, y: 68.1 } as Pt,
  /** Powerwall cabinet, level with the panel (plate px 383,525). */
  powerwall:     { x: 37.4, y: 51.3 } as Pt,
  /** v12c grid rule: the service run drops STRAIGHT DOWN the wall from the
   *  meter can to grade at the wall base and stops. It is wall-mounted, never
   *  a ground line, and never enters the driveway/EV-cable corridor. */
  gridEdge:      { x: 50.3, y: 64.0 } as Pt,
  evPort:        { x: 28.0, y: 72.0 } as Pt,
  /** Charge point on the garage-side facade, left of the Powerwall
   *  (plate px 333,552) — above and behind the parked vehicle. */
  chargePoint:   { x: 32.5, y: 53.9 } as Pt,
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
 * kW → stroke width is NO LONGER used for conductor rendering. The reference
 * draws every run at the same thin weight; the helper stays exported because
 * `siteBalance` still asserts on it elsewhere.
 */
export { WIDTH_PER_KW, conductorWidth } from '@/lib/siteBalance';

/** Uniform conductor weight, in viewBox units. Thin, like the reference. */
export const CONDUCTOR_WIDTH = 0.52;

/**
 * The single neutral conductor colour. Grey-white, like the Tesla reference —
 * no per-source hue. Grid import/export, solar, home and battery all use it.
 */
export const CONDUCTOR_NEUTRAL = 'hsl(210 18% 82%)';

/** Travelling-pulse period: higher power travels faster, never frantic. */
const pulseDur = (kw: number) => Math.max(1.5, 3.4 - Math.min(Math.abs(kw), 8) * 0.2);

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
  // Uniform weight — magnitude lives in the numeric labels, not the stroke.
  const w = CONDUCTOR_WIDTH;

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

  // TRUNK — roof array down the visible roof face to the wall junction.
  // Draws in FRONT: this run is on the near roof plane and near facade.
  if (producing) {
    segments.push({
      id: 'trunk',
      points: isoRoute(A.roofArrayEdge, A.wallJunction, 'vert-first'),
      color: CONDUCTOR_NEUTRAL,
      kw: solar,
      layer: 'front',
      dimmed: args.dimSolar,
    });
  }

  // HOME BRANCH — panel down to grade, then right along the foundation to a
  // tap BELOW the window bank. Never across the glass, never terminating on it.
  if (home > 0.05) {
    segments.push({
      id: 'branch-home',
      // v12c: orthogonal wall run — drop the wall beside the grid riser, then
      // run level along the foundation to the load tap. No diagonals on wall.
      points: [
        { x: A.wallJunction.x + 2.6, y: A.wallJunction.y + 3.4 },
        { x: A.wallJunction.x + 2.6, y: A.homeWall.y },
        A.homeWall,
      ],

      color: CONDUCTOR_NEUTRAL,
      kw: home,
      layer: 'front',
      dimmed: args.dimSolar && producing,
    });
  }

  // BATTERY BRANCH — only while charging or discharging. Short run along the
  // garage-side wall to the cabinet beside the panel.
  if (Math.abs(battery) > 0.05) {
    segments.push({
      id: battery > 0 ? 'branch-pw-charge' : 'branch-pw-discharge',
      points: [A.wallJunction, { x: A.wallJunction.x + 2.5, y: A.powerwall.y }, A.powerwall],
      color: CONDUCTOR_NEUTRAL,
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
      kw: ev,
      layer: 'front',
      dimmed: args.dimSolar,
    });
  }


  // GRID BRANCH — v12c: a straight, wall-mounted vertical drop from the meter
  // can at the base of the service panel down to grade, where it stops. It no
  // longer runs off across the driveway apron, so it cannot cross the EV
  // ground corridor.
  if (!args.hideGrid && (importing || exporting)) {
    segments.push({
      id: exporting ? 'branch-grid-export' : 'branch-grid-import',
      points: [{ x: A.wallJunction.x, y: A.wallJunction.y + 3.4 }, { x: A.gridEdge.x, y: A.gridEdge.y }],
      color: CONDUCTOR_NEUTRAL,
      kw: grid,
      // Import reverses: pulse and chevron travel inward from the grid.
      forward: exporting,
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
  const sag = Math.max(2.2, Math.abs(to.x - from.x) * 0.35);
  const d =
    `M ${from.x} ${from.y} ` +
    `C ${from.x - 1.5} ${from.y + sag} ${to.x + 1.5} ${to.y + sag * 0.6} ${to.x} ${to.y}`;

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
