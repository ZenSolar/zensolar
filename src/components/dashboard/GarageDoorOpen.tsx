/**
 * GarageDoorOpen — the "car is being received by the house" art state.
 *
 * The baked house PNGs only ship a CLOSED garage door, so the open state is
 * drawn procedurally in the same 0–100 overlay space the conductors use:
 *
 *   1. the door slab rolls UP and parks under the header, slats and all
 *   2. the opening behind it becomes a real volume — dark at the mouth,
 *      warm at the back wall
 *   3. light spills out across the apron toward the parked vehicle
 *
 * Everything is quad-based (not axis-aligned rects) so it sits on the same
 * isometric plane as the garage facade in the render.
 */

export interface GarageDoorOpenProps {
  reducedMotion?: boolean;
}

/** Door plane corners, read off the baked art via `?anchors=1`. */
const DOOR = {
  tl: { x: 3.0, y: 51.5 },
  tr: { x: 34.0, y: 53.5 },
  br: { x: 34.0, y: 69.0 },
  bl: { x: 3.0, y: 67.5 },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const edge = (
  top: { x: number; y: number },
  bottom: { x: number; y: number },
  t: number,
) => ({ x: lerp(top.x, bottom.x, t), y: lerp(top.y, bottom.y, t) });

/** Quad interpolated between the header line and a fraction down the opening. */
function band(t0: number, t1: number) {
  const l0 = edge(DOOR.tl, DOOR.bl, t0);
  const r0 = edge(DOOR.tr, DOOR.br, t0);
  const l1 = edge(DOOR.tl, DOOR.bl, t1);
  const r1 = edge(DOOR.tr, DOOR.br, t1);
  return `${l0.x},${l0.y} ${r0.x},${r0.y} ${r1.x},${r1.y} ${l1.x},${l1.y}`;
}

const OPENING = `${DOOR.tl.x},${DOOR.tl.y} ${DOOR.tr.x},${DOOR.tr.y} ${DOOR.br.x},${DOOR.br.y} ${DOOR.bl.x},${DOOR.bl.y}`;

/** Fraction of the opening the raised slab still covers. */
const SLAB_T = 0.19;

export function GarageDoorOpen({ reducedMotion }: GarageDoorOpenProps) {
  return (
    <g style={{ pointerEvents: 'none' }} data-testid="garage-door-open">
      <defs>
        <linearGradient id="garage-interior" x1="0" y1="1" x2="0.25" y2="0">
          <stop offset="0%" stopColor="hsl(24 45% 6%)" stopOpacity="0.96" />
          <stop offset="55%" stopColor="hsl(28 55% 12%)" stopOpacity="0.94" />
          <stop offset="100%" stopColor="hsl(36 70% 30%)" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="garage-backlight" cx="0.62" cy="0.36" r="0.62">
          <stop offset="0%" stopColor="hsl(38 92% 62%)" stopOpacity="0.55" />
          <stop offset="60%" stopColor="hsl(34 85% 52%)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="hsl(30 80% 45%)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="garage-spill" x1="0.6" y1="0" x2="0.15" y2="1">
          <stop offset="0%" stopColor="hsl(38 90% 62%)" stopOpacity="0.34" />
          <stop offset="100%" stopColor="hsl(34 85% 55%)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Interior volume — the mouth of the bay */}
      <polygon points={OPENING} fill="url(#garage-interior)" />
      {/* Warm back wall / ceiling fixture bloom */}
      <polygon
        points={OPENING}
        fill="url(#garage-backlight)"
        style={{ filter: 'blur(1.4px)' }}
      >
        {!reducedMotion && (
          <animate
            attributeName="opacity"
            values="0.82;1;0.82"
            dur="4200ms"
            repeatCount="indefinite"
          />
        )}
      </polygon>

      {/* Light spill across the apron toward the vehicle */}
      <polygon
        points={`${DOOR.bl.x},${DOOR.bl.y} ${DOOR.br.x},${DOOR.br.y} ${DOOR.br.x - 4},${DOOR.br.y + 13} ${DOOR.bl.x - 2},${DOOR.bl.y + 10}`}
        fill="url(#garage-spill)"
        style={{ filter: 'blur(2.4px)' }}
      />

      {/* Raised door slab, parked under the header */}
      <g
        style={
          reducedMotion
            ? undefined
            : {
                transformBox: 'fill-box',
                transformOrigin: 'top',
                animation: 'zen-garage-door-rise 700ms cubic-bezier(0.22,1,0.36,1) both',
              }
        }
      >
        <polygon points={band(0, SLAB_T)} fill="hsl(40 14% 26%)" opacity={0.95} />
        {[0.055, 0.11, 0.16].map((t) => {
          const l = edge(DOOR.tl, DOOR.bl, t);
          const r = edge(DOOR.tr, DOOR.br, t);
          return (
            <line
              key={t}
              x1={l.x}
              y1={l.y}
              x2={r.x}
              y2={r.y}
              stroke="hsl(40 12% 16%)"
              strokeWidth={0.28}
              opacity={0.8}
            />
          );
        })}
        {/* Lit underside lip of the raised slab */}
        <polygon
          points={band(SLAB_T - 0.02, SLAB_T)}
          fill="hsl(38 85% 60%)"
          opacity={0.35}
        />
      </g>

      {/* Threshold line — where the floor of the bay meets the apron */}
      <line
        x1={DOOR.bl.x}
        y1={DOOR.bl.y}
        x2={DOOR.br.x}
        y2={DOOR.br.y}
        stroke="hsl(38 80% 58%)"
        strokeWidth={0.3}
        opacity={0.4}
      />
    </g>
  );
}
