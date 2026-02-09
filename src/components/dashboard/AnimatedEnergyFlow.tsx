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

// Upgraded stylized house SVG with more architectural detail
function HouseIllustration() {
  return (
    <g>
      {/* Foundation / ground shadow */}
      <ellipse cx="200" cy="282" rx="90" ry="4" fill="#0a0e18" opacity="0.6" />
      
      {/* House body - main structure with subtle gradient */}
      <rect x="145" y="195" width="110" height="85" rx="2" fill="url(#houseFill)" stroke="#2a3448" strokeWidth="0.8" />
      
      {/* Side wall accent - adds depth */}
      <rect x="145" y="195" width="4" height="85" fill="#151b2a" />
      <rect x="251" y="195" width="4" height="85" fill="#151b2a" />
      
      {/* Roof - steeper, more modern with overhang */}
      <polygon points="130,198 200,138 270,198" fill="#111827" stroke="#2a3448" strokeWidth="0.8" />
      {/* Roof ridge line */}
      <line x1="200" y1="138" x2="200" y2="142" stroke="#3a4560" strokeWidth="0.5" />
      {/* Roof overhang shadow */}
      <line x1="132" y1="198" x2="268" y2="198" stroke="#0a0e18" strokeWidth="1.5" opacity="0.5" />
      
      {/* Chimney */}
      <rect x="230" y="148" width="12" height="25" rx="1" fill="#141c2c" stroke="#2a3448" strokeWidth="0.5" />
      <rect x="228" y="146" width="16" height="4" rx="1" fill="#1a2438" stroke="#2a3448" strokeWidth="0.4" />
      
      {/* Solar panels on roof - larger, more realistic */}
      <g opacity="0.95">
        {/* Panel row 1 - upper */}
        <rect x="150" y="163" width="24" height="15" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.6" />
        <rect x="176" y="163" width="24" height="15" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.6" />
        <rect x="202" y="163" width="24" height="15" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.6" />
        {/* Panel cell grid lines */}
        <line x1="162" y1="163" x2="162" y2="178" stroke="#2d6090" strokeWidth="0.25" />
        <line x1="188" y1="163" x2="188" y2="178" stroke="#2d6090" strokeWidth="0.25" />
        <line x1="214" y1="163" x2="214" y2="178" stroke="#2d6090" strokeWidth="0.25" />
        <line x1="150" y1="170.5" x2="226" y2="170.5" stroke="#2d6090" strokeWidth="0.25" />
        {/* Panel row 2 - lower */}
        <rect x="157" y="179" width="22" height="13" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.6" />
        <rect x="181" y="179" width="22" height="13" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.6" />
        <rect x="205" y="179" width="18" height="13" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.6" />
        {/* Subtle solar shimmer */}
        <rect x="150" y="163" width="76" height="15" rx="1" fill="#3b82f6" opacity="0">
          <animate attributeName="opacity" values="0;0.06;0" dur="3s" repeatCount="indefinite" />
        </rect>
      </g>
      
      {/* Windows - modern style with warm interior glow */}
      <g>
        {/* Left window */}
        <rect x="157" y="212" width="22" height="26" rx="1.5" fill="#080c14" stroke="#2a3448" strokeWidth="0.6" />
        {/* Window frame cross */}
        <line x1="168" y1="212" x2="168" y2="238" stroke="#2a3448" strokeWidth="0.4" />
        <line x1="157" y1="225" x2="179" y2="225" stroke="#2a3448" strokeWidth="0.4" />
        {/* Warm interior glow */}
        <rect x="158" y="213" width="9.5" height="11.5" fill="#1a1800" opacity="0.6">
          <animate attributeName="fill" values="#1a1800;#221e00;#1a1800" dur="6s" repeatCount="indefinite" />
        </rect>
        <rect x="169" y="226" width="9.5" height="11.5" fill="#1a1800" opacity="0.4">
          <animate attributeName="fill" values="#1a1800;#1e1a00;#1a1800" dur="8s" repeatCount="indefinite" />
        </rect>
        
        {/* Right window */}
        <rect x="221" y="212" width="22" height="26" rx="1.5" fill="#080c14" stroke="#2a3448" strokeWidth="0.6" />
        <line x1="232" y1="212" x2="232" y2="238" stroke="#2a3448" strokeWidth="0.4" />
        <line x1="221" y1="225" x2="243" y2="225" stroke="#2a3448" strokeWidth="0.4" />
        <rect x="222" y="213" width="9.5" height="11.5" fill="#1a1800" opacity="0.5">
          <animate attributeName="fill" values="#1a1800;#201c00;#1a1800" dur="7s" repeatCount="indefinite" />
        </rect>
      </g>
      
      {/* Front door - modern with sidelight */}
      <rect x="189" y="243" width="22" height="37" rx="1.5" fill="#0c1018" stroke="#2a3448" strokeWidth="0.6" />
      {/* Door panel detail */}
      <rect x="192" y="247" width="16" height="12" rx="1" fill="#0f1520" stroke="#1e2840" strokeWidth="0.3" />
      <rect x="192" y="262" width="16" height="14" rx="1" fill="#0f1520" stroke="#1e2840" strokeWidth="0.3" />
      {/* Door handle */}
      <circle cx="207" cy="264" r="1.2" fill="#4a5568" />
      {/* Door light / welcome glow */}
      <ellipse cx="200" cy="241" rx="4" ry="2" fill="#F59E0B" opacity="0.08">
        <animate attributeName="opacity" values="0.06;0.12;0.06" dur="4s" repeatCount="indefinite" />
      </ellipse>
      
      {/* Porch step */}
      <rect x="185" y="278" width="30" height="3" rx="0.5" fill="#1a2030" stroke="#2a3448" strokeWidth="0.3" />
      
      {/* Powerwall unit (left side of house) */}
      <rect x="116" y="238" width="20" height="38" rx="2.5" fill="#141e30" stroke="#2a4060" strokeWidth="0.8" />
      {/* Powerwall LED indicators */}
      <rect x="119.5" y="242" width="13" height="3" rx="1" fill="#22c55e" opacity="0.25">
        <animate attributeName="opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite" />
      </rect>
      <rect x="119.5" y="247" width="13" height="3" rx="1" fill="#22c55e" opacity="0.15" />
      <rect x="119.5" y="252" width="13" height="3" rx="1" fill="#22c55e" opacity="0.1" />
      {/* Tesla T logo on Powerwall */}
      <text x="126" y="268" textAnchor="middle" fill="#4a6080" fontSize="5" fontWeight="700" letterSpacing="0.5">PW</text>
      {/* Powerwall mounting bracket */}
      <line x1="126" y1="236" x2="126" y2="238" stroke="#2a4060" strokeWidth="1" />
      
      {/* Landscaping - small bushes */}
      <ellipse cx="155" cy="278" rx="8" ry="4" fill="#0f2010" opacity="0.6" />
      <ellipse cx="245" cy="278" rx="8" ry="4" fill="#0f2010" opacity="0.6" />
      <ellipse cx="150" cy="279" rx="5" ry="3" fill="#0a1a0a" opacity="0.5" />
      <ellipse cx="250" cy="279" rx="5" ry="3" fill="#0a1a0a" opacity="0.5" />
      
      {/* Utility meter on right side of house */}
      <g>
        {/* Meter box */}
        <rect x="262" y="230" width="16" height="22" rx="2" fill="#141e30" stroke="#2a4060" strokeWidth="0.7" />
        {/* Meter glass/display */}
        <circle cx="270" cy="238" r="5" fill="#0a1018" stroke="#3a5070" strokeWidth="0.4" />
        {/* Meter dial */}
        <line x1="270" y1="238" x2="273" y2="236" stroke="#8B5CF6" strokeWidth="0.5" opacity="0.7">
          <animateTransform attributeName="transform" type="rotate" from="0 270 238" to="360 270 238" dur="8s" repeatCount="indefinite" />
        </line>
        {/* Meter center dot */}
        <circle cx="270" cy="238" r="0.8" fill="#8B5CF6" opacity="0.6" />
        {/* Meter label */}
        <text x="270" y="248" textAnchor="middle" fill="#4a6080" fontSize="3.5" fontWeight="600" letterSpacing="0.3">kWh</text>
        {/* Conduit line going down */}
        <line x1="270" y1="252" x2="270" y2="260" stroke="#2a4060" strokeWidth="0.8" />
      </g>
      
      {/* Ground line */}
      <line x1="90" y1="280" x2="310" y2="280" stroke="#1a2030" strokeWidth="0.8" />
    </g>
  );
}

export function AnimatedEnergyFlow({ data, className }: AnimatedEnergyFlowProps) {
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
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 80px 60px, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 140px 20px, rgba(255,255,255,0.15), transparent), radial-gradient(1px 1px at 280px 45px, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 320px 80px, rgba(255,255,255,0.15), transparent)',
          backgroundSize: '400px 100px',
        }} />
      </div>

      {/* Title header */}
      <div className="relative z-10 pt-4 pb-1 px-4 text-center">
        <h3 className="text-sm sm:text-base font-bold tracking-wide" style={{ color: '#F59E0B' }}>
          ⚡ Live Energy Flow
        </h3>
        <p className="text-[10px] sm:text-xs mt-0.5 tracking-wide" style={{ color: '#6b7280' }}>
          First of its kind — <span style={{ color: '#9ca3af', fontWeight: 500 }}>multi-manufacturer view</span>
        </p>
      </div>

      <svg
        viewBox="0 0 400 450"
        className="relative w-full h-full"
        style={{ maxHeight: '550px' }}
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

          {/* House body gradient */}
          <linearGradient id="houseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2235" />
            <stop offset="100%" stopColor="#141a28" />
          </linearGradient>
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

        {/* (Grid→Home path moved below, paired with Home→Grid for clarity) */}

        {/* Home (meter) → Grid — flows from utility meter on side of house */}
        <path
          id="p-solar-grid"
          d={`M278,241 C295,241 ${nodes.grid.x - 30},${nodes.grid.y - 20} ${nodes.grid.x},${nodes.grid.y - 20}`}
          fill="none"
          stroke={colors.grid}
          strokeWidth={solarToGrid > 0 ? 1 : 0.3}
          strokeOpacity={solarToGrid > 0 ? 0.25 : 0.06}
        />

        {/* Grid → Home (meter) — import flows into meter */}
        <path
          id="p-grid-home"
          d={`M${nodes.grid.x},${nodes.grid.y - 20} C${nodes.grid.x - 30},${nodes.grid.y - 20} 295,241 278,241`}
          fill="none"
          stroke={colors.grid}
          strokeWidth={gridToHome > 0 ? 1 : 0.3}
          strokeOpacity={gridToHome > 0 ? 0.25 : 0.06}
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

        {/* EV — Tesla Model X */}
        <g>
          <circle cx={nodes.ev.x} cy={nodes.ev.y} r={20} fill={colors.ev} fillOpacity={0.1} stroke={colors.ev} strokeWidth={1} strokeOpacity={0.4} />
          {/* Tesla Model X silhouette */}
          <foreignObject x={nodes.ev.x - 14} y={nodes.ev.y - 12} width={28} height={24}>
            <div className="flex items-center justify-center w-full h-full">
              <svg viewBox="0 0 40 24" fill="none" className="w-7 h-5">
                {/* Model X body */}
                <path
                  d="M4 16 C4 16 5 10 8 8 C11 6 14 5.5 20 5.5 C26 5.5 29 6 32 8 C35 10 36 16 36 16 L36 17 C36 18.1 35.1 19 34 19 L6 19 C4.9 19 4 18.1 4 17 Z"
                  fill="#1e293b"
                  stroke={colors.ev}
                  strokeWidth="0.8"
                />
                {/* Windshield */}
                <path
                  d="M11 14 C11 14 13 8.5 20 8.5 C27 8.5 29 14 29 14 Z"
                  fill="#0f172a"
                  stroke={colors.ev}
                  strokeWidth="0.4"
                  opacity="0.7"
                />
                {/* Falcon wing doors (signature Model X) */}
                <path
                  d="M10 11 C10 11 8 6 7 4 C6.5 3 7 2.5 7.5 3 C9 5 11 8 11 8"
                  fill="none"
                  stroke={colors.ev}
                  strokeWidth="0.7"
                  opacity="0.5"
                />
                <path
                  d="M30 11 C30 11 32 6 33 4 C33.5 3 33 2.5 32.5 3 C31 5 29 8 29 8"
                  fill="none"
                  stroke={colors.ev}
                  strokeWidth="0.7"
                  opacity="0.5"
                />
                {/* Headlights */}
                <ellipse cx="7" cy="14" rx="2" ry="1.2" fill={colors.ev} opacity="0.6">
                  {flow.evPower > 0 && <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />}
                </ellipse>
                <ellipse cx="33" cy="14" rx="2" ry="1.2" fill={colors.ev} opacity="0.6">
                  {flow.evPower > 0 && <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />}
                </ellipse>
                {/* Front wheels */}
                <circle cx="11" cy="18.5" r="2.5" fill="#0a0e18" stroke="#374151" strokeWidth="0.5" />
                <circle cx="29" cy="18.5" r="2.5" fill="#0a0e18" stroke="#374151" strokeWidth="0.5" />
                {/* Charge port glow (right rear) */}
                {flow.evPower > 0 && (
                  <circle cx="33" cy="11" r="1.5" fill={colors.ev}>
                    <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="r" values="1;2;1" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
              </svg>
            </div>
          </foreignObject>
          {/* Charging cable animation */}
          {flow.evPower > 0 && (
            <g opacity="0.6">
              <path
                d={`M${nodes.ev.x + 13},${nodes.ev.y - 1} Q${nodes.ev.x + 22},${nodes.ev.y - 8} ${nodes.ev.x + 18},${nodes.ev.y - 20}`}
                fill="none"
                stroke={colors.ev}
                strokeWidth="1.2"
                strokeDasharray="3 2"
              >
                <animate attributeName="stroke-dashoffset" values="0;-10" dur="1s" repeatCount="indefinite" />
              </path>
            </g>
          )}
          <text x={nodes.ev.x} y={nodes.ev.y + 35} textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="500" letterSpacing="1.5">MODEL X</text>
          <text x={nodes.ev.x} y={nodes.ev.y + 50} textAnchor="middle" fill="white" fontSize="15" fontWeight="700">
            {flow.evPower.toFixed(1)} kW
          </text>
          {flow.evPower > 0 && (
            <text x={nodes.ev.x} y={nodes.ev.y + 63} textAnchor="middle" fill={colors.ev} fontSize="9" fontWeight="500">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
              ⚡ CHARGING
            </text>
          )}
        </g>

        {/* Status + polished manufacturer footer */}
        <g>
          <circle cx="20" cy="430" r={3.5} fill={flow.solarPower > 0 ? colors.solar : '#4b5563'}>
            {flow.solarPower > 0 && <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />}
          </circle>
          <text x="28" y="433" fill="#6b7280" fontSize="8">
            {flow.solarPower > 0 ? 'Producing' : 'Not producing'}
          </text>

          {/* Manufacturer pills — bottom right */}
          {/* Separator line */}
          <line x1="230" y1="422" x2="390" y2="422" stroke="#1a2030" strokeWidth="0.5" />
          
          {/* Enphase */}
          <rect x="232" y="427" width={44} height={14} rx={7} fill="#F59E0B" fillOpacity={0.08} stroke="#F59E0B" strokeWidth={0.4} strokeOpacity={0.3} />
          <text x="254" y="436.5" textAnchor="middle" fill="#F59E0B" fontSize="6" fontWeight="600" letterSpacing="0.3" opacity="0.9">ENPHASE</text>
          
          {/* Tesla */}
          <rect x="280" y="427" width={34} height={14} rx={7} fill="#22C55E" fillOpacity={0.08} stroke="#22C55E" strokeWidth={0.4} strokeOpacity={0.3} />
          <text x="297" y="436.5" textAnchor="middle" fill="#22C55E" fontSize="6" fontWeight="600" letterSpacing="0.3" opacity="0.9">TESLA</text>
          
          {/* ChargePoint */}
          <rect x="318" y="427" width={62} height={14} rx={7} fill="#3B82F6" fillOpacity={0.08} stroke="#3B82F6" strokeWidth={0.4} strokeOpacity={0.3} />
          <text x="349" y="436.5" textAnchor="middle" fill="#3B82F6" fontSize="6" fontWeight="600" letterSpacing="0.3" opacity="0.9">CHARGEPOINT</text>
        </g>
      </svg>
    </div>
  );
}
