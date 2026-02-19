import { useIsMobile } from '@/hooks/use-mobile';

export interface EnergyFlowData {
  solarPower: number;
  homePower: number;
  batteryPower: number; // positive = charging, negative = discharging
  batteryPercent: number;
  gridPower: number; // positive = importing, negative = exporting
  evPower: number;
}

interface AnimatedEnergyFlowProps {
  data?: EnergyFlowData;
  className?: string;
}

// ─── Flowing dashed energy line ────────────────────────────────────────────────
function EnergyLine({
  id, d, color, power, reverse = false,
}: { id: string; d: string; color: string; power: number; reverse?: boolean }) {
  const active = power > 0.05;
  const speed = active ? Math.max(0.5, 1.8 - power * 0.09) : 0;
  const total = 24;

  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={active ? 2 : 1} strokeOpacity={active ? 0.12 : 0.05} />
      {active && (
        <path d={d} fill="none" stroke={color} strokeWidth={7} strokeOpacity={0.04} filter={`url(#glow-${id})`} />
      )}
      {active && (
        <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"
          strokeDasharray="8 16" strokeOpacity={0.9}>
          <animate attributeName="stroke-dashoffset" from="0" to={`${reverse ? total : -total}`}
            dur={`${speed}s`} repeatCount="indefinite" />
        </path>
      )}
    </g>
  );
}

// ─── Pulsing node ──────────────────────────────────────────────────────────────
function Node({
  cx, cy, r, color, active, children,
}: { cx: number; cy: number; r: number; color: string; active: boolean; children?: React.ReactNode }) {
  return (
    <g>
      {active && (
        <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke={color} strokeWidth={0.8} strokeOpacity={0.25}>
          <animate attributeName="r" values={`${r};${r + 12};${r}`} dur="3s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.35;0;0.35" dur="3s" repeatCount="indefinite" />
        </circle>
      )}
      <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={active ? 0.15 : 0.06}
        stroke={color} strokeWidth={1.5} strokeOpacity={active ? 0.65 : 0.2} />
      {children}
    </g>
  );
}

// ─── Hero 3D isometric house (large, centre-stage) ────────────────────────────
function House3D({ s, ox, oy, batteryPercent, solarActive }: {
  s: number; ox: number; oy: number; batteryPercent: number; solarActive: boolean;
}) {
  const x = (v: number) => ox + v * s;
  const y = (v: number) => oy + v * s;

  // Solar panel grid on left roof — 3 rows tapering to ridge
  const panels: { row: number; col: number }[] = [];
  [3, 3, 2, 1].forEach((cols, row) => {
    for (let col = 0; col < cols; col++) panels.push({ row, col });
  });

  return (
    <g>
      {/* Ground shadow */}
      <ellipse cx={x(0)} cy={y(125)} rx={130 * s} ry={11 * s} fill="#000" opacity={0.22} />

      {/* ── Left wall (dark face) ── */}
      <polygon
        points={`${x(-90)},${y(26)} ${x(-90)},${y(125)} ${x(0)},${y(102)} ${x(0)},${y(0)}`}
        fill="url(#houseLeft)" stroke="#1b2a3b" strokeWidth={0.7}
      />

      {/* ── Front wall (light face) ── */}
      <polygon
        points={`${x(0)},${y(0)} ${x(0)},${y(102)} ${x(90)},${y(125)} ${x(90)},${y(26)}`}
        fill="url(#houseFront)" stroke="#1b2a3b" strokeWidth={0.7}
      />

      {/* ── Left roof ── */}
      <polygon
        points={`${x(-90)},${y(26)} ${x(0)},${y(0)} ${x(0)},${y(-70)} ${x(-50)},${y(-44)}`}
        fill="url(#roofLeft)" stroke="#171f2e" strokeWidth={0.6}
      />

      {/* ── Right roof ── */}
      <polygon
        points={`${x(90)},${y(26)} ${x(0)},${y(0)} ${x(0)},${y(-70)} ${x(50)},${y(-44)}`}
        fill="url(#roofRight)" stroke="#171f2e" strokeWidth={0.6}
      />

      {/* ── Solar panels on left roof (pyramid 3-3-2-1 layout) ── */}
      {panels.map(({ row, col }) => {
        const pw = 22 * s;
        const ph = 13 * s;
        // Walk down-left along the left roof face
        const baseX = x(-82 + col * 24 + row * 11);
        const baseY = y(16 - row * 16);
        const skewY = -4 * s; // isometric skew up to left
        return (
          <polygon
            key={`panel-${row}-${col}`}
            points={`
              ${baseX},${baseY + skewY}
              ${baseX + pw},${baseY}
              ${baseX + pw},${baseY + ph}
              ${baseX},${baseY + ph + skewY}
            `}
            fill="#162d4d"
            stroke="#1e4a75"
            strokeWidth={0.5}
            opacity={0.92}
          />
        );
      })}

      {/* Solar shimmer */}
      {solarActive && (
        <polygon
          points={`${x(-90)},${y(26)} ${x(0)},${y(0)} ${x(0)},${y(-70)} ${x(-50)},${y(-44)}`}
          fill="#fbbf24" opacity={0}
        >
          <animate attributeName="opacity" values="0;0.06;0" dur="3.5s" repeatCount="indefinite" />
        </polygon>
      )}

      {/* ── Front door ── */}
      <rect x={x(10)} y={y(65)} width={20 * s} height={37 * s} rx={1.5}
        fill="#080d17" stroke="#1e2d40" strokeWidth={0.6} />
      <circle cx={x(26)} cy={y(84)} r={2 * s} fill="#3a4f6a" />

      {/* ── Front windows (2 large) ── */}
      {[{ bx: 35, by: 28, w: 30, h: 28 }, { bx: 35, by: 62, w: 30, h: 0 }].slice(0, 1).map((w, i) => (
        <g key={i}>
          <rect x={x(w.bx)} y={y(w.by)} width={w.w * s} height={w.h * s} rx={1}
            fill="#0a1018" stroke="#1c2c3f" strokeWidth={0.5} />
          <line x1={x(w.bx + w.w / 2)} y1={y(w.by)} x2={x(w.bx + w.w / 2)} y2={y(w.by + w.h)} stroke="#1c2c3f" strokeWidth={0.4} />
          <line x1={x(w.bx)} y1={y(w.by + w.h / 2)} x2={x(w.bx + w.w)} y2={y(w.by + w.h / 2)} stroke="#1c2c3f" strokeWidth={0.4} />
          {/* Warm interior glow */}
          <rect x={x(w.bx + 1)} y={y(w.by + 1)} width={(w.w / 2 - 1) * s} height={(w.h / 2 - 1) * s}
            fill="#2a1f00" opacity={0.5}>
            <animate attributeName="fill" values="#2a1f00;#332500;#2a1f00" dur="6s" repeatCount="indefinite" />
          </rect>
        </g>
      ))}

      {/* ── Front wall large window ── */}
      <rect x={x(35)} y={y(28)} width={30 * s} height={28 * s} rx={1}
        fill="#0a1018" stroke="#1c2c3f" strokeWidth={0.5} />
      <line x1={x(50)} y1={y(28)} x2={x(50)} y2={y(56)} stroke="#1c2c3f" strokeWidth={0.4} />
      <line x1={x(35)} y1={y(42)} x2={x(65)} y2={y(42)} stroke="#1c2c3f" strokeWidth={0.4} />
      <rect x={x(36)} y={y(29)} width={13 * s} height={12 * s} rx={0.5} fill="#1e1400" opacity={0.55}>
        <animate attributeName="fill" values="#1e1400;#281b00;#1e1400" dur="8s" repeatCount="indefinite" />
      </rect>

      {/* ── Left side window ── */}
      <rect x={x(-74)} y={y(32)} width={24 * s} height={20 * s} rx={1}
        fill="#0a1018" stroke="#1c2c3f" strokeWidth={0.4} />
      <rect x={x(-73)} y={y(33)} width={10 * s} height={8 * s} fill="#1a1200" opacity={0.45} />

      {/* ── Powerwall battery on left wall ── */}
      <rect x={x(-83)} y={y(52)} width={18 * s} height={42 * s} rx={3}
        fill="#0e1928" stroke="#1e3a5c" strokeWidth={0.8} />
      {/* Battery bars */}
      {[0, 1, 2, 3].map((i) => {
        const filled = i < Math.ceil((batteryPercent / 100) * 4);
        return (
          <rect key={i} x={x(-80)} y={y(56 + i * 8)} width={12 * s} height={5 * s} rx={1}
            fill="#22c55e" opacity={filled ? 0.4 + i * 0.06 : 0.07}>
            {filled && <animate attributeName="opacity" values="0.3;0.55;0.3" dur="2.5s" repeatCount="indefinite" begin={`${i * 0.3}s`} />}
          </rect>
        );
      })}
      <text x={x(-74)} y={y(92)} textAnchor="middle" fill="#2a5a3a" fontSize={5 * s} fontWeight="700" letterSpacing="0.3">PW</text>

      {/* ── Utility meter on front-right corner ── */}
      <rect x={x(70)} y={y(70)} width={16 * s} height={26 * s} rx={2}
        fill="#0e1928" stroke="#1e3a5c" strokeWidth={0.7} />
      <circle cx={x(78)} cy={y(82)} r={5.5 * s} fill="#09111e" stroke="#253a55" strokeWidth={0.5} />
      {/* Spinning dial */}
      <line x1={x(78)} y1={y(82)} x2={x(81)} y2={y(78)} stroke="#8B5CF6" strokeWidth={0.8} opacity={0.9}>
        <animateTransform attributeName="transform" type="rotate"
          from={`0 ${x(78)} ${y(82)}`} to={`360 ${x(78)} ${y(82)}`} dur="5s" repeatCount="indefinite" />
      </line>
      <circle cx={x(78)} cy={y(82)} r={1 * s} fill="#8B5CF6" />
      <text x={x(78)} y={y(93)} textAnchor="middle" fill="#3a5070" fontSize={3.5 * s} fontWeight="600">kWh</text>
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AnimatedEnergyFlow({ data, className }: AnimatedEnergyFlowProps) {
  const isMobile = useIsMobile();
  const C = isMobile;

  const demoData: EnergyFlowData = {
    solarPower: 3.2,
    homePower: 0.7,
    batteryPower: -2.5,
    batteryPercent: 73,
    gridPower: -0.8,
    evPower: 11,
  };

  const flow = data || demoData;

  // Flow calculations
  const solarToHome = flow.solarPower > 0 && flow.homePower > 0 ? Math.min(flow.solarPower, flow.homePower) : 0;
  const solarToBat  = flow.batteryPower > 0 ? Math.min(flow.solarPower, flow.batteryPower) : 0;
  const batToHome   = flow.batteryPower < 0 ? Math.abs(flow.batteryPower) : 0;
  const gridToHome  = flow.gridPower > 0 ? flow.gridPower : 0;
  const solarToGrid = flow.gridPower < 0 ? Math.abs(flow.gridPower) : 0;
  const evPower     = flow.evPower > 0 ? flow.evPower : 0;

  const colors = {
    solar:   '#F59E0B',
    battery: '#22C55E',
    grid:    '#8B5CF6',
    ev:      '#3B82F6',
    home:    '#F97316',
  };

  // ── Layout constants ──────────────────────────────────────────────────────
  // House is the HERO — positioned upper-center, much larger
  const houseScale = C ? 1.0 : 1.22;
  const houseOX    = 200;
  const houseOY    = C ? 200 : 230;

  // Node positions: pushed to extremes so house can breathe
  const N = C ? {
    solar:   { x: 200, y: 44  },
    battery: { x: 46,  y: 334 },
    grid:    { x: 354, y: 334 },
    ev:      { x: 200, y: 415 },
    homeX:   200, homeY: 254,
  } : {
    solar:   { x: 200, y: 48  },
    battery: { x: 46,  y: 378 },
    grid:    { x: 354, y: 378 },
    ev:      { x: 200, y: 468 },
    homeX:   210, homeY: 295,
  };

  const nr = C ? 17 : 20; // node radius
  const vb = C ? '0 0 400 500' : '0 0 400 560';

  // ── Energy flow paths ─────────────────────────────────────────────────────
  // Solar → House (straight down into roof ridge)
  const pSolarHome = `M${N.solar.x},${N.solar.y + nr} C${N.solar.x},${N.solar.y + 70} ${houseOX},${houseOY - 80} ${houseOX},${houseOY - (C ? 50 : 58)}`;

  // Solar → Battery (sweeping left arc)
  const pSolarBat  = `M${N.solar.x - nr},${N.solar.y + 8} C${N.solar.x - 120},${N.solar.y + 90} ${N.battery.x + 30},${N.battery.y - 70} ${N.battery.x + nr},${N.battery.y - 6}`;

  // Battery → Home (rising right curve)
  const pBatHome   = `M${N.battery.x + nr},${N.battery.y - 8} C${N.battery.x + 100},${N.battery.y - 50} ${houseOX - 90},${houseOY + 60} ${houseOX - (C ? 72 : 82)},${houseOY + (C ? 78 : 92)}`;

  // Grid ↔ House (right arc)
  const pGridHome  = `M${N.grid.x - nr},${N.grid.y - 8} C${N.grid.x - 100},${N.grid.y - 50} ${houseOX + 90},${houseOY + 60} ${houseOX + (C ? 72 : 82)},${houseOY + (C ? 78 : 92)}`;
  const pSolarGrid = `M${N.solar.x + nr},${N.solar.y + 8} C${N.solar.x + 120},${N.solar.y + 90} ${N.grid.x - 30},${N.grid.y - 70} ${N.grid.x - nr},${N.grid.y - 6}`;

  // Home → EV (straight down from house base)
  const pToEV      = `M${houseOX},${houseOY + (C ? 108 : 124)} C${houseOX},${houseOY + (C ? 145 : 165)} ${N.ev.x},${N.ev.y - 60} ${N.ev.x},${N.ev.y - nr}`;

  const lfs = C ? 7.5 : 9;   // label font size
  const vfs = C ? 13 : 16;   // value font size

  return (
    <div className={`relative ${className}`}>
      {/* Background */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#06080f] via-[#090d1c] to-[#060810]" />
        {/* Star field */}
        <div className="absolute inset-0 opacity-25" style={{
          backgroundImage: [
            'radial-gradient(1px 1px at 18px 22px,#fff 100%,transparent)',
            'radial-gradient(1px 1px at 78px 58px,#fff 100%,transparent)',
            'radial-gradient(1px 1px at 140px 12px,#fff 100%,transparent)',
            'radial-gradient(1px 1px at 245px 42px,#fff 100%,transparent)',
            'radial-gradient(1px 1px at 315px 72px,#fff 100%,transparent)',
            'radial-gradient(1px 1px at 368px 18px,#fff 100%,transparent)',
            'radial-gradient(1px 1px at 55px 135px,#fff 100%,transparent)',
            'radial-gradient(1px 1px at 285px 155px,#fff 100%,transparent)',
          ].join(', '),
          backgroundSize: '400px 180px',
        }} />
      </div>

      {/* Header */}
      <div className="relative z-10 pt-4 pb-1 px-4 text-center">
        <h3 className="text-sm sm:text-base font-bold tracking-wide" style={{ color: colors.solar }}>
          ⚡ Live Energy Flow
        </h3>
        <p className="text-[10px] sm:text-xs mt-0.5 tracking-wide" style={{ color: '#6b7280' }}>
          First of its kind · <span style={{ color: '#9ca3af', fontWeight: 500 }}>multi-manufacturer view</span>
        </p>
      </div>

      <svg viewBox={vb} className="relative w-full h-full" style={{ maxHeight: C ? '510px' : '600px' }}>
        <defs>
          <linearGradient id="houseLeft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2840" />
            <stop offset="100%" stopColor="#101825" />
          </linearGradient>
          <linearGradient id="houseFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f3050" />
            <stop offset="100%" stopColor="#131d30" />
          </linearGradient>
          <linearGradient id="roofLeft" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0b1424" />
            <stop offset="100%" stopColor="#080f1c" />
          </linearGradient>
          <linearGradient id="roofRight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0e1a2e" />
            <stop offset="100%" stopColor="#080f1c" />
          </linearGradient>

          {/* Per-line glow filters */}
          {(['solar', 'battery', 'grid', 'ev'] as const).map(k => (
            <filter key={k} id={`glow-${k}`} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feFlood floodColor={colors[k]} floodOpacity="0.5" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          ))}

          {/* Node ambient glow */}
          {(['solar', 'battery', 'grid', 'ev'] as const).map(k => (
            <radialGradient key={`rg-${k}`} id={`rg-${k}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={colors[k]} stopOpacity={0.22} />
              <stop offset="100%" stopColor={colors[k]} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>

        {/* Solar ambient bloom */}
        {flow.solarPower > 0 && (
          <ellipse cx={N.solar.x} cy={N.solar.y} rx={C ? 72 : 88} ry={C ? 60 : 74} fill="url(#rg-solar)" opacity={0.8}>
            <animate attributeName="rx" values={C ? '60;80;60' : '75;100;75'} dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;1;0.6" dur="4s" repeatCount="indefinite" />
          </ellipse>
        )}

        {/* ── Energy flow lines — drawn UNDER house ── */}
        <EnergyLine id="solar"    d={pSolarHome} color={colors.solar}   power={solarToHome} />
        <EnergyLine id="solbat"   d={pSolarBat}  color={colors.solar}   power={solarToBat}  />
        <EnergyLine id="battery"  d={pBatHome}   color={colors.battery} power={batToHome}   />
        <EnergyLine id="grid"     d={pGridHome}  color={colors.grid}    power={gridToHome}  />
        <EnergyLine id="solgrid"  d={pSolarGrid} color={colors.grid}    power={solarToGrid} reverse />
        <EnergyLine id="ev"       d={pToEV}      color={colors.ev}      power={evPower}     />

        {/* ── HERO 3D House ── */}
        <House3D
          s={houseScale}
          ox={houseOX}
          oy={houseOY}
          batteryPercent={flow.batteryPercent}
          solarActive={flow.solarPower > 0}
        />

        {/* HOME kW label — centered on front face */}
        <text x={N.homeX} y={N.homeY} textAnchor="middle"
          fill="white" fontSize={vfs} fontWeight="800" opacity={0.95}>
          {flow.homePower.toFixed(1)} kW
        </text>
        <text x={N.homeX} y={N.homeY + (C ? 13 : 15)} textAnchor="middle"
          fill="#7a8fa8" fontSize={lfs} fontWeight="600" letterSpacing="1.8">
          HOME
        </text>

        {/* ══ SOLAR NODE ══ */}
        <Node cx={N.solar.x} cy={N.solar.y} r={nr} color={colors.solar} active={flow.solarPower > 0}>
          {/* Sun rays icon */}
          <g transform={`translate(${N.solar.x}, ${N.solar.y})`}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
              <line key={deg}
                x1={0} y1={-(nr * 0.45)} x2={0} y2={-(nr * 0.7)}
                stroke={colors.solar} strokeWidth={1.2} strokeLinecap="round" strokeOpacity={0.7}
                transform={`rotate(${deg})`} />
            ))}
            <circle cx={0} cy={0} r={nr * 0.32} fill={colors.solar} fillOpacity={0.3}
              stroke={colors.solar} strokeWidth={0.8} />
          </g>
        </Node>
        <text x={N.solar.x} y={N.solar.y - nr - 12} textAnchor="middle"
          fill={colors.solar} fontSize={vfs} fontWeight="800">
          {flow.solarPower.toFixed(1)} kW
        </text>
        <text x={N.solar.x} y={N.solar.y - nr - 3} textAnchor="middle"
          fill="#9ca3af" fontSize={lfs} fontWeight="600" letterSpacing="1.5">
          SOLAR
        </text>

        {/* ══ BATTERY NODE ══ */}
        <Node cx={N.battery.x} cy={N.battery.y} r={nr} color={colors.battery} active={Math.abs(flow.batteryPower) > 0.05}>
          <g transform={`translate(${N.battery.x - 9}, ${N.battery.y - 6})`}>
            <rect x={0} y={0} width={16} height={12} rx={2.5}
              fill="none" stroke={colors.battery} strokeWidth={1.5} />
            <rect x={16} y={3.5} width={2.5} height={5} rx={1}
              fill={colors.battery} opacity={0.5} />
            {Array.from({ length: Math.max(1, Math.ceil((flow.batteryPercent / 100) * 3)) }).map((_, i) => (
              <rect key={i} x={2.5 + i * 4.5} y={2.5} width={3.5} height={7} rx={0.8}
                fill={colors.battery} opacity={0.45 + i * 0.12} />
            ))}
          </g>
        </Node>
        <text x={N.battery.x} y={N.battery.y + nr + (C ? 13 : 15)} textAnchor="middle"
          fill="white" fontSize={C ? 11 : 13} fontWeight="800">
          {Math.abs(flow.batteryPower).toFixed(1)} kW
        </text>
        <text x={N.battery.x} y={N.battery.y + nr + (C ? 24 : 27)} textAnchor="middle"
          fill="#9ca3af" fontSize={lfs} fontWeight="600" letterSpacing="1.2">
          BATTERY
        </text>
        {/* % bar */}
        <rect x={N.battery.x - 22} y={N.battery.y + nr + (C ? 30 : 33)} width={44} height={4} rx={2} fill="#111d30" />
        <rect x={N.battery.x - 22} y={N.battery.y + nr + (C ? 30 : 33)} width={44 * (flow.batteryPercent / 100)} height={4} rx={2} fill={colors.battery} opacity={0.7} />
        <text x={N.battery.x} y={N.battery.y + nr + (C ? 42 : 46)} textAnchor="middle"
          fill="#6b7280" fontSize={C ? 7 : 8}>
          {flow.batteryPercent}% charged
        </text>

        {/* ══ GRID NODE ══ */}
        <Node cx={N.grid.x} cy={N.grid.y} r={nr} color={colors.grid} active={Math.abs(flow.gridPower) > 0.05}>
          {/* Pylon-style icon */}
          <g transform={`translate(${N.grid.x}, ${N.grid.y})`}>
            <line x1={-5} y1={-9} x2={5} y2={-9} stroke={colors.grid} strokeWidth={1} strokeOpacity={0.8} />
            <line x1={-7} y1={-5} x2={7} y2={-5} stroke={colors.grid} strokeWidth={1} strokeOpacity={0.7} />
            <line x1={0} y1={-9} x2={-4} y2={9} stroke={colors.grid} strokeWidth={1.2} strokeOpacity={0.8} />
            <line x1={0} y1={-9} x2={4} y2={9} stroke={colors.grid} strokeWidth={1.2} strokeOpacity={0.8} />
            <line x1={-4} y1={9} x2={4} y2={9} stroke={colors.grid} strokeWidth={1} strokeOpacity={0.7} />
          </g>
        </Node>
        <text x={N.grid.x} y={N.grid.y + nr + (C ? 13 : 15)} textAnchor="middle"
          fill="white" fontSize={C ? 11 : 13} fontWeight="800">
          {Math.abs(flow.gridPower).toFixed(1)} kW
        </text>
        <text x={N.grid.x} y={N.grid.y + nr + (C ? 24 : 27)} textAnchor="middle"
          fill="#9ca3af" fontSize={lfs} fontWeight="600" letterSpacing="1.2">
          GRID
        </text>
        {flow.gridPower !== 0 && (
          <text x={N.grid.x} y={N.grid.y + nr + (C ? 35 : 38)} textAnchor="middle"
            fill={flow.gridPower > 0 ? colors.grid : colors.solar} fontSize={C ? 7 : 8} fontWeight="600">
            {flow.gridPower > 0 ? '↓ importing' : '↑ exporting'}
          </text>
        )}

        {/* ══ EV NODE ══ */}
        <Node cx={N.ev.x} cy={N.ev.y} r={nr} color={colors.ev} active={evPower > 0}>
          <polygon
            points={`${N.ev.x + 3},${N.ev.y - 9} ${N.ev.x - 5},${N.ev.y + 1} ${N.ev.x},${N.ev.y + 1} ${N.ev.x - 3},${N.ev.y + 9} ${N.ev.x + 5},${N.ev.y - 1} ${N.ev.x},${N.ev.y - 1}`}
            fill={colors.ev} opacity={0.85}
          />
          {evPower > 0 && (
            <>
              {[0, 0.8].map((delay, i) => (
                <circle key={i} cx={N.ev.x} cy={N.ev.y} r={nr} fill="none" stroke={colors.ev} strokeWidth={0.7} opacity={0}>
                  <animate attributeName="r" values={`${nr};${nr + 20};${nr}`} dur="2.2s" repeatCount="indefinite" begin={`${delay}s`} />
                  <animate attributeName="opacity" values="0.45;0;0.45" dur="2.2s" repeatCount="indefinite" begin={`${delay}s`} />
                </circle>
              ))}
            </>
          )}
        </Node>
        <text x={N.ev.x} y={N.ev.y + nr + (C ? 13 : 15)} textAnchor="middle"
          fill="white" fontSize={C ? 11 : 13} fontWeight="800">
          {flow.evPower.toFixed(1)} kW
        </text>
        <text x={N.ev.x} y={N.ev.y + nr + (C ? 24 : 27)} textAnchor="middle"
          fill="#9ca3af" fontSize={lfs} fontWeight="600" letterSpacing="1.2">
          EV CHARGER
        </text>
        {evPower > 0 && (
          <text x={N.ev.x} y={N.ev.y + nr + (C ? 35 : 38)} textAnchor="middle"
            fill={colors.ev} fontSize={C ? 7 : 8.5} fontWeight="600">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.6s" repeatCount="indefinite" />
            ⚡ CHARGING
          </text>
        )}

        {/* ── Today's Energy card ── */}
        {(() => {
          const sx = C ? 6 : 8;
          const sy = C ? 428 : 484;
          const cW = C ? 136 : 158;
          const cH = C ? 62 : 72;
          const rH = C ? 15 : 18;
          const vS = C ? 9  : 11;
          const lS = C ? 5.5 : 6.5;

          const stats = [
            { color: colors.solar,   val: (flow.solarPower * 4.2).toFixed(1),                label: 'Solar Generated',    on: flow.solarPower > 0 },
            { color: colors.battery, val: (Math.abs(flow.batteryPower) * 2.9).toFixed(1),    label: 'Battery Discharged', on: flow.batteryPower < 0 },
            { color: colors.ev,      val: (flow.evPower * 3.2).toFixed(1),                   label: 'EV Charged',         on: flow.evPower > 0 },
          ];

          return (
            <g>
              <rect x={sx} y={sy - 4} width={cW} height={cH} rx={7}
                fill="#07090f" fillOpacity={0.9} stroke="#1e293b" strokeWidth={0.5} />
              <text x={sx + 10} y={sy + 9} fill="#4b5563" fontSize={lS} fontWeight="700" letterSpacing="1.5">TODAY&apos;S ENERGY</text>
              <line x1={sx + 10} y1={sy + 13} x2={sx + cW - 10} y2={sy + 13} stroke="#1e293b" strokeWidth={0.5} />
              {stats.map((s, i) => {
                const ry = sy + 19 + i * rH;
                return (
                  <g key={s.label}>
                    <rect x={sx + 10} y={ry} width={2.5} height={C ? 9 : 11} rx={1.2}
                      fill={s.on ? s.color : '#374151'} opacity={s.on ? 0.85 : 0.25}>
                      {s.on && <animate attributeName="opacity" values="0.55;0.95;0.55" dur="3s" repeatCount="indefinite" />}
                    </rect>
                    <text x={sx + 17} y={ry + (C ? 6.5 : 7.5)} fill={s.on ? '#f1f5f9' : '#4b5563'}
                      fontSize={vS} fontWeight="800">{s.val}</text>
                    <text x={sx + 17 + s.val.length * (vS * 0.63)} y={ry + (C ? 6.5 : 7.5)}
                      fill="#9ca3af" fontSize={vS - 1.5}> kWh</text>
                    <text x={sx + 17} y={ry + (C ? 14 : 16)} fill={s.on ? '#6b7280' : '#374151'}
                      fontSize={lS}>{s.label}</text>
                  </g>
                );
              })}
            </g>
          );
        })()}

        {/* ── Manufacturer badges ── */}
        {(() => {
          const bx = C ? 356 : 370;
          const by = C ? 444 : 500;
          const gap = C ? 13 : 15;
          const pW  = C ? 56 : 64;
          const pH  = C ? 11 : 13;
          const fs  = C ? 5.5 : 6.5;
          const brands = [
            { label: 'ENPHASE',     color: colors.solar   },
            { label: 'TESLA',       color: colors.battery },
            { label: 'CHARGEPOINT', color: colors.ev      },
          ];
          return brands.map((b, i) => (
            <g key={b.label}>
              <rect x={bx - pW / 2} y={by + i * gap} width={pW} height={pH} rx={pH / 2}
                fill={b.color} fillOpacity={0.08} stroke={b.color} strokeWidth={0.4} strokeOpacity={0.35} />
              <text x={bx} y={by + i * gap + pH / 2 + (C ? 1.8 : 2.2)} textAnchor="middle"
                fill={b.color} fontSize={fs} fontWeight="600" letterSpacing="0.3" opacity={0.9}>{b.label}</text>
            </g>
          ));
        })()}
      </svg>
    </div>
  );
}
