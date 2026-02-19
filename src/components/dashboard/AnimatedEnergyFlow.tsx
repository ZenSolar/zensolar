import { useState, useEffect, useRef } from 'react';
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

// ─── Flowing energy line with animated dash offset ───────────────────────────
function EnergyLine({
  id,
  d,
  color,
  power,
  reverse = false,
}: {
  id: string;
  d: string;
  color: string;
  power: number;
  reverse?: boolean;
}) {
  const active = power > 0.05;
  const speed = active ? Math.max(0.4, 1.5 - power * 0.08) : 0;
  const dashLen = 10;
  const gapLen = 14;
  const total = dashLen + gapLen;
  const direction = reverse ? total : -total;

  return (
    <g>
      {/* Base track */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={active ? 2.5 : 1.2}
        strokeOpacity={active ? 0.15 : 0.06}
      />
      {/* Glow layer */}
      {active && (
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeOpacity={0.06}
          filter={`url(#lineGlow-${id})`}
        />
      )}
      {/* Animated dash */}
      {active && (
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={`${dashLen} ${gapLen}`}
          strokeOpacity={0.85}
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to={`${direction}`}
            dur={`${speed}s`}
            repeatCount="indefinite"
          />
        </path>
      )}
    </g>
  );
}

// ─── Pulsing node circle ──────────────────────────────────────────────────────
function NodeRing({
  cx,
  cy,
  r,
  color,
  active,
}: {
  cx: number;
  cy: number;
  r: number;
  color: string;
  active: boolean;
}) {
  return (
    <>
      {/* Outer pulse */}
      {active && (
        <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.3}>
          <animate attributeName="r" values={`${r + 2};${r + 10};${r + 2}`} dur="3s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
        </circle>
      )}
      {/* Inner fill */}
      <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={active ? 0.12 : 0.05} stroke={color} strokeWidth={1.5} strokeOpacity={active ? 0.6 : 0.2} />
    </>
  );
}

// ─── 3D isometric-style house ─────────────────────────────────────────────────
function House3D({ compact }: { compact: boolean }) {
  const s = compact ? 0.78 : 1;
  const ox = compact ? 200 : 200;
  const oy = compact ? 165 : 200;

  // Scale helper
  const x = (v: number) => ox + v * s;
  const y = (v: number) => oy + v * s;

  return (
    <g>
      {/* Ground shadow */}
      <ellipse cx={x(0)} cy={y(108)} rx={110 * s} ry={10 * s} fill="#000" opacity={0.25} />

      {/* ── Left wall (darker face) ── */}
      <polygon
        points={`${x(-72)},${y(20)} ${x(-72)},${y(108)} ${x(0)},${y(88)} ${x(0)},${y(0)}`}
        fill="url(#houseLeft)"
        stroke="#1e2d3d"
        strokeWidth={0.8}
      />
      {/* ── Front wall (lighter face) ── */}
      <polygon
        points={`${x(0)},${y(0)} ${x(0)},${y(88)} ${x(72)},${y(108)} ${x(72)},${y(20)}`}
        fill="url(#houseFront)"
        stroke="#1e2d3d"
        strokeWidth={0.8}
      />

      {/* ── Left roof ── */}
      <polygon
        points={`${x(-72)},${y(20)} ${x(0)},${y(0)} ${x(0)},${y(-56)} ${x(-40)},${y(-36)}`}
        fill="url(#roofLeft)"
        stroke="#1a2535"
        strokeWidth={0.6}
      />
      {/* ── Right roof ── */}
      <polygon
        points={`${x(72)},${y(20)} ${x(0)},${y(0)} ${x(0)},${y(-56)} ${x(40)},${y(-36)}`}
        fill="url(#roofRight)"
        stroke="#1a2535"
        strokeWidth={0.6}
      />

      {/* ── Ridge cap ── */}
      <line x1={x(-40)} y1={y(-36)} x2={x(0)} y2={y(-56)} stroke="#232f42" strokeWidth={1.2} />
      <line x1={x(40)} y1={y(-36)} x2={x(0)} y2={y(-56)} stroke="#232f42" strokeWidth={1.2} />

      {/* ── Solar panels on left roof ── */}
      {[0, 1, 2].map(row =>
        Array.from({ length: 3 - row }).map((_, col) => {
          const panelW = 18 * s;
          const panelH = 10 * s;
          const startX = x(-60 + col * 20);
          const startY = y(10 - row * 14);
          const skew = -3 * s;
          return (
            <polygon
              key={`p-${row}-${col}`}
              points={`${startX},${startY + skew} ${startX + panelW},${startY} ${startX + panelW},${startY + panelH} ${startX},${startY + panelH + skew}`}
              fill="#1a3a5c"
              stroke="#2d6090"
              strokeWidth={0.5}
              opacity={0.9}
            />
          );
        })
      )}

      {/* Solar panel shimmer */}
      <polygon
        points={`${x(-72)},${y(20)} ${x(0)},${y(0)} ${x(0)},${y(-56)} ${x(-40)},${y(-36)}`}
        fill="#60a5fa"
        opacity={0}
      >
        <animate attributeName="opacity" values="0;0.04;0" dur="4s" repeatCount="indefinite" />
      </polygon>

      {/* ── Front door ── */}
      <rect x={x(10)} y={y(58)} width={18 * s} height={30 * s} rx={1} fill="#0a0f1a" stroke="#1e2d3d" strokeWidth={0.6} />
      <circle cx={x(24)} cy={y(74)} r={1.5 * s} fill="#4a5568" />

      {/* ── Front windows ── */}
      <rect x={x(32)} y={y(30)} width={26 * s} height={22 * s} rx={1} fill="#0a0f1a" stroke="#1e2d3d" strokeWidth={0.5} />
      <line x1={x(45)} y1={y(30)} x2={x(45)} y2={y(52)} stroke="#1e2d3d" strokeWidth={0.4} />
      <line x1={x(32)} y1={y(41)} x2={x(58)} y2={y(41)} stroke="#1e2d3d" strokeWidth={0.4} />
      <rect x={x(33)} y={y(31)} width={11 * s} height={9 * s} fill="#1a1800" opacity={0.5}>
        <animate attributeName="fill" values="#1a1800;#221e00;#1a1800" dur="7s" repeatCount="indefinite" />
      </rect>

      {/* ── Left side window ── */}
      <rect x={x(-58)} y={y(30)} width={20 * s} height={18 * s} rx={1} fill="#0a0f1a" stroke="#1e2d3d" strokeWidth={0.4} />
      <rect x={x(-57)} y={y(31)} width={8 * s} height={7 * s} fill="#1a1800" opacity={0.4} />

      {/* ── Powerwall on left wall ── */}
      <rect x={x(-65)} y={y(48)} width={16 * s} height={32 * s} rx={2} fill="#141e30" stroke="#2a4060" strokeWidth={0.7} />
      <rect x={x(-63)} y={y(52)} width={12 * s} height={3 * s} rx={1} fill="#22c55e" opacity={0.3}>
        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2.5s" repeatCount="indefinite" />
      </rect>
      <rect x={x(-63)} y={y(57)} width={12 * s} height={3 * s} rx={1} fill="#22c55e" opacity={0.18} />
      <rect x={x(-63)} y={y(62)} width={12 * s} height={3 * s} rx={1} fill="#22c55e" opacity={0.1} />
      <text x={x(-57)} y={y(74)} textAnchor="middle" fill="#3a5a7a" fontSize={5 * s} fontWeight="700">PW</text>

      {/* ── Utility meter on right wall ── */}
      <rect x={x(52)} y={y(58)} width={16 * s} height={22 * s} rx={1.5} fill="#141e30" stroke="#2a4060" strokeWidth={0.6} />
      <circle cx={x(60)} cy={y(68)} r={5 * s} fill="#0a1018" stroke="#3a5070" strokeWidth={0.4} />
      <line x1={x(60)} y1={y(68)} x2={x(63)} y2={y(65)} stroke="#8B5CF6" strokeWidth={0.5} opacity={0.8}>
        <animateTransform attributeName="transform" type="rotate" from={`0 ${x(60)} ${y(68)}`} to={`360 ${x(60)} ${y(68)}`} dur="6s" repeatCount="indefinite" />
      </line>
      <circle cx={x(60)} cy={y(68)} r={0.8 * s} fill="#8B5CF6" />
      <text x={x(60)} y={y(78)} textAnchor="middle" fill="#3a5a7a" fontSize={3.5 * s} fontWeight="600">kWh</text>
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AnimatedEnergyFlow({ data, className }: AnimatedEnergyFlowProps) {
  const isMobile = useIsMobile();
  const compact = isMobile;

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
  const solarToHome   = flow.solarPower > 0 && flow.homePower > 0 ? Math.min(flow.solarPower, flow.homePower) : 0;
  const solarToBat    = flow.solarPower > 0 && flow.batteryPower > 0 ? Math.min(flow.solarPower - solarToHome, flow.batteryPower) : 0;
  const batToHome     = flow.batteryPower < 0 ? Math.abs(flow.batteryPower) : 0;
  const gridToHome    = flow.gridPower > 0 ? flow.gridPower : 0;
  const solarToGrid   = flow.gridPower < 0 ? Math.abs(flow.gridPower) : 0;
  const solarToEV     = flow.evPower > 0 ? flow.evPower : 0;

  const colors = {
    solar:   '#F59E0B',
    battery: '#22C55E',
    home:    '#F97316',
    grid:    '#8B5CF6',
    ev:      '#3B82F6',
  };

  // ── Node positions (compact vs full) ──
  //   Layout: Solar top-center, House center, Battery left, Grid right, EV bottom
  const C = compact;
  const W = 400;

  const nodes = C ? {
    solar:   { x: 200, y: 52  },
    home:    { x: 200, y: 210 },
    battery: { x: 62,  y: 290 },
    grid:    { x: 338, y: 290 },
    ev:      { x: 200, y: 370 },
  } : {
    solar:   { x: 200, y: 60  },
    home:    { x: 200, y: 230 },
    battery: { x: 58,  y: 330 },
    grid:    { x: 342, y: 330 },
    ev:      { x: 200, y: 428 },
  };

  // Connection path definitions — curved splines between nodes
  // Solar → Home (straight down into roof)
  const pSolarHome = `M${nodes.solar.x},${nodes.solar.y + 18} C${nodes.solar.x},${nodes.solar.y + 60} ${nodes.home.x},${nodes.home.y - 80} ${nodes.home.x},${nodes.home.y - 42}`;

  // Solar → Battery (arc left)
  const pSolarBat  = `M${nodes.solar.x - 22},${nodes.solar.y + 14} C${nodes.solar.x - 100},${nodes.solar.y + 80} ${nodes.battery.x + 20},${nodes.battery.y - 60} ${nodes.battery.x + 18},${nodes.battery.y - 18}`;

  // Battery → Home (curve up-right)
  const pBatHome   = `M${nodes.battery.x + 22},${nodes.battery.y - 10} C${nodes.battery.x + 90},${nodes.battery.y - 40} ${nodes.home.x - 80},${nodes.home.y + 20} ${nodes.home.x - 38},${nodes.home.y + 8}`;

  // Grid → Home / Solar → Grid (right side arc)
  const pGridHome  = `M${nodes.grid.x - 22},${nodes.grid.y - 10} C${nodes.grid.x - 90},${nodes.grid.y - 40} ${nodes.home.x + 80},${nodes.home.y + 20} ${nodes.home.x + 38},${nodes.home.y + 8}`;
  const pSolarGrid = `M${nodes.solar.x + 22},${nodes.solar.y + 14} C${nodes.solar.x + 100},${nodes.solar.y + 80} ${nodes.grid.x - 20},${nodes.grid.y - 60} ${nodes.grid.x - 18},${nodes.grid.y - 18}`;

  // Home → EV (straight down)
  const pToEV      = `M${nodes.home.x},${nodes.home.y + (C ? 55 : 62)} C${nodes.home.x},${nodes.home.y + (C ? 90 : 100)} ${nodes.ev.x},${nodes.ev.y - 55} ${nodes.ev.x},${nodes.ev.y - 18}`;

  const vb   = C ? '0 0 400 480' : '0 0 400 560';
  const maxH = C ? '490px' : '640px';
  const lfs  = C ? 7.5 : 9;   // label font size
  const vfs  = C ? 13  : 17;  // value font size
  const svfs = C ? 10  : 13;  // sub-value font size
  const nr   = C ? 16  : 19;  // node radius

  return (
    <div className={`relative ${className}`}>
      {/* Background */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#07090f] via-[#0b0f1c] to-[#070a10]" />
        {/* Subtle star field */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: [
            'radial-gradient(1px 1px at 15px 25px, #fff 100%, transparent)',
            'radial-gradient(1px 1px at 70px 55px, #fff 100%, transparent)',
            'radial-gradient(1px 1px at 130px 15px, #fff 100%, transparent)',
            'radial-gradient(1px 1px at 250px 40px, #fff 100%, transparent)',
            'radial-gradient(1px 1px at 310px 70px, #fff 100%, transparent)',
            'radial-gradient(1px 1px at 370px 20px, #fff 100%, transparent)',
          ].join(', '),
          backgroundSize: '400px 90px',
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

      <svg viewBox={vb} className="relative w-full h-full" style={{ maxHeight: maxH }}>
        <defs>
          {/* Gradient fills */}
          <linearGradient id="houseLeft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2438" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
          <linearGradient id="houseFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f2d44" />
            <stop offset="100%" stopColor="#141d2e" />
          </linearGradient>
          <linearGradient id="roofLeft" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0d1525" />
            <stop offset="100%" stopColor="#0a1020" />
          </linearGradient>
          <linearGradient id="roofRight" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f1a2e" />
            <stop offset="100%" stopColor="#0a1020" />
          </linearGradient>

          {/* Per-color glow filters for lines */}
          {Object.entries(colors).map(([key, col]) => (
            <filter key={key} id={`lineGlow-${key}`} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feFlood floodColor={col} floodOpacity="0.6" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          ))}

          {/* Node glow */}
          <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Solar radial ambient */}
          <radialGradient id="solarAmbient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.solar} stopOpacity={0.18} />
            <stop offset="70%" stopColor={colors.solar} stopOpacity={0.04} />
            <stop offset="100%" stopColor={colors.solar} stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Solar ambient glow */}
        {flow.solarPower > 0 && (
          <circle cx={nodes.solar.x} cy={nodes.solar.y} r={C ? 70 : 90} fill="url(#solarAmbient)">
            <animate attributeName="r" values={C ? '60;80;60' : '80;105;80'} dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;1;0.7" dur="4s" repeatCount="indefinite" />
          </circle>
        )}

        {/* ── Energy flow lines (drawn UNDER house) ── */}
        <EnergyLine id="solar"   d={pSolarHome} color={colors.solar}   power={solarToHome} />
        <EnergyLine id="solbat"  d={pSolarBat}  color={colors.solar}   power={solarToBat}  />
        <EnergyLine id="bathome" d={pBatHome}   color={colors.battery} power={batToHome}   />
        <EnergyLine id="gridhome" d={pGridHome}  color={colors.grid}    power={gridToHome}  />
        <EnergyLine id="solgrid"  d={pSolarGrid} color={colors.grid}    power={solarToGrid} reverse />
        <EnergyLine id="ev"       d={pToEV}      color={colors.ev}      power={solarToEV}   />

        {/* ── 3D House illustration ── */}
        <House3D compact={compact} />

        {/* HOME label centered on house front */}
        <text
          x={nodes.home.x + (C ? 10 : 12)}
          y={nodes.home.y + (C ? 12 : 18)}
          textAnchor="middle"
          fill="white"
          fontSize={vfs}
          fontWeight="800"
          opacity={0.9}
        >
          {flow.homePower.toFixed(1)} kW
        </text>
        <text
          x={nodes.home.x + (C ? 10 : 12)}
          y={nodes.home.y + (C ? 25 : 32)}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize={lfs}
          fontWeight="600"
          letterSpacing="1.5"
        >
          HOME
        </text>

        {/* ── SOLAR NODE ── */}
        <g>
          <NodeRing cx={nodes.solar.x} cy={nodes.solar.y} r={nr} color={colors.solar} active={flow.solarPower > 0} />
          {/* Sun icon */}
          <foreignObject x={nodes.solar.x - 10} y={nodes.solar.y - 10} width={20} height={20}>
            <div className="flex items-center justify-center w-full h-full">
              <svg viewBox="0 0 24 24" fill="none" stroke={colors.solar} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            </div>
          </foreignObject>
          <text x={nodes.solar.x} y={nodes.solar.y - nr - 11} textAnchor="middle" fill={colors.solar} fontSize={vfs} fontWeight="800">
            {flow.solarPower.toFixed(1)} kW
          </text>
          <text x={nodes.solar.x} y={nodes.solar.y - nr - 2} textAnchor="middle" fill="#9ca3af" fontSize={lfs} fontWeight="600" letterSpacing="1.5">
            SOLAR
          </text>
        </g>

        {/* ── BATTERY NODE ── */}
        <g>
          <NodeRing cx={nodes.battery.x} cy={nodes.battery.y} r={nr} color={colors.battery} active={Math.abs(flow.batteryPower) > 0.05} />
          {/* Battery bar icon */}
          <g transform={`translate(${nodes.battery.x - 8}, ${nodes.battery.y - 5})`}>
            <rect x={0} y={0} width={14} height={10} rx={2} fill="none" stroke={colors.battery} strokeWidth={1.4} />
            <rect x={14} y={3} width={2} height={4} rx={0.8} fill={colors.battery} opacity={0.5} />
            {Array.from({ length: Math.ceil((flow.batteryPercent / 100) * 3) }).map((_, i) => (
              <rect key={i} x={2 + i * 4} y={2} width={3} height={6} rx={0.5} fill={colors.battery} opacity={0.5 + i * 0.15} />
            ))}
          </g>
          <text x={nodes.battery.x} y={nodes.battery.y + nr + 14} textAnchor="middle" fill="white" fontSize={svfs} fontWeight="800">
            {Math.abs(flow.batteryPower).toFixed(1)} kW
          </text>
          <text x={nodes.battery.x} y={nodes.battery.y + nr + 25} textAnchor="middle" fill="#9ca3af" fontSize={lfs} fontWeight="600" letterSpacing="1.2">
            BATTERY
          </text>
          {/* % bar */}
          <rect x={nodes.battery.x - 20} y={nodes.battery.y + nr + 29} width={40} height={4} rx={2} fill="#1a2030" />
          <rect x={nodes.battery.x - 20} y={nodes.battery.y + nr + 29} width={40 * (flow.batteryPercent / 100)} height={4} rx={2} fill={colors.battery} opacity={0.7} />
          <text x={nodes.battery.x} y={nodes.battery.y + nr + 40} textAnchor="middle" fill="#6b7280" fontSize={C ? 7 : 8.5}>
            {flow.batteryPercent}% charged
          </text>
        </g>

        {/* ── GRID NODE ── */}
        <g>
          <NodeRing cx={nodes.grid.x} cy={nodes.grid.y} r={nr} color={colors.grid} active={Math.abs(flow.gridPower) > 0.05} />
          {/* Pylon icon */}
          <foreignObject x={nodes.grid.x - 10} y={nodes.grid.y - 10} width={20} height={20}>
            <div className="flex items-center justify-center w-full h-full">
              <svg viewBox="0 0 24 24" fill="none" stroke={colors.grid} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M8 2h8l-2 6h3l-5 14 1-8H9l1-6H8z" />
                <line x1="4" y1="8" x2="20" y2="8" />
                <line x1="6" y1="4" x2="18" y2="4" />
              </svg>
            </div>
          </foreignObject>
          <text x={nodes.grid.x} y={nodes.grid.y + nr + 14} textAnchor="middle" fill="white" fontSize={svfs} fontWeight="800">
            {Math.abs(flow.gridPower).toFixed(1)} kW
          </text>
          <text x={nodes.grid.x} y={nodes.grid.y + nr + 25} textAnchor="middle" fill="#9ca3af" fontSize={lfs} fontWeight="600" letterSpacing="1.2">
            GRID
          </text>
          {flow.gridPower !== 0 && (
            <text x={nodes.grid.x} y={nodes.grid.y + nr + 36} textAnchor="middle" fill={flow.gridPower > 0 ? colors.grid : colors.solar} fontSize={C ? 7 : 8.5} fontWeight="500">
              {flow.gridPower > 0 ? '↓ importing' : '↑ exporting'}
            </text>
          )}
        </g>

        {/* ── EV NODE ── */}
        <g>
          <NodeRing cx={nodes.ev.x} cy={nodes.ev.y} r={nr} color={colors.ev} active={flow.evPower > 0} />
          {/* Lightning bolt */}
          <foreignObject x={nodes.ev.x - 10} y={nodes.ev.y - 10} width={20} height={20}>
            <div className="flex items-center justify-center w-full h-full">
              <svg viewBox="0 0 24 24" fill={colors.ev} strokeWidth={0} className="w-4 h-4">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
          </foreignObject>
          {/* Charging pulse rings */}
          {flow.evPower > 0 && (
            <>
              <circle cx={nodes.ev.x} cy={nodes.ev.y} r={nr + 8} fill="none" stroke={colors.ev} strokeWidth={0.8} opacity={0}>
                <animate attributeName="r" values={`${nr};${nr + 22};${nr}`} dur="2s" repeatCount="indefinite" begin="0s" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" begin="0s" />
              </circle>
              <circle cx={nodes.ev.x} cy={nodes.ev.y} r={nr + 8} fill="none" stroke={colors.ev} strokeWidth={0.8} opacity={0}>
                <animate attributeName="r" values={`${nr};${nr + 22};${nr}`} dur="2s" repeatCount="indefinite" begin="0.7s" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" begin="0.7s" />
              </circle>
            </>
          )}
          <text x={nodes.ev.x} y={nodes.ev.y + nr + 14} textAnchor="middle" fill="white" fontSize={svfs} fontWeight="800">
            {flow.evPower.toFixed(1)} kW
          </text>
          <text x={nodes.ev.x} y={nodes.ev.y + nr + 25} textAnchor="middle" fill="#9ca3af" fontSize={lfs} fontWeight="600" letterSpacing="1.2">
            EV CHARGER
          </text>
          {flow.evPower > 0 && (
            <text x={nodes.ev.x} y={nodes.ev.y + nr + 36} textAnchor="middle" fill={colors.ev} fontSize={C ? 7 : 8.5} fontWeight="600">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite" />
              ⚡ CHARGING
            </text>
          )}
        </g>

        {/* ── Footer: Today's stats ── */}
        {(() => {
          const sx = C ? 8 : 10;
          const sy = C ? 400 : 482;
          const cardW = C ? 130 : 155;
          const cardH = C ? 68 : 80;
          const rowH  = C ? 16 : 19;
          const vSize = C ? 9 : 11;
          const lSize = C ? 5.5 : 6.5;

          const stats = [
            { color: colors.solar,   value: `${(flow.solarPower * 4.2).toFixed(1)}`,             unit: 'kWh', label: 'Solar Generated',       active: flow.solarPower > 0 },
            { color: colors.battery, value: `${(Math.abs(flow.batteryPower) * 2.9).toFixed(1)}`, unit: 'kWh', label: 'Battery Discharged',    active: flow.batteryPower < 0 },
            { color: colors.ev,      value: `${(flow.evPower * 3.2).toFixed(1)}`,                unit: 'kWh', label: 'EV Charged',            active: flow.evPower > 0 },
          ];

          return (
            <g>
              <rect x={sx} y={sy - 4} width={cardW} height={cardH} rx={7} fill="#080c14" fillOpacity={0.85} stroke="#1e293b" strokeWidth={0.5} />
              <text x={sx + 9} y={sy + 9} fill="#4b5563" fontSize={lSize} fontWeight="700" letterSpacing="1.5">TODAY&apos;S ENERGY</text>
              <line x1={sx + 9} y1={sy + 13} x2={sx + cardW - 9} y2={sy + 13} stroke="#1e293b" strokeWidth={0.5} />
              {stats.map((s, i) => {
                const ry = sy + 19 + i * rowH;
                return (
                  <g key={s.label}>
                    <rect x={sx + 9} y={ry} width={2.5} height={C ? 9 : 11} rx={1.25} fill={s.active ? s.color : '#374151'} opacity={s.active ? 0.85 : 0.25}>
                      {s.active && <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />}
                    </rect>
                    <text x={sx + 16} y={ry + (C ? 6 : 7)} fill={s.active ? '#f3f4f6' : '#4b5563'} fontSize={vSize} fontWeight="800">{s.value}</text>
                    <text x={sx + 16 + s.value.length * (vSize * 0.62)} y={ry + (C ? 6 : 7)} fill={s.active ? '#9ca3af' : '#4b5563'} fontSize={vSize - 2}> {s.unit}</text>
                    <text x={sx + 16} y={ry + (C ? 14 : 16)} fill={s.active ? '#6b7280' : '#374151'} fontSize={lSize}>{s.label}</text>
                  </g>
                );
              })}
            </g>
          );
        })()}

        {/* ── Manufacturer badges ── */}
        {(() => {
          const bx = C ? 352 : 364;
          const by = C ? 418 : 500;
          const gap = C ? 13 : 15;
          const pillW = C ? 52 : 60;
          const pillH = C ? 11 : 13;
          const fs   = C ? 5.5 : 6.5;
          const brands = [
            { label: 'ENPHASE',    color: colors.solar   },
            { label: 'TESLA',      color: colors.battery },
            { label: 'CHARGEPOINT', color: colors.ev      },
          ];
          return brands.map((b, i) => (
            <g key={b.label}>
              <rect x={bx - pillW / 2} y={by + i * gap} width={pillW} height={pillH} rx={pillH / 2} fill={b.color} fillOpacity={0.08} stroke={b.color} strokeWidth={0.4} strokeOpacity={0.3} />
              <text x={bx} y={by + i * gap + pillH / 2 + (C ? 1.8 : 2.2)} textAnchor="middle" fill={b.color} fontSize={fs} fontWeight="600" letterSpacing="0.3" opacity={0.9}>{b.label}</text>
            </g>
          ));
        })()}
      </svg>
    </div>
  );
}
