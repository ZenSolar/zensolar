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
      <rect x={cx - 9} y={cy - 6} width={18} height={12} rx={2} fill="none" stroke={color} strokeWidth={1.5} />
      <rect x={cx + 9} y={cy - 2.5} width={2.5} height={5} rx={1} fill={color} opacity={0.6} />
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

// House illustration — enlarged
function HouseIllustration({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <g>
        <ellipse cx="200" cy="255" rx="70" ry="3" fill="#0a0e18" opacity="0.5" />
        {/* House body */}
        <rect x="150" y="180" width="100" height="73" rx="2" fill="url(#houseFill)" stroke="#2a3448" strokeWidth="0.6" />
        <rect x="150" y="180" width="3" height="73" fill="#151b2a" />
        <rect x="247" y="180" width="3" height="73" fill="#151b2a" />
        {/* Roof */}
        <polygon points="132,183 200,118 268,183" fill="#111827" stroke="#2a3448" strokeWidth="0.6" />
        <line x1="134" y1="183" x2="266" y2="183" stroke="#0a0e18" strokeWidth="1" opacity="0.5" />
        {/* Solar panels clipped to roof */}
        <clipPath id="roofClipC">
          <polygon points="136,182 200,121 264,182" />
        </clipPath>
        <g clipPath="url(#roofClipC)" opacity="0.95">
          <rect x="155" y="143" width="22" height="14" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.5" />
          <rect x="179" y="143" width="22" height="14" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.5" />
          <rect x="203" y="143" width="22" height="14" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.5" />
          <rect x="160" y="159" width="20" height="12" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.5" />
          <rect x="182" y="159" width="20" height="12" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.5" />
          <rect x="204" y="159" width="20" height="12" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.5" />
          <rect x="155" y="143" width="70" height="14" fill="#3b82f6" opacity="0">
            <animate attributeName="opacity" values="0;0.06;0" dur="3s" repeatCount="indefinite" />
          </rect>
        </g>
        {/* Windows */}
        <rect x="162" y="195" width="18" height="22" rx="1" fill="#080c14" stroke="#2a3448" strokeWidth="0.4" />
        <rect x="220" y="195" width="18" height="22" rx="1" fill="#080c14" stroke="#2a3448" strokeWidth="0.4" />
        <rect x="163" y="196" width="8" height="10" fill="#1a1800" opacity="0.5">
          <animate attributeName="fill" values="#1a1800;#221e00;#1a1800" dur="6s" repeatCount="indefinite" />
        </rect>
        {/* Door */}
        <rect x="190" y="222" width="18" height="30" rx="1" fill="#0c1018" stroke="#2a3448" strokeWidth="0.4" />
        <circle cx="205" cy="238" r="0.8" fill="#4a5568" />
        {/* Powerwall */}
        <rect x="127" y="212" width="16" height="30" rx="2" fill="#141e30" stroke="#2a4060" strokeWidth="0.6" />
        <rect x="129.5" y="215" width="11" height="2.5" rx="0.8" fill="#22c55e" opacity="0.25">
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite" />
        </rect>
        <rect x="129.5" y="219" width="11" height="2.5" rx="0.8" fill="#22c55e" opacity="0.15" />
        <text x="135" y="234" textAnchor="middle" fill="#4a6080" fontSize="4" fontWeight="700">PW</text>
        {/* Utility meter */}
        <rect x="256" y="210" width="14" height="18" rx="1.5" fill="#141e30" stroke="#2a4060" strokeWidth="0.5" />
        <circle cx="263" cy="217" r="4" fill="#0a1018" stroke="#3a5070" strokeWidth="0.3" />
        <line x1="263" y1="217" x2="265.5" y2="215.5" stroke="#8B5CF6" strokeWidth="0.4" opacity="0.7">
          <animateTransform attributeName="transform" type="rotate" from="0 263 217" to="360 263 217" dur="8s" repeatCount="indefinite" />
        </line>
        <circle cx="263" cy="217" r="0.6" fill="#8B5CF6" opacity="0.6" />
        <text x="263" y="225" textAnchor="middle" fill="#4a6080" fontSize="3" fontWeight="600">kWh</text>
        {/* Ground */}
        <line x1="110" y1="253" x2="290" y2="253" stroke="#1a2030" strokeWidth="0.6" />
      </g>
    );
  }

  return (
    <g>
      <ellipse cx="200" cy="298" rx="100" ry="5" fill="#0a0e18" opacity="0.6" />
      {/* House body — bigger */}
      <rect x="130" y="192" width="140" height="103" rx="2" fill="url(#houseFill)" stroke="#2a3448" strokeWidth="0.8" />
      <rect x="130" y="192" width="4" height="103" fill="#151b2a" />
      <rect x="266" y="192" width="4" height="103" fill="#151b2a" />
      {/* Roof */}
      <polygon points="110,195 200,110 290,195" fill="#111827" stroke="#2a3448" strokeWidth="0.8" />
      <line x1="200" y1="110" x2="200" y2="114" stroke="#3a4560" strokeWidth="0.5" />
      <line x1="112" y1="195" x2="288" y2="195" stroke="#0a0e18" strokeWidth="1.5" opacity="0.5" />
      {/* Chimney */}
      <rect x="252" y="132" width="14" height="35" rx="1" fill="#141c2c" stroke="#2a3448" strokeWidth="0.5" />
      <rect x="250" y="130" width="18" height="4" rx="1" fill="#1a2438" stroke="#2a3448" strokeWidth="0.4" />
      {/* Solar panels — clipped to roof */}
      <clipPath id="roofClip">
        <polygon points="116,193 200,114 248,158 248,193" />
      </clipPath>
      <g clipPath="url(#roofClip)" opacity="0.95">
        <rect x="135" y="140" width="32" height="20" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.6" />
        <rect x="169" y="140" width="32" height="20" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.6" />
        <rect x="203" y="140" width="30" height="20" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.6" />
        <line x1="151" y1="140" x2="151" y2="160" stroke="#2d6090" strokeWidth="0.25" />
        <line x1="185" y1="140" x2="185" y2="160" stroke="#2d6090" strokeWidth="0.25" />
        <line x1="218" y1="140" x2="218" y2="160" stroke="#2d6090" strokeWidth="0.25" />
        <line x1="135" y1="150" x2="233" y2="150" stroke="#2d6090" strokeWidth="0.25" />
        <rect x="142" y="162" width="30" height="18" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.6" />
        <rect x="174" y="162" width="30" height="18" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.6" />
        <rect x="206" y="162" width="28" height="18" rx="1" fill="#1a3a60" stroke="#2d6090" strokeWidth="0.6" />
        <line x1="157" y1="162" x2="157" y2="180" stroke="#2d6090" strokeWidth="0.25" />
        <line x1="189" y1="162" x2="189" y2="180" stroke="#2d6090" strokeWidth="0.25" />
        <line x1="220" y1="162" x2="220" y2="180" stroke="#2d6090" strokeWidth="0.25" />
        <line x1="142" y1="171" x2="234" y2="171" stroke="#2d6090" strokeWidth="0.25" />
        <rect x="135" y="140" width="98" height="20" fill="#3b82f6" opacity="0">
          <animate attributeName="opacity" values="0;0.07;0" dur="3s" repeatCount="indefinite" />
        </rect>
      </g>
      {/* Windows */}
      <g>
        <rect x="145" y="212" width="28" height="32" rx="1.5" fill="#080c14" stroke="#2a3448" strokeWidth="0.6" />
        <line x1="159" y1="212" x2="159" y2="244" stroke="#2a3448" strokeWidth="0.4" />
        <line x1="145" y1="228" x2="173" y2="228" stroke="#2a3448" strokeWidth="0.4" />
        <rect x="146" y="213" width="12.5" height="14.5" fill="#1a1800" opacity="0.6">
          <animate attributeName="fill" values="#1a1800;#221e00;#1a1800" dur="6s" repeatCount="indefinite" />
        </rect>
        <rect x="160" y="229" width="12.5" height="14.5" fill="#1a1800" opacity="0.4">
          <animate attributeName="fill" values="#1a1800;#1e1a00;#1a1800" dur="8s" repeatCount="indefinite" />
        </rect>
        <rect x="228" y="212" width="28" height="32" rx="1.5" fill="#080c14" stroke="#2a3448" strokeWidth="0.6" />
        <line x1="242" y1="212" x2="242" y2="244" stroke="#2a3448" strokeWidth="0.4" />
        <line x1="228" y1="228" x2="256" y2="228" stroke="#2a3448" strokeWidth="0.4" />
        <rect x="229" y="213" width="12.5" height="14.5" fill="#1a1800" opacity="0.5">
          <animate attributeName="fill" values="#1a1800;#201c00;#1a1800" dur="7s" repeatCount="indefinite" />
        </rect>
      </g>
      {/* Door */}
      <rect x="186" y="255" width="28" height="40" rx="1.5" fill="#0c1018" stroke="#2a3448" strokeWidth="0.6" />
      <rect x="189" y="259" width="22" height="14" rx="1" fill="#0f1520" stroke="#1e2840" strokeWidth="0.3" />
      <rect x="189" y="276" width="22" height="16" rx="1" fill="#0f1520" stroke="#1e2840" strokeWidth="0.3" />
      <circle cx="210" cy="279" r="1.2" fill="#4a5568" />
      <ellipse cx="200" cy="253" rx="4" ry="2" fill="#F59E0B" opacity="0.08">
        <animate attributeName="opacity" values="0.06;0.12;0.06" dur="4s" repeatCount="indefinite" />
      </ellipse>
      {/* Porch step */}
      <rect x="182" y="293" width="36" height="4" rx="0.5" fill="#1a2030" stroke="#2a3448" strokeWidth="0.3" />
      {/* Powerwall unit */}
      <rect x="100" y="252" width="22" height="42" rx="2.5" fill="#141e30" stroke="#2a4060" strokeWidth="0.8" />
      <rect x="104" y="257" width="14" height="3.5" rx="1" fill="#22c55e" opacity="0.25">
        <animate attributeName="opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite" />
      </rect>
      <rect x="104" y="262" width="14" height="3.5" rx="1" fill="#22c55e" opacity="0.15" />
      <rect x="104" y="267" width="14" height="3.5" rx="1" fill="#22c55e" opacity="0.1" />
      <text x="111" y="283" textAnchor="middle" fill="#4a6080" fontSize="5" fontWeight="700" letterSpacing="0.5">PW</text>
      <line x1="111" y1="250" x2="111" y2="252" stroke="#2a4060" strokeWidth="1" />
      {/* Utility meter */}
      <g>
        <rect x="278" y="245" width="18" height="24" rx="2" fill="#141e30" stroke="#2a4060" strokeWidth="0.7" />
        <circle cx="287" cy="254" r="5.5" fill="#0a1018" stroke="#3a5070" strokeWidth="0.4" />
        <line x1="287" y1="254" x2="290" y2="252" stroke="#8B5CF6" strokeWidth="0.5" opacity="0.7">
          <animateTransform attributeName="transform" type="rotate" from="0 287 254" to="360 287 254" dur="8s" repeatCount="indefinite" />
        </line>
        <circle cx="287" cy="254" r="0.8" fill="#8B5CF6" opacity="0.6" />
        <text x="287" y="265" textAnchor="middle" fill="#4a6080" fontSize="3.5" fontWeight="600" letterSpacing="0.3">kWh</text>
        <line x1="287" y1="269" x2="287" y2="276" stroke="#2a4060" strokeWidth="0.8" />
      </g>
      {/* Landscaping */}
      <ellipse cx="140" cy="294" rx="10" ry="5" fill="#0f2010" opacity="0.6" />
      <ellipse cx="260" cy="294" rx="10" ry="5" fill="#0f2010" opacity="0.6" />
      {/* Ground line */}
      <line x1="70" y1="296" x2="330" y2="296" stroke="#1a2030" strokeWidth="0.8" />
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

  // Responsive node positions — tighter on mobile
  const nodes = compact
    ? {
        solar: { x: 200, y: 55 },
        home: { x: 200, y: 190 },
        battery: { x: 55, y: 210 },
        grid: { x: 345, y: 210 },
        ev: { x: 200, y: 310 },
      }
    : {
        solar: { x: 200, y: 70 },
        home: { x: 200, y: 230 },
        battery: { x: 50, y: 265 },
        grid: { x: 350, y: 265 },
        ev: { x: 200, y: 385 },
      };

  // Meter position (right side of house)
  const meter = compact ? { x: 263, y: 217 } : { x: 287, y: 254 };

  const vb = compact ? '0 0 400 410' : '0 0 400 500';
  const maxH = compact ? '420px' : '610px';
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
        <path
          id="p-solar-home"
          d={`M${nodes.solar.x},${nodes.solar.y + 22} L${nodes.home.x},${nodes.home.y - 30}`}
          fill="none" stroke={colors.solar}
          strokeWidth={solarToHome > 0 ? 1 : 0.3} strokeOpacity={solarToHome > 0 ? 0.25 : 0.06}
        />
        <path
          id="p-solar-bat"
          d={`M${nodes.solar.x - 30},${nodes.solar.y + 18} C${nodes.solar.x - 80},${nodes.solar.y + 70} ${nodes.battery.x + 20},${nodes.battery.y - 50} ${nodes.battery.x},${nodes.battery.y - 25}`}
          fill="none" stroke={colors.solar}
          strokeWidth={solarToBattery > 0 ? 1 : 0.3} strokeOpacity={solarToBattery > 0 ? 0.25 : 0.06}
        />
        <path
          id="p-bat-home"
          d={`M${nodes.battery.x + 25},${nodes.battery.y - 15} C${nodes.battery.x + 60},${nodes.battery.y - 50} ${nodes.home.x - 60},${nodes.home.y + 10} ${nodes.home.x - 30},${nodes.home.y}`}
          fill="none" stroke={colors.battery}
          strokeWidth={batteryToHome > 0 ? 1 : 0.3} strokeOpacity={batteryToHome > 0 ? 0.25 : 0.06}
        />
        <path
          id="p-solar-grid"
          d={`M${meter.x + 8},${meter.y} C${meter.x + 30},${meter.y} ${nodes.grid.x - 30},${nodes.grid.y - 15} ${nodes.grid.x},${nodes.grid.y - 20}`}
          fill="none" stroke={colors.grid}
          strokeWidth={solarToGrid > 0 ? 1 : 0.3} strokeOpacity={solarToGrid > 0 ? 0.25 : 0.06}
        />
        <path
          id="p-grid-home"
          d={`M${nodes.grid.x},${nodes.grid.y - 20} C${nodes.grid.x - 30},${nodes.grid.y - 15} ${meter.x + 30},${meter.y} ${meter.x + 8},${meter.y}`}
          fill="none" stroke={colors.grid}
          strokeWidth={gridToHome > 0 ? 1 : 0.3} strokeOpacity={gridToHome > 0 ? 0.25 : 0.06}
        />
        <path
          id="p-to-ev"
          d={`M${nodes.home.x},${nodes.home.y + (compact ? 60 : 65)} C${nodes.home.x},${nodes.home.y + (compact ? 90 : 100)} ${nodes.ev.x},${nodes.ev.y - 55} ${nodes.ev.x},${nodes.ev.y - 25}`}
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
          <BatteryIcon percent={flow.batteryPercent} color={colors.battery} cx={nodes.battery.x} cy={nodes.battery.y} />
          <text x={nodes.battery.x} y={nodes.battery.y + (compact ? 26 : 35)} textAnchor="middle" fill="#9ca3af" fontSize={labelFs} fontWeight="500" letterSpacing="1.5">POWERWALL</text>
          <text x={nodes.battery.x} y={nodes.battery.y + (compact ? 38 : 50)} textAnchor="middle" fill="white" fontSize={subValueFs} fontWeight="700">
            {Math.abs(flow.batteryPower).toFixed(1)} kW
          </text>
          <text x={nodes.battery.x} y={nodes.battery.y + (compact ? 48 : 63)} textAnchor="middle" fill="#6b7280" fontSize={compact ? 9 : 11}>
            · {flow.batteryPercent}%
          </text>
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

        {/* ── EV CHARGER ── */}
        <g>
          <circle cx={nodes.ev.x} cy={nodes.ev.y} r={compact ? 16 : 20} fill={colors.ev} fillOpacity={0.1} stroke={colors.ev} strokeWidth={1} strokeOpacity={0.4} />
          {/* Car icon using Lucide-style Car SVG */}
          <foreignObject x={nodes.ev.x - 10} y={nodes.ev.y - 10} width={20} height={20}>
            <div className="flex items-center justify-center w-full h-full">
              <svg viewBox="0 0 24 24" fill="none" stroke={colors.ev} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10H8s-2.7.6-4.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" />
                <path d="M16 10l1.5-4.5c.2-.6-.1-1.3-.8-1.4C15.4 3.9 13.8 3.5 12 3.5s-3.4.4-4.7.6c-.7.1-1 .8-.8 1.4L8 10" />
                <circle cx="7.5" cy="17" r="2.5" />
                <circle cx="16.5" cy="17" r="2.5" />
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
          <text x={nodes.ev.x} y={nodes.ev.y + (compact ? 26 : 35)} textAnchor="middle" fill="#9ca3af" fontSize={labelFs} fontWeight="500" letterSpacing="1.5">EV CHARGER</text>
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

        {/* ── Footer ── */}
        <g>
          {/* Today's Stats — bottom left, polished card style */}
          {(() => {
            const sx = compact ? 10 : 12;
            const sy = compact ? 340 : 425;
            const rowH = compact ? 18 : 22;
            const cardW = compact ? 120 : 145;
            const cardH = compact ? 78 : 90;
            const valueFontSize = compact ? 9 : 11;
            const labelFontSize = compact ? 5.5 : 6.5;
            const headerFs = compact ? 5.5 : 6.5;

            const stats = [
              { color: colors.solar, value: `${(flow.solarPower * 4.2).toFixed(1)}`, unit: 'kWh', label: 'Solar Generated', active: flow.solarPower > 0 },
              { color: colors.battery, value: `${(Math.abs(flow.batteryPower) * 2.9).toFixed(1)}`, unit: 'kWh', label: 'Battery Cycled', active: flow.batteryPower !== 0 },
              { color: colors.ev, value: `${(flow.evPower * 3.2).toFixed(1)}`, unit: 'kWh', label: 'EV Charged', active: flow.evPower > 0 },
            ];
            return (
              <g>
                {/* Card background */}
                <rect x={sx} y={sy - 2} width={cardW} height={cardH} rx={6} fill="#0d1220" fillOpacity={0.8} stroke="#1e293b" strokeWidth={0.5} />
                {/* Header */}
                <text x={sx + 8} y={sy + 10} fill="#6b7280" fontSize={headerFs} fontWeight="700" letterSpacing="1.5">
                  TODAY&apos;S ENERGY
                </text>
                {/* Divider line */}
                <line x1={sx + 8} y1={sy + 14} x2={sx + cardW - 8} y2={sy + 14} stroke="#1e293b" strokeWidth={0.5} />
                {/* Stats rows */}
                {stats.map((s, i) => {
                  const rowY = sy + 20 + i * rowH;
                  return (
                    <g key={s.label}>
                      {/* Color bar indicator */}
                      <rect x={sx + 8} y={rowY} width={2.5} height={compact ? 10 : 12} rx={1.25} fill={s.active ? s.color : '#374151'} opacity={s.active ? 0.9 : 0.3}>
                        {s.active && <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" />}
                      </rect>
                      {/* Value */}
                      <text x={sx + 16} y={rowY + (compact ? 6 : 7)} fill={s.active ? '#f3f4f6' : '#4b5563'} fontSize={valueFontSize} fontWeight="800">
                        {s.value}
                      </text>
                      {/* Unit */}
                      <text x={sx + 16 + s.value.length * (valueFontSize * 0.62)} y={rowY + (compact ? 6 : 7)} fill={s.active ? '#9ca3af' : '#4b5563'} fontSize={valueFontSize - 2} fontWeight="500">
                        {' '}{s.unit}
                      </text>
                      {/* Label */}
                      <text x={sx + 16} y={rowY + (compact ? 14 : 16)} fill={s.active ? '#6b7280' : '#374151'} fontSize={labelFontSize} fontWeight="400">
                        {s.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })()}

          {/* Stacked manufacturer pills — bottom right */}
          {(() => {
            const bx = compact ? 345 : 358;
            const by = compact ? 350 : 435;
            const gap = compact ? 14 : 16;
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
