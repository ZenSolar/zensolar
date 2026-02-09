import { useState, useEffect } from 'react';
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

// Battery icon with animated fill bars
function BatteryIcon({ percent, color, cx, cy }: { percent: number; color: string; cx: number; cy: number }) {
  const bars = Math.max(0, Math.min(4, Math.ceil((percent / 100) * 4)));
  return (
    <g>
      {/* Battery outline */}
      <rect x={cx - 9} y={cy - 6} width={18} height={12} rx={2} fill="none" stroke={color} strokeWidth={1.5} />
      {/* Battery terminal */}
      <rect x={cx + 9} y={cy - 2.5} width={2.5} height={5} rx={1} fill={color} opacity={0.6} />
      {/* Fill bars */}
      {Array.from({ length: bars }).map((_, i) => (
        <rect
          key={i}
          x={cx - 7 + i * 4}
          y={cy - 3.5}
          width={3}
          height={7}
          rx={0.5}
          fill={color}
          opacity={0.4 + i * 0.15}
        >
          {i === bars - 1 && (
            <animate attributeName="opacity" values={`${0.3 + i * 0.15};${0.6 + i * 0.1};${0.3 + i * 0.15}`} dur="2s" repeatCount="indefinite" />
          )}
        </rect>
      ))}
    </g>
  );
}

// House illustration with bigger roof and clipped solar panels
function HouseIllustration({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <g>
        <ellipse cx="200" cy="242" rx="60" ry="3" fill="#0a0e18" opacity="0.5" />
        {/* House body */}
        <rect x="162" y="185" width="76" height="55" rx="2" fill="url(#houseFill)" stroke="#2a3448" strokeWidth="0.6" />
        <rect x="162" y="185" width="3" height="55" fill="#151b2a" />
        <rect x="235" y="185" width="3" height="55" fill="#151b2a" />
        {/* Roof — wider for panels */}
        <polygon points="148,188 200,135 252,188" fill="#111827" stroke="#2a3448" strokeWidth="0.6" />
        <line x1="150" y1="188" x2="250" y2="188" stroke="#0a0e18" strokeWidth="1" opacity="0.5" />
        {/* Solar panels clipped to roof */}
        <clipPath id="roofClipC">
          <polygon points="152,187 200,138 248,187" />
        </clipPath>
        <g clipPath="url(#roofClipC)" opacity="0.95">
          <rect x="165" y="155" width="18" height="12" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.5" />
          <rect x="185" y="155" width="18" height="12" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.5" />
          <rect x="170" y="169" width="16" height="10" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.5" />
          <rect x="188" y="169" width="16" height="10" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.5" />
          <rect x="165" y="155" width="38" height="12" fill="#3b82f6" opacity="0">
            <animate attributeName="opacity" values="0;0.06;0" dur="3s" repeatCount="indefinite" />
          </rect>
        </g>
        {/* Windows */}
        <rect x="172" y="198" width="15" height="18" rx="1" fill="#080c14" stroke="#2a3448" strokeWidth="0.4" />
        <rect x="213" y="198" width="15" height="18" rx="1" fill="#080c14" stroke="#2a3448" strokeWidth="0.4" />
        <rect x="173" y="199" width="6.5" height="8" fill="#1a1800" opacity="0.5">
          <animate attributeName="fill" values="#1a1800;#221e00;#1a1800" dur="6s" repeatCount="indefinite" />
        </rect>
        {/* Door */}
        <rect x="193" y="216" width="14" height="24" rx="1" fill="#0c1018" stroke="#2a3448" strokeWidth="0.4" />
        <circle cx="204" cy="229" r="0.8" fill="#4a5568" />
        {/* Powerwall */}
        <rect x="140" y="210" width="14" height="26" rx="2" fill="#141e30" stroke="#2a4060" strokeWidth="0.6" />
        <rect x="142.5" y="213" width="9" height="2.5" rx="0.8" fill="#22c55e" opacity="0.25">
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite" />
        </rect>
        <rect x="142.5" y="217" width="9" height="2.5" rx="0.8" fill="#22c55e" opacity="0.15" />
        <text x="147" y="230" textAnchor="middle" fill="#4a6080" fontSize="4" fontWeight="700">PW</text>
        {/* Utility meter */}
        <rect x="244" y="206" width="12" height="16" rx="1.5" fill="#141e30" stroke="#2a4060" strokeWidth="0.5" />
        <circle cx="250" cy="212" r="3.5" fill="#0a1018" stroke="#3a5070" strokeWidth="0.3" />
        <line x1="250" y1="212" x2="252" y2="210.5" stroke="#8B5CF6" strokeWidth="0.4" opacity="0.7">
          <animateTransform attributeName="transform" type="rotate" from="0 250 212" to="360 250 212" dur="8s" repeatCount="indefinite" />
        </line>
        <circle cx="250" cy="212" r="0.6" fill="#8B5CF6" opacity="0.6" />
        <text x="250" y="219" textAnchor="middle" fill="#4a6080" fontSize="2.8" fontWeight="600">kWh</text>
        {/* Ground */}
        <line x1="120" y1="240" x2="280" y2="240" stroke="#1a2030" strokeWidth="0.6" />
      </g>
    );
  }

  return (
    <g>
      <ellipse cx="200" cy="282" rx="90" ry="4" fill="#0a0e18" opacity="0.6" />
      {/* House body */}
      <rect x="145" y="200" width="110" height="80" rx="2" fill="url(#houseFill)" stroke="#2a3448" strokeWidth="0.8" />
      <rect x="145" y="200" width="4" height="80" fill="#151b2a" />
      <rect x="251" y="200" width="4" height="80" fill="#151b2a" />
      {/* Roof — taller and wider so panels fit */}
      <polygon points="125,203 200,128 275,203" fill="#111827" stroke="#2a3448" strokeWidth="0.8" />
      <line x1="200" y1="128" x2="200" y2="132" stroke="#3a4560" strokeWidth="0.5" />
      <line x1="127" y1="203" x2="273" y2="203" stroke="#0a0e18" strokeWidth="1.5" opacity="0.5" />
      {/* Chimney */}
      <rect x="240" y="145" width="12" height="30" rx="1" fill="#141c2c" stroke="#2a3448" strokeWidth="0.5" />
      <rect x="238" y="143" width="16" height="4" rx="1" fill="#1a2438" stroke="#2a3448" strokeWidth="0.4" />
      {/* Solar panels — clipped to roof surface */}
      <clipPath id="roofClip">
        <polygon points="132,201 200,132 235,165 235,201" />
      </clipPath>
      <g clipPath="url(#roofClip)" opacity="0.95">
        {/* Row 1 */}
        <rect x="145" y="155" width="28" height="18" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.6" />
        <rect x="175" y="155" width="28" height="18" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.6" />
        <rect x="205" y="155" width="26" height="18" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.6" />
        {/* Grid lines row 1 */}
        <line x1="159" y1="155" x2="159" y2="173" stroke="#2d6090" strokeWidth="0.25" />
        <line x1="189" y1="155" x2="189" y2="173" stroke="#2d6090" strokeWidth="0.25" />
        <line x1="218" y1="155" x2="218" y2="173" stroke="#2d6090" strokeWidth="0.25" />
        <line x1="145" y1="164" x2="231" y2="164" stroke="#2d6090" strokeWidth="0.25" />
        {/* Row 2 */}
        <rect x="152" y="175" width="26" height="16" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.6" />
        <rect x="180" y="175" width="26" height="16" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.6" />
        <rect x="208" y="175" width="24" height="16" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.6" />
        {/* Grid lines row 2 */}
        <line x1="165" y1="175" x2="165" y2="191" stroke="#2d6090" strokeWidth="0.25" />
        <line x1="193" y1="175" x2="193" y2="191" stroke="#2d6090" strokeWidth="0.25" />
        <line x1="220" y1="175" x2="220" y2="191" stroke="#2d6090" strokeWidth="0.25" />
        <line x1="152" y1="183" x2="232" y2="183" stroke="#2d6090" strokeWidth="0.25" />
        {/* Shimmer */}
        <rect x="145" y="155" width="86" height="18" fill="#3b82f6" opacity="0">
          <animate attributeName="opacity" values="0;0.07;0" dur="3s" repeatCount="indefinite" />
        </rect>
      </g>
      {/* Windows */}
      <g>
        <rect x="157" y="217" width="22" height="26" rx="1.5" fill="#080c14" stroke="#2a3448" strokeWidth="0.6" />
        <line x1="168" y1="217" x2="168" y2="243" stroke="#2a3448" strokeWidth="0.4" />
        <line x1="157" y1="230" x2="179" y2="230" stroke="#2a3448" strokeWidth="0.4" />
        <rect x="158" y="218" width="9.5" height="11.5" fill="#1a1800" opacity="0.6">
          <animate attributeName="fill" values="#1a1800;#221e00;#1a1800" dur="6s" repeatCount="indefinite" />
        </rect>
        <rect x="169" y="231" width="9.5" height="11.5" fill="#1a1800" opacity="0.4">
          <animate attributeName="fill" values="#1a1800;#1e1a00;#1a1800" dur="8s" repeatCount="indefinite" />
        </rect>
        <rect x="221" y="217" width="22" height="26" rx="1.5" fill="#080c14" stroke="#2a3448" strokeWidth="0.6" />
        <line x1="232" y1="217" x2="232" y2="243" stroke="#2a3448" strokeWidth="0.4" />
        <line x1="221" y1="230" x2="243" y2="230" stroke="#2a3448" strokeWidth="0.4" />
        <rect x="222" y="218" width="9.5" height="11.5" fill="#1a1800" opacity="0.5">
          <animate attributeName="fill" values="#1a1800;#201c00;#1a1800" dur="7s" repeatCount="indefinite" />
        </rect>
      </g>
      {/* Door */}
      <rect x="189" y="248" width="22" height="32" rx="1.5" fill="#0c1018" stroke="#2a3448" strokeWidth="0.6" />
      <rect x="192" y="252" width="16" height="10" rx="1" fill="#0f1520" stroke="#1e2840" strokeWidth="0.3" />
      <rect x="192" y="265" width="16" height="12" rx="1" fill="#0f1520" stroke="#1e2840" strokeWidth="0.3" />
      <circle cx="207" cy="268" r="1.2" fill="#4a5568" />
      <ellipse cx="200" cy="246" rx="4" ry="2" fill="#F59E0B" opacity="0.08">
        <animate attributeName="opacity" values="0.06;0.12;0.06" dur="4s" repeatCount="indefinite" />
      </ellipse>
      {/* Porch step */}
      <rect x="185" y="278" width="30" height="3" rx="0.5" fill="#1a2030" stroke="#2a3448" strokeWidth="0.3" />
      {/* Powerwall unit (left side) */}
      <rect x="116" y="243" width="20" height="35" rx="2.5" fill="#141e30" stroke="#2a4060" strokeWidth="0.8" />
      <rect x="119.5" y="247" width="13" height="3" rx="1" fill="#22c55e" opacity="0.25">
        <animate attributeName="opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite" />
      </rect>
      <rect x="119.5" y="252" width="13" height="3" rx="1" fill="#22c55e" opacity="0.15" />
      <rect x="119.5" y="257" width="13" height="3" rx="1" fill="#22c55e" opacity="0.1" />
      <text x="126" y="270" textAnchor="middle" fill="#4a6080" fontSize="5" fontWeight="700" letterSpacing="0.5">PW</text>
      <line x1="126" y1="241" x2="126" y2="243" stroke="#2a4060" strokeWidth="1" />
      {/* Utility meter (right side) */}
      <g>
        <rect x="262" y="235" width="16" height="22" rx="2" fill="#141e30" stroke="#2a4060" strokeWidth="0.7" />
        <circle cx="270" cy="243" r="5" fill="#0a1018" stroke="#3a5070" strokeWidth="0.4" />
        <line x1="270" y1="243" x2="273" y2="241" stroke="#8B5CF6" strokeWidth="0.5" opacity="0.7">
          <animateTransform attributeName="transform" type="rotate" from="0 270 243" to="360 270 243" dur="8s" repeatCount="indefinite" />
        </line>
        <circle cx="270" cy="243" r="0.8" fill="#8B5CF6" opacity="0.6" />
        <text x="270" y="253" textAnchor="middle" fill="#4a6080" fontSize="3.5" fontWeight="600" letterSpacing="0.3">kWh</text>
        <line x1="270" y1="257" x2="270" y2="264" stroke="#2a4060" strokeWidth="0.8" />
      </g>
      {/* Landscaping */}
      <ellipse cx="155" cy="278" rx="8" ry="4" fill="#0f2010" opacity="0.6" />
      <ellipse cx="245" cy="278" rx="8" ry="4" fill="#0f2010" opacity="0.6" />
      <ellipse cx="150" cy="279" rx="5" ry="3" fill="#0a1a0a" opacity="0.5" />
      <ellipse cx="250" cy="279" rx="5" ry="3" fill="#0a1a0a" opacity="0.5" />
      {/* Ground line */}
      <line x1="90" y1="280" x2="310" y2="280" stroke="#1a2030" strokeWidth="0.8" />
    </g>
  );
}

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

  // Responsive node positions
  const nodes = compact
    ? {
        solar: { x: 200, y: 70 },
        home: { x: 200, y: 195 },
        battery: { x: 60, y: 225 },
        grid: { x: 340, y: 225 },
        ev: { x: 200, y: 320 },
      }
    : {
        solar: { x: 200, y: 80 },
        home: { x: 200, y: 225 },
        battery: { x: 55, y: 260 },
        grid: { x: 345, y: 260 },
        ev: { x: 200, y: 370 },
      };

  // Meter position (right side of house)
  const meter = compact ? { x: 250, y: 212 } : { x: 270, y: 243 };

  const vb = compact ? '0 0 400 390' : '0 0 400 460';
  const maxH = compact ? '400px' : '560px';
  const labelFs = compact ? 8 : 10;
  const valueFs = compact ? 13 : 18;
  const subValueFs = compact ? 10 : 15;

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

      <svg viewBox={vb} className="relative w-full h-full" style={{ maxHeight: maxH }}>
        <defs>
          <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <radialGradient id="solarAmbient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.solar} stopOpacity={0.12} />
            <stop offset="60%" stopColor={colors.solar} stopOpacity={0.04} />
            <stop offset="100%" stopColor={colors.solar} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="houseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2235" />
            <stop offset="100%" stopColor="#141a28" />
          </linearGradient>
        </defs>

        {/* Solar ambient glow */}
        {flow.solarPower > 0 && (
          <circle cx={nodes.solar.x} cy={nodes.solar.y - 10} r={compact ? 70 : 100} fill="url(#solarAmbient)">
            <animate attributeName="r" values={compact ? '60;80;60' : '90;110;90'} dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;1;0.8" dur="4s" repeatCount="indefinite" />
          </circle>
        )}

        {/* House illustration */}
        <HouseIllustration compact={compact} />

        {/* ── Connection paths ── */}
        {/* Solar → Home */}
        <path
          id="p-solar-home"
          d={`M${nodes.solar.x},${nodes.solar.y + 22} L${nodes.home.x},${nodes.home.y - 30}`}
          fill="none" stroke={colors.solar}
          strokeWidth={solarToHome > 0 ? 1 : 0.3} strokeOpacity={solarToHome > 0 ? 0.25 : 0.06}
        />
        {/* Solar → Battery */}
        <path
          id="p-solar-bat"
          d={`M${nodes.solar.x - 30},${nodes.solar.y + 18} C${nodes.solar.x - 80},${nodes.solar.y + 70} ${nodes.battery.x + 20},${nodes.battery.y - 50} ${nodes.battery.x},${nodes.battery.y - 25}`}
          fill="none" stroke={colors.solar}
          strokeWidth={solarToBattery > 0 ? 1 : 0.3} strokeOpacity={solarToBattery > 0 ? 0.25 : 0.06}
        />
        {/* Battery → Home */}
        <path
          id="p-bat-home"
          d={`M${nodes.battery.x + 25},${nodes.battery.y - 15} C${nodes.battery.x + 60},${nodes.battery.y - 50} ${nodes.home.x - 60},${nodes.home.y + 10} ${nodes.home.x - 30},${nodes.home.y}`}
          fill="none" stroke={colors.battery}
          strokeWidth={batteryToHome > 0 ? 1 : 0.3} strokeOpacity={batteryToHome > 0 ? 0.25 : 0.06}
        />
        {/* Home (meter) → Grid — export */}
        <path
          id="p-solar-grid"
          d={`M${meter.x + 8},${meter.y} C${meter.x + 30},${meter.y} ${nodes.grid.x - 30},${nodes.grid.y - 15} ${nodes.grid.x},${nodes.grid.y - 20}`}
          fill="none" stroke={colors.grid}
          strokeWidth={solarToGrid > 0 ? 1 : 0.3} strokeOpacity={solarToGrid > 0 ? 0.25 : 0.06}
        />
        {/* Grid → Home (meter) — import */}
        <path
          id="p-grid-home"
          d={`M${nodes.grid.x},${nodes.grid.y - 20} C${nodes.grid.x - 30},${nodes.grid.y - 15} ${meter.x + 30},${meter.y} ${meter.x + 8},${meter.y}`}
          fill="none" stroke={colors.grid}
          strokeWidth={gridToHome > 0 ? 1 : 0.3} strokeOpacity={gridToHome > 0 ? 0.25 : 0.06}
        />
        {/* Home → EV */}
        <path
          id="p-to-ev"
          d={`M${nodes.home.x},${nodes.home.y + (compact ? 45 : 55)} C${nodes.home.x},${nodes.home.y + (compact ? 80 : 95)} ${nodes.ev.x},${nodes.ev.y - 55} ${nodes.ev.x},${nodes.ev.y - 25}`}
          fill="none" stroke={colors.ev}
          strokeWidth={solarToEV > 0 ? 1 : 0.3} strokeOpacity={solarToEV > 0 ? 0.25 : 0.06}
        />

        {/* ── Animated dots ── */}
        <FlowingDots pathId="p-solar-home" color={colors.solar} power={solarToHome} dotCount={5} />
        <FlowingDots pathId="p-solar-bat" color={colors.solar} power={solarToBattery} dotCount={4} />
        <FlowingDots pathId="p-bat-home" color={colors.battery} power={batteryToHome} dotCount={5} />
        <FlowingDots pathId="p-grid-home" color={colors.grid} power={gridToHome} dotCount={4} />
        <FlowingDots pathId="p-solar-grid" color={colors.grid} power={solarToGrid} dotCount={4} />
        <FlowingDots pathId="p-to-ev" color={colors.ev} power={solarToEV} dotCount={4} />

        {/* ── SOLAR ── */}
        <g>
          <circle cx={nodes.solar.x} cy={nodes.solar.y} r={compact ? 16 : 20} fill={colors.solar} fillOpacity={0.1} stroke={colors.solar} strokeWidth={1} strokeOpacity={0.4} />
          <foreignObject x={nodes.solar.x - 10} y={nodes.solar.y - 10} width={20} height={20}>
            <div className="flex items-center justify-center w-full h-full">
              <svg viewBox="0 0 24 24" fill="none" stroke={colors.solar} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            </div>
          </foreignObject>
          <text x={nodes.solar.x} y={nodes.solar.y - (compact ? 22 : 30)} textAnchor="middle" fill="#9ca3af" fontSize={labelFs} fontWeight="500" letterSpacing="1.5">SOLAR</text>
          <text x={nodes.solar.x} y={nodes.solar.y - (compact ? 33 : 42)} textAnchor="middle" fill="white" fontSize={valueFs} fontWeight="700">
            {flow.solarPower.toFixed(1)} kW
          </text>
        </g>

        {/* ── HOME ── */}
        <g>
          <text x={nodes.home.x} y={nodes.home.y - (compact ? 32 : 40)} textAnchor="middle" fill="#9ca3af" fontSize={labelFs} fontWeight="500" letterSpacing="1.5">HOME</text>
          <text x={nodes.home.x} y={nodes.home.y - (compact ? 42 : 52)} textAnchor="middle" fill="white" fontSize={valueFs} fontWeight="700">
            {flow.homePower.toFixed(1)} kW
          </text>
        </g>

        {/* ── POWERWALL ── */}
        <g>
          <circle cx={nodes.battery.x} cy={nodes.battery.y} r={compact ? 16 : 20} fill={colors.battery} fillOpacity={0.1} stroke={colors.battery} strokeWidth={1} strokeOpacity={0.4} />
          {/* Battery icon with fill bars */}
          <BatteryIcon percent={flow.batteryPercent} color={colors.battery} cx={nodes.battery.x} cy={nodes.battery.y} />
          <text x={nodes.battery.x} y={nodes.battery.y + (compact ? 26 : 35)} textAnchor="middle" fill="#9ca3af" fontSize={labelFs} fontWeight="500" letterSpacing="1.5">POWERWALL</text>
          <text x={nodes.battery.x} y={nodes.battery.y + (compact ? 38 : 50)} textAnchor="middle" fill="white" fontSize={subValueFs} fontWeight="700">
            {Math.abs(flow.batteryPower).toFixed(1)} kW
          </text>
          <text x={nodes.battery.x} y={nodes.battery.y + (compact ? 48 : 63)} textAnchor="middle" fill="#6b7280" fontSize={compact ? 9 : 11}>
            · {flow.batteryPercent}%
          </text>
          {/* Battery bar */}
          <rect x={nodes.battery.x - 18} y={nodes.battery.y + (compact ? 52 : 68)} width={36} height={5} rx={2.5} fill="#1a2030" />
          <rect x={nodes.battery.x - 18} y={nodes.battery.y + (compact ? 52 : 68)} width={36 * (flow.batteryPercent / 100)} height={5} rx={2.5} fill={colors.battery} fillOpacity={0.6} />
        </g>

        {/* ── GRID ── */}
        <g>
          <circle cx={nodes.grid.x} cy={nodes.grid.y} r={compact ? 16 : 20} fill={colors.grid} fillOpacity={0.1} stroke={colors.grid} strokeWidth={1} strokeOpacity={0.4} />
          <foreignObject x={nodes.grid.x - 10} y={nodes.grid.y - 10} width={20} height={20}>
            <div className="flex items-center justify-center w-full h-full">
              <svg viewBox="0 0 24 24" fill="none" stroke={colors.grid} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
          </foreignObject>
          <text x={nodes.grid.x} y={nodes.grid.y + (compact ? 26 : 35)} textAnchor="middle" fill="#9ca3af" fontSize={labelFs} fontWeight="500" letterSpacing="1.5">GRID</text>
          <text x={nodes.grid.x} y={nodes.grid.y + (compact ? 38 : 50)} textAnchor="middle" fill="white" fontSize={subValueFs} fontWeight="700">
            {Math.abs(flow.gridPower).toFixed(1)} kW
          </text>
          {flow.gridPower !== 0 && (
            <text x={nodes.grid.x} y={nodes.grid.y + (compact ? 48 : 63)} textAnchor="middle" fill="#6b7280" fontSize={compact ? 8 : 10}>
              {flow.gridPower > 0 ? 'importing' : 'exporting'}
            </text>
          )}
        </g>

        {/* ── EV — MODEL X ── */}
        <g>
          <circle cx={nodes.ev.x} cy={nodes.ev.y} r={compact ? 16 : 20} fill={colors.ev} fillOpacity={0.1} stroke={colors.ev} strokeWidth={1} strokeOpacity={0.4} />
          <foreignObject x={nodes.ev.x - 14} y={nodes.ev.y - 12} width={28} height={24}>
            <div className="flex items-center justify-center w-full h-full">
              <svg viewBox="0 0 40 24" fill="none" className="w-7 h-5">
                <path d="M4 16 C4 16 5 10 8 8 C11 6 14 5.5 20 5.5 C26 5.5 29 6 32 8 C35 10 36 16 36 16 L36 17 C36 18.1 35.1 19 34 19 L6 19 C4.9 19 4 18.1 4 17 Z" fill="#1e293b" stroke={colors.ev} strokeWidth="0.8" />
                <path d="M11 14 C11 14 13 8.5 20 8.5 C27 8.5 29 14 29 14 Z" fill="#0f172a" stroke={colors.ev} strokeWidth="0.4" opacity="0.7" />
                <path d="M10 11 C10 11 8 6 7 4 C6.5 3 7 2.5 7.5 3 C9 5 11 8 11 8" fill="none" stroke={colors.ev} strokeWidth="0.7" opacity="0.5" />
                <path d="M30 11 C30 11 32 6 33 4 C33.5 3 33 2.5 32.5 3 C31 5 29 8 29 8" fill="none" stroke={colors.ev} strokeWidth="0.7" opacity="0.5" />
                <ellipse cx="7" cy="14" rx="2" ry="1.2" fill={colors.ev} opacity="0.6">
                  {flow.evPower > 0 && <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />}
                </ellipse>
                <ellipse cx="33" cy="14" rx="2" ry="1.2" fill={colors.ev} opacity="0.6">
                  {flow.evPower > 0 && <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />}
                </ellipse>
                <circle cx="11" cy="18.5" r="2.5" fill="#0a0e18" stroke="#374151" strokeWidth="0.5" />
                <circle cx="29" cy="18.5" r="2.5" fill="#0a0e18" stroke="#374151" strokeWidth="0.5" />
                {flow.evPower > 0 && (
                  <circle cx="33" cy="11" r="1.5" fill={colors.ev}>
                    <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="r" values="1;2;1" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
              </svg>
            </div>
          </foreignObject>
          {flow.evPower > 0 && (
            <g opacity="0.6">
              <path
                d={`M${nodes.ev.x + 13},${nodes.ev.y - 1} Q${nodes.ev.x + 22},${nodes.ev.y - 8} ${nodes.ev.x + 18},${nodes.ev.y - 20}`}
                fill="none" stroke={colors.ev} strokeWidth="1.2" strokeDasharray="3 2"
              >
                <animate attributeName="stroke-dashoffset" values="0;-10" dur="1s" repeatCount="indefinite" />
              </path>
            </g>
          )}
          <text x={nodes.ev.x} y={nodes.ev.y + (compact ? 26 : 35)} textAnchor="middle" fill="#9ca3af" fontSize={labelFs} fontWeight="500" letterSpacing="1.5">MODEL X</text>
          <text x={nodes.ev.x} y={nodes.ev.y + (compact ? 38 : 50)} textAnchor="middle" fill="white" fontSize={subValueFs} fontWeight="700">
            {flow.evPower.toFixed(1)} kW
          </text>
          {flow.evPower > 0 && (
            <text x={nodes.ev.x} y={nodes.ev.y + (compact ? 48 : 63)} textAnchor="middle" fill={colors.ev} fontSize={compact ? 7 : 9} fontWeight="500">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
              ⚡ CHARGING
            </text>
          )}
        </g>

        {/* ── Footer: status + stacked manufacturer pills ── */}
        <g>
          {/* Status indicator — bottom left */}
          <circle cx="20" cy={compact ? 355 : 430} r={3.5} fill={flow.solarPower > 0 ? colors.solar : '#4b5563'}>
            {flow.solarPower > 0 && <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />}
          </circle>
          <text x="28" y={compact ? 358 : 433} fill="#6b7280" fontSize={compact ? 7 : 8}>
            {flow.solarPower > 0 ? 'Producing' : 'Not producing'}
          </text>

          {/* Stacked manufacturer pills — bottom right */}
          {(() => {
            const bx = compact ? 340 : 355;
            const by = compact ? 340 : 415;
            const gap = compact ? 13 : 15;
            const pillW = compact ? 50 : 58;
            const pillH = compact ? 11 : 13;
            const fs = compact ? 5.5 : 6.5;
            const manufacturers = [
              { label: 'ENPHASE', color: '#F59E0B' },
              { label: 'TESLA', color: '#22C55E' },
              { label: 'CHARGEPOINT', color: '#3B82F6' },
            ];
            return manufacturers.map((m, i) => (
              <g key={m.label}>
                <rect
                  x={bx - pillW / 2} y={by + i * gap}
                  width={pillW} height={pillH} rx={pillH / 2}
                  fill={m.color} fillOpacity={0.08}
                  stroke={m.color} strokeWidth={0.4} strokeOpacity={0.3}
                />
                <text
                  x={bx} y={by + i * gap + pillH / 2 + (compact ? 1.8 : 2.2)}
                  textAnchor="middle" fill={m.color}
                  fontSize={fs} fontWeight="600" letterSpacing="0.3" opacity="0.9"
                >
                  {m.label}
                </text>
              </g>
            ));
          })()}
        </g>
      </svg>
    </div>
  );
}
