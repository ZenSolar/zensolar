import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

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

// Smooth animated particles along SVG path
function FlowingDots({
  pathId,
  color,
  power,
  dotCount = 4,
}: {
  pathId: string;
  color: string;
  power: number;
  dotCount?: number;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait for paths to render
    const timer = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (power <= 0.05 || !ready) return null;

  const duration = Math.max(1.8, 3.5 - power * 0.25);
  const count = Math.min(Math.max(2, Math.ceil(power * 0.6)), dotCount);

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <circle
          key={`${pathId}-d-${i}`}
          r={3}
          fill={color}
          opacity={0}
          filter="url(#dotGlow)"
        >
          <animateMotion
            dur={`${duration}s`}
            repeatCount="indefinite"
            begin={`${(i / count) * duration}s`}
            calcMode="linear"
          >
            <mpath href={`#${pathId}`} />
          </animateMotion>
          <animate
            attributeName="opacity"
            values="0;0.9;0.9;0"
            keyTimes="0;0.1;0.85;1"
            dur={`${duration}s`}
            repeatCount="indefinite"
            begin={`${(i / count) * duration}s`}
          />
        </circle>
      ))}
      {/* Trail effect — fainter, larger dots */}
      {Array.from({ length: count }).map((_, i) => (
        <circle
          key={`${pathId}-t-${i}`}
          r={6}
          fill={color}
          opacity={0}
        >
          <animateMotion
            dur={`${duration}s`}
            repeatCount="indefinite"
            begin={`${(i / count) * duration}s`}
            calcMode="linear"
          >
            <mpath href={`#${pathId}`} />
          </animateMotion>
          <animate
            attributeName="opacity"
            values="0;0.15;0.15;0"
            keyTimes="0;0.1;0.85;1"
            dur={`${duration}s`}
            repeatCount="indefinite"
            begin={`${(i / count) * duration}s`}
          />
        </circle>
      ))}
    </>
  );
}

// Stylized house SVG
function HouseIllustration() {
  return (
    <g>
      {/* House body */}
      <rect x="145" y="195" width="110" height="85" rx="3" fill="#1a1f2e" stroke="#2a3040" strokeWidth="1" />
      {/* Roof */}
      <polygon points="135,198 200,148 265,198" fill="#141825" stroke="#2a3040" strokeWidth="1" />
      {/* Solar panels on roof */}
      <g opacity="0.9">
        {/* Panel row 1 */}
        <rect x="155" y="168" width="22" height="14" rx="1" fill="#1e3a5f" stroke="#2d5a8a" strokeWidth="0.5" />
        <rect x="179" y="168" width="22" height="14" rx="1" fill="#1e3a5f" stroke="#2d5a8a" strokeWidth="0.5" />
        <rect x="203" y="168" width="22" height="14" rx="1" fill="#1e3a5f" stroke="#2d5a8a" strokeWidth="0.5" />
        {/* Panel grid lines */}
        <line x1="166" y1="168" x2="166" y2="182" stroke="#2d5a8a" strokeWidth="0.3" />
        <line x1="190" y1="168" x2="190" y2="182" stroke="#2d5a8a" strokeWidth="0.3" />
        <line x1="214" y1="168" x2="214" y2="182" stroke="#2d5a8a" strokeWidth="0.3" />
        <line x1="155" y1="175" x2="225" y2="175" stroke="#2d5a8a" strokeWidth="0.3" />
        {/* Panel row 2 */}
        <rect x="161" y="183" width="22" height="12" rx="1" fill="#1e3a5f" stroke="#2d5a8a" strokeWidth="0.5" />
        <rect x="185" y="183" width="22" height="12" rx="1" fill="#1e3a5f" stroke="#2d5a8a" strokeWidth="0.5" />
        <rect x="209" y="183" width="16" height="12" rx="1" fill="#1e3a5f" stroke="#2d5a8a" strokeWidth="0.5" />
      </g>
      {/* Windows */}
      <rect x="160" y="215" width="18" height="22" rx="1" fill="#0d1117" stroke="#2a3040" strokeWidth="0.5">
        <animate attributeName="fill" values="#0d1117;#1a2332;#0d1117" dur="5s" repeatCount="indefinite" />
      </rect>
      <rect x="222" y="215" width="18" height="22" rx="1" fill="#0d1117" stroke="#2a3040" strokeWidth="0.5">
        <animate attributeName="fill" values="#0d1117;#182030;#0d1117" dur="7s" repeatCount="indefinite" />
      </rect>
      {/* Door */}
      <rect x="190" y="245" width="20" height="35" rx="2" fill="#0f1520" stroke="#2a3040" strokeWidth="0.5" />
      <circle cx="206" cy="263" r="1.5" fill="#3a4050" />
      {/* Powerwall unit (left side) */}
      <rect x="118" y="240" width="18" height="35" rx="2" fill="#1a2030" stroke="#2a3550" strokeWidth="0.8" />
      <rect x="121" y="243" width="12" height="4" rx="1" fill="#22c55e" opacity="0.3" />
      <text x="127" y="268" textAnchor="middle" fill="#4a5568" fontSize="5" fontWeight="600">PW</text>
      {/* Ground line */}
      <line x1="100" y1="280" x2="300" y2="280" stroke="#1a2030" strokeWidth="1" />
    </g>
  );
}

export function AnimatedEnergyFlow({ data, className }: AnimatedEnergyFlowProps) {
  const demoData: EnergyFlowData = {
    solarPower: 3.2,
    homePower: 0.7,
    batteryPower: -2.5,
    batteryPercent: 73,
    gridPower: 0,
    evPower: 0.8,
  };

  const flow = data || demoData;

  // Flow calculations
  const solarToHome = flow.solarPower > 0 && flow.homePower > 0 ? Math.min(flow.solarPower, flow.homePower) : 0;
  const solarToBattery = flow.solarPower > 0 && flow.batteryPower > 0 ? Math.min(flow.solarPower - solarToHome, flow.batteryPower) : 0;
  const batteryToHome = flow.batteryPower < 0 ? Math.abs(flow.batteryPower) : 0;
  const gridToHome = flow.gridPower > 0 ? flow.gridPower : 0;
  const solarToGrid = flow.gridPower < 0 ? Math.abs(flow.gridPower) : 0;
  const solarToEV = flow.evPower > 0 ? flow.evPower : 0;

  const colors = {
    solar: '#F59E0B',
    battery: '#22C55E',
    home: '#F97316',
    grid: '#8B5CF6',
    ev: '#3B82F6',
  };

  // Node positions around the house
  const nodes = {
    solar: { x: 200, y: 80 },
    home: { x: 200, y: 220 },
    battery: { x: 55, y: 260 },
    grid: { x: 345, y: 260 },
    ev: { x: 200, y: 370 },
  };

  return (
    <div className={`relative ${className}`}>
      {/* Dark premium background */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0d1220] to-[#0a0e18]" />
        {/* Subtle stars/dots */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 80px 60px, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 140px 20px, rgba(255,255,255,0.15), transparent), radial-gradient(1px 1px at 280px 45px, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 320px 80px, rgba(255,255,255,0.15), transparent)',
          backgroundSize: '400px 100px',
        }} />
      </div>

      <svg
        viewBox="0 0 400 430"
        className="relative w-full h-full"
        style={{ maxHeight: '520px' }}
      >
        <defs>
          {/* Dot glow */}
          <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Node icon glow */}
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Solar ambient glow */}
          <radialGradient id="solarAmbient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.solar} stopOpacity={0.12} />
            <stop offset="60%" stopColor={colors.solar} stopOpacity={0.04} />
            <stop offset="100%" stopColor={colors.solar} stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Solar ambient light */}
        {flow.solarPower > 0 && (
          <circle cx={nodes.solar.x} cy={nodes.solar.y - 10} r={100} fill="url(#solarAmbient)">
            <animate attributeName="r" values="90;110;90" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;1;0.8" dur="4s" repeatCount="indefinite" />
          </circle>
        )}

        {/* House illustration */}
        <HouseIllustration />

        {/* ── Connection paths ── */}
        {/* Solar → Home (top to center) */}
        <path
          id="p-solar-home"
          d={`M${nodes.solar.x},${nodes.solar.y + 25} L${nodes.home.x},${nodes.home.y - 30}`}
          fill="none"
          stroke={colors.solar}
          strokeWidth={solarToHome > 0 ? 1 : 0.3}
          strokeOpacity={solarToHome > 0 ? 0.25 : 0.06}
        />

        {/* Solar → Battery */}
        <path
          id="p-solar-bat"
          d={`M${nodes.solar.x - 30},${nodes.solar.y + 20} C${nodes.solar.x - 80},${nodes.solar.y + 80} ${nodes.battery.x + 20},${nodes.battery.y - 60} ${nodes.battery.x},${nodes.battery.y - 25}`}
          fill="none"
          stroke={colors.solar}
          strokeWidth={solarToBattery > 0 ? 1 : 0.3}
          strokeOpacity={solarToBattery > 0 ? 0.25 : 0.06}
        />

        {/* Battery → Home */}
        <path
          id="p-bat-home"
          d={`M${nodes.battery.x + 25},${nodes.battery.y - 15} C${nodes.battery.x + 60},${nodes.battery.y - 50} ${nodes.home.x - 60},${nodes.home.y + 10} ${nodes.home.x - 30},${nodes.home.y}`}
          fill="none"
          stroke={colors.battery}
          strokeWidth={batteryToHome > 0 ? 1 : 0.3}
          strokeOpacity={batteryToHome > 0 ? 0.25 : 0.06}
        />

        {/* Grid → Home */}
        <path
          id="p-grid-home"
          d={`M${nodes.grid.x - 25},${nodes.grid.y - 15} C${nodes.grid.x - 60},${nodes.grid.y - 50} ${nodes.home.x + 60},${nodes.home.y + 10} ${nodes.home.x + 30},${nodes.home.y}`}
          fill="none"
          stroke={colors.grid}
          strokeWidth={gridToHome > 0 ? 1 : 0.3}
          strokeOpacity={gridToHome > 0 ? 0.25 : 0.06}
        />

        {/* Solar → Grid */}
        <path
          id="p-solar-grid"
          d={`M${nodes.solar.x + 30},${nodes.solar.y + 20} C${nodes.solar.x + 80},${nodes.solar.y + 80} ${nodes.grid.x - 20},${nodes.grid.y - 60} ${nodes.grid.x},${nodes.grid.y - 25}`}
          fill="none"
          stroke={colors.grid}
          strokeWidth={solarToGrid > 0 ? 1 : 0.3}
          strokeOpacity={solarToGrid > 0 ? 0.25 : 0.06}
        />

        {/* Home/Solar → EV */}
        <path
          id="p-to-ev"
          d={`M${nodes.home.x},${nodes.home.y + 60} C${nodes.home.x},${nodes.home.y + 100} ${nodes.ev.x},${nodes.ev.y - 60} ${nodes.ev.x},${nodes.ev.y - 25}`}
          fill="none"
          stroke={colors.ev}
          strokeWidth={solarToEV > 0 ? 1 : 0.3}
          strokeOpacity={solarToEV > 0 ? 0.25 : 0.06}
        />

        {/* ── Animated dots ── */}
        <FlowingDots pathId="p-solar-home" color={colors.solar} power={solarToHome} dotCount={5} />
        <FlowingDots pathId="p-solar-bat" color={colors.solar} power={solarToBattery} dotCount={4} />
        <FlowingDots pathId="p-bat-home" color={colors.battery} power={batteryToHome} dotCount={5} />
        <FlowingDots pathId="p-grid-home" color={colors.grid} power={gridToHome} dotCount={4} />
        <FlowingDots pathId="p-solar-grid" color={colors.solar} power={solarToGrid} dotCount={4} />
        <FlowingDots pathId="p-to-ev" color={colors.ev} power={solarToEV} dotCount={4} />

        {/* ── Node Labels ── */}
        {/* SOLAR */}
        <g>
          <circle cx={nodes.solar.x} cy={nodes.solar.y} r={20} fill={colors.solar} fillOpacity={0.1} stroke={colors.solar} strokeWidth={1} strokeOpacity={0.4} />
          <foreignObject x={nodes.solar.x - 10} y={nodes.solar.y - 10} width={20} height={20}>
            <div className="flex items-center justify-center w-full h-full">
              <svg viewBox="0 0 24 24" fill="none" stroke={colors.solar} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            </div>
          </foreignObject>
          <text x={nodes.solar.x} y={nodes.solar.y - 30} textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="500" letterSpacing="1.5">SOLAR</text>
          <text x={nodes.solar.x} y={nodes.solar.y - 42} textAnchor="middle" fill="white" fontSize="18" fontWeight="700">
            {flow.solarPower.toFixed(1)} kW
          </text>
        </g>

        {/* HOME */}
        <g>
          <text x={nodes.home.x} y={nodes.home.y - 40} textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="500" letterSpacing="1.5">HOME</text>
          <text x={nodes.home.x} y={nodes.home.y - 52} textAnchor="middle" fill="white" fontSize="18" fontWeight="700">
            {flow.homePower.toFixed(1)} kW
          </text>
        </g>

        {/* POWERWALL */}
        <g>
          <circle cx={nodes.battery.x} cy={nodes.battery.y} r={20} fill={colors.battery} fillOpacity={0.1} stroke={colors.battery} strokeWidth={1} strokeOpacity={0.4} />
          <foreignObject x={nodes.battery.x - 10} y={nodes.battery.y - 10} width={20} height={20}>
            <div className="flex items-center justify-center w-full h-full">
              <svg viewBox="0 0 24 24" fill="none" stroke={colors.battery} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect x="1" y="6" width="18" height="12" rx="2" ry="2" />
                <line x1="23" y1="13" x2="23" y2="11" />
              </svg>
            </div>
          </foreignObject>
          <text x={nodes.battery.x} y={nodes.battery.y + 35} textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="500" letterSpacing="1.5">POWERWALL</text>
          <text x={nodes.battery.x} y={nodes.battery.y + 50} textAnchor="middle" fill="white" fontSize="15" fontWeight="700">
            {Math.abs(flow.batteryPower).toFixed(1)} kW
          </text>
          <text x={nodes.battery.x} y={nodes.battery.y + 63} textAnchor="middle" fill="#6b7280" fontSize="11">
            · {flow.batteryPercent}%
          </text>
          {/* Battery bar */}
          <rect x={nodes.battery.x - 18} y={nodes.battery.y + 68} width={36} height={5} rx={2.5} fill="#1a2030" />
          <rect x={nodes.battery.x - 18} y={nodes.battery.y + 68} width={36 * (flow.batteryPercent / 100)} height={5} rx={2.5} fill={colors.battery} fillOpacity={0.6} />
        </g>

        {/* GRID */}
        <g>
          <circle cx={nodes.grid.x} cy={nodes.grid.y} r={20} fill={colors.grid} fillOpacity={0.1} stroke={colors.grid} strokeWidth={1} strokeOpacity={0.4} />
          <foreignObject x={nodes.grid.x - 10} y={nodes.grid.y - 10} width={20} height={20}>
            <div className="flex items-center justify-center w-full h-full">
              <svg viewBox="0 0 24 24" fill="none" stroke={colors.grid} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
          </foreignObject>
          <text x={nodes.grid.x} y={nodes.grid.y + 35} textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="500" letterSpacing="1.5">GRID</text>
          <text x={nodes.grid.x} y={nodes.grid.y + 50} textAnchor="middle" fill="white" fontSize="15" fontWeight="700">
            {Math.abs(flow.gridPower).toFixed(1)} kW
          </text>
          {flow.gridPower !== 0 && (
            <text x={nodes.grid.x} y={nodes.grid.y + 63} textAnchor="middle" fill="#6b7280" fontSize="10">
              {flow.gridPower > 0 ? 'importing' : 'exporting'}
            </text>
          )}
        </g>

        {/* EV */}
        <g>
          <circle cx={nodes.ev.x} cy={nodes.ev.y} r={20} fill={colors.ev} fillOpacity={0.1} stroke={colors.ev} strokeWidth={1} strokeOpacity={0.4} />
          <foreignObject x={nodes.ev.x - 10} y={nodes.ev.y - 10} width={20} height={20}>
            <div className="flex items-center justify-center w-full h-full">
              <svg viewBox="0 0 24 24" fill="none" stroke={colors.ev} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2" />
                <circle cx="6.5" cy="16.5" r="2.5" />
                <circle cx="16.5" cy="16.5" r="2.5" />
              </svg>
            </div>
          </foreignObject>
          <text x={nodes.ev.x} y={nodes.ev.y + 35} textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="500" letterSpacing="1.5">EV</text>
          <text x={nodes.ev.x} y={nodes.ev.y + 50} textAnchor="middle" fill="white" fontSize="15" fontWeight="700">
            {flow.evPower.toFixed(1)} kW
          </text>
        </g>

        {/* Status indicator */}
        <g>
          <circle cx="20" cy="415" r={4} fill={flow.solarPower > 0 ? colors.solar : '#4b5563'}>
            {flow.solarPower > 0 && <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />}
          </circle>
          <text x="30" y="418" fill="#6b7280" fontSize="9">
            {flow.solarPower > 0 ? 'Producing' : 'Not producing'}
          </text>
        </g>
      </svg>
    </div>
  );
}
