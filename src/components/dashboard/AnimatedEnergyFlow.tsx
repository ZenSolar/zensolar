import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export interface TeslaVehicleFlow {
  kW: number;
  soc: number; // 0-100
  rangeMi: number;
  isCharging: boolean;
  source: 'home' | 'supercharger' | 'public' | 'none';
}

export interface EnergyFlowData {
  solarPower: number;
  homePower: number;
  batteryPower: number; // positive = charging, negative = discharging
  batteryPercent: number;
  batteryCapacityKwh?: number; // nameplate (e.g. 13.5 for one Powerwall)
  batteryReserveKwh?: number;  // currently stored energy
  gridPower: number; // positive = importing, negative = exporting
  evPower: number;
  tesla?: TeslaVehicleFlow;
}

/**
 * Pure formatter for the Powerwall node. Returns the strings + color the SVG
 * should render. Extracted so it can be unit-tested without rendering SVG.
 *
 * Multi-Powerwall ready: when `capacity` ≥ 20 kWh we drop decimals on the
 * primary number to keep the line under the node width at 390px.
 */
export interface PowerwallDisplay {
  primaryReserve: string;   // e.g. "13.5" or "13" (multi-unit)
  primaryCapacity: string;  // e.g. "13.5 kWh" or "27 kWh"
  status: string;           // e.g. "100%\u202F·\u202FFull"
  statusColor: string;
  isUnknown: boolean;
}

export function derivePowerwallDisplay(input: {
  capacity: number | null | undefined;
  reserve: number | null | undefined;
  percent: number | null | undefined;
  power: number | null | undefined;
}): PowerwallDisplay {
  const SEP = '\u202F·\u202F';
  const capacity = typeof input.capacity === 'number' && Number.isFinite(input.capacity) && input.capacity > 0
    ? input.capacity
    : null;
  const percent = typeof input.percent === 'number' && Number.isFinite(input.percent)
    ? Math.max(0, Math.min(100, input.percent))
    : null;
  const reserveRaw = typeof input.reserve === 'number' && Number.isFinite(input.reserve)
    ? input.reserve
    : (capacity !== null && percent !== null ? capacity * (percent / 100) : null);
  const reserve = reserveRaw !== null && capacity !== null
    ? Math.max(0, Math.min(capacity, reserveRaw))
    : reserveRaw;
  const power = typeof input.power === 'number' && Number.isFinite(input.power) ? input.power : null;

  const isUnknown = capacity === null || percent === null;
  const multiUnit = capacity !== null && capacity >= 20;
  const reserveDp = multiUnit ? 0 : 1;
  const capDp = multiUnit ? 0 : 1;

  const primaryReserve = reserve !== null ? reserve.toFixed(reserveDp) : '—';
  const primaryCapacity = capacity !== null ? `${capacity.toFixed(capDp)} kWh` : '— kWh';

  const fmtKw = (kw: number) => Math.abs(kw) >= 10 ? Math.abs(kw).toFixed(0) : Math.abs(kw).toFixed(1);

  let status: string;
  let statusColor: string;
  if (isUnknown) {
    status = 'State pending';
    statusColor = '#6b7280';
  } else if (power !== null && power > 0.05) {
    status = `${Math.round(percent!)}%${SEP}+${fmtKw(power)} kW`;
    statusColor = '#22C55E';
  } else if (power !== null && power < -0.05) {
    status = `${Math.round(percent!)}%${SEP}\u2212${fmtKw(power)} kW`;
    statusColor = '#F59E0B';
  } else if (percent! >= 99) {
    status = `${Math.round(percent!)}%${SEP}Full`;
    statusColor = '#6b7280';
  } else {
    status = `${Math.round(percent!)}%${SEP}Idle`;
    statusColor = '#6b7280';
  }

  return { primaryReserve, primaryCapacity, status, statusColor, isUnknown };
}

interface AnimatedEnergyFlowProps {
  data?: EnergyFlowData;
  className?: string;
  showHeader?: boolean;
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

// House illustration — premium with visible materials and depth
function HouseIllustration({ compact }: { compact?: boolean }) {
  const renderSolarPanels = (peakY: number, eaveY: number, cx: number, pw: number, gap: number) => {
    const rows = [1, 2, 3, 4];
    const rowH = (eaveY - peakY) / rows.length;
    const ph = rowH - (compact ? 2 : 2.5);
    return (
      <g>
        {rows.map((count, ri) => {
          const rowTop = peakY + ri * rowH;
          const totalW = count * pw + (count - 1) * gap;
          const startX = cx - totalW / 2;
          return Array.from({ length: count }).map((_, ci) => {
            const px = startX + ci * (pw + gap);
            const py = rowTop + 1;
            return (
              <g key={`${ri}-${ci}`}>
                <rect x={px} y={py} width={pw} height={ph} rx={1}
                  fill="url(#panelFill)" stroke="#3a7ab8" strokeWidth={compact ? 0.5 : 0.7} />
                {/* Cell grid lines */}
                <line x1={px + pw / 2} y1={py} x2={px + pw / 2} y2={py + ph}
                  stroke="#3a7ab8" strokeWidth="0.3" opacity="0.4" />
                <line x1={px} y1={py + ph / 2} x2={px + pw} y2={py + ph / 2}
                  stroke="#3a7ab8" strokeWidth="0.3" opacity="0.4" />
                {/* Reflection glint */}
                <rect x={px + 1} y={py + 1} width={pw / 3} height={ph / 3} rx={0.5}
                  fill="#4a90d0" opacity="0.08" />
              </g>
            );
          });
        })}
        {/* Solar shimmer pulse */}
        <rect x={cx - (compact ? 45 : 60)} y={peakY - 2}
          width={compact ? 90 : 120} height={eaveY - peakY + 4}
          fill="#3b82f6" opacity="0" rx="2">
          <animate attributeName="opacity" values="0;0.1;0" dur="3s" repeatCount="indefinite" />
        </rect>
      </g>
    );
  };

  if (compact) {
    const cx = 200;
    // Isometric depth offset — shifts right + up to suggest a back-right wall and roof side
    const dx = 11;
    const dy = 7;
    return (
      <g style={{ filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.55))' }}>
        {/* Ground shadow */}
        <ellipse cx={cx + 4} cy="258" rx="92" ry="5" fill="#050810" opacity="0.55" />

        {/* ── Isometric depth: back-right side wall (behind front face) ── */}
        <polygon
          points={`252,178 ${252 + dx},${178 - dy} ${252 + dx},${251 - dy} 252,251`}
          fill="#0c1424" stroke="#1e2a3c" strokeWidth="0.6"
        />
        {/* Subtle vertical light line on back wall */}
        <line x1={252 + dx} y1={178 - dy} x2={252 + dx} y2={251 - dy} stroke="#2e4058" strokeWidth="0.4" opacity="0.5" />

        {/* Foundation */}
        <rect x="144" y="249" width="112" height="6" rx="1" fill="#0e1420" stroke="#1e2a3c" strokeWidth="0.5" />
        <polygon
          points={`256,249 ${256 + dx},${249 - dy} ${256 + dx},${255 - dy} 256,255`}
          fill="#08101c" stroke="#1e2a3c" strokeWidth="0.4"
        />

        {/* House body */}
        <rect x="148" y="178" width="104" height="73" rx="2" fill="url(#houseFill)" stroke="#2e4058" strokeWidth="0.8" />
        {/* Siding lines */}
        {[190, 200, 210, 220, 230, 240].map(y => (
          <line key={y} x1="149" y1={y} x2="251" y2={y} stroke="#253448" strokeWidth="0.3" opacity="0.5" />
        ))}
        {/* Corner trim */}
        <rect x="148" y="178" width="4" height="73" fill="#162030" opacity="0.6" />
        <rect x="248" y="178" width="4" height="73" fill="#162030" opacity="0.6" />

        {/* Roof */}
        <polygon points="130,181 200,116 270,181" fill="url(#roofFill)" stroke="#2e4058" strokeWidth="0.8" />
        {/* Isometric back roof slope — darker for depth */}
        <polygon
          points={`200,116 ${200 + dx},${116 - dy} ${270 + dx},${181 - dy} 270,181`}
          fill="#0a1424" stroke="#1e2a3c" strokeWidth="0.6" opacity="0.95"
        />
        <line x1="200" y1="116" x2="200" y2="119" stroke="#4a6580" strokeWidth="0.7" />
        <line x1="131" y1="181" x2="269" y2="181" stroke="#1a2838" strokeWidth="1.5" />
        {/* Roof ridge texture */}
        <line x1="165" y1="149" x2="235" y2="149" stroke="#253448" strokeWidth="0.3" opacity="0.4" />
        <line x1="148" y1="165" x2="252" y2="165" stroke="#253448" strokeWidth="0.3" opacity="0.4" />

        {/* Solar panels */}
        {renderSolarPanels(119, 178, cx, 18, 2)}

        {/* Left window — warm interior */}
        <rect x="160" y="193" width="20" height="24" rx="1.5" fill="#0a1018" stroke="#2e4058" strokeWidth="0.6" />
        <line x1="170" y1="193" x2="170" y2="217" stroke="#2e4058" strokeWidth="0.4" />
        <line x1="160" y1="205" x2="180" y2="205" stroke="#2e4058" strokeWidth="0.4" />
        <rect x="161" y="194" width="8.5" height="10.5" rx="0.5" fill="url(#windowGlow)">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="6s" repeatCount="indefinite" />
        </rect>
        <rect x="171" y="206" width="8.5" height="10.5" rx="0.5" fill="url(#windowGlow)" opacity="0.5">
          <animate attributeName="opacity" values="0.4;0.7;0.4" dur="8s" repeatCount="indefinite" />
        </rect>
        {/* Window sill */}
        <rect x="159" y="217" width="22" height="1.5" rx="0.5" fill="#1a2838" />

        {/* Right window */}
        <rect x="220" y="193" width="20" height="24" rx="1.5" fill="#0a1018" stroke="#2e4058" strokeWidth="0.6" />
        <line x1="230" y1="193" x2="230" y2="217" stroke="#2e4058" strokeWidth="0.4" />
        <line x1="220" y1="205" x2="240" y2="205" stroke="#2e4058" strokeWidth="0.4" />
        <rect x="221" y="194" width="8.5" height="10.5" rx="0.5" fill="url(#windowGlow)" opacity="0.6">
          <animate attributeName="opacity" values="0.5;0.8;0.5" dur="7s" repeatCount="indefinite" />
        </rect>
        <rect x="219" y="217" width="22" height="1.5" rx="0.5" fill="#1a2838" />

        {/* Front door */}
        <rect x="189" y="218" width="22" height="34" rx="1.5" fill="#0c1420" stroke="#2e4058" strokeWidth="0.6" />
        <rect x="191" y="221" width="18" height="10" rx="1" fill="#0a1018" stroke="#1e2840" strokeWidth="0.3" />
        <rect x="191" y="233" width="8" height="8" rx="0.5" fill="#0a1018" stroke="#1e2840" strokeWidth="0.25" />
        <rect x="201" y="233" width="8" height="8" rx="0.5" fill="#0a1018" stroke="#1e2840" strokeWidth="0.25" />
        <circle cx="207" cy="237" r="1" fill="#F59E0B" opacity="0.5" />
        {/* Porch light glow */}
        <circle cx={cx} cy="216" r="2" fill="#F59E0B" opacity="0.2">
          <animate attributeName="opacity" values="0.15;0.35;0.15" dur="4s" repeatCount="indefinite" />
        </circle>
        <ellipse cx={cx} cy="220" rx="8" ry="4" fill="#F59E0B" opacity="0.05">
          <animate attributeName="opacity" values="0.03;0.08;0.03" dur="4s" repeatCount="indefinite" />
        </ellipse>

        {/* Powerwall */}
        <rect x="125" y="210" width="17" height="32" rx="2.5" fill="#0e1828" stroke="#2a4565" strokeWidth="0.8" />
        <rect x="127.5" y="214" width="12" height="3" rx="1" fill="#22c55e" opacity="0.5">
          <animate attributeName="opacity" values="0.35;0.65;0.35" dur="3s" repeatCount="indefinite" />
        </rect>
        <rect x="127.5" y="218.5" width="12" height="3" rx="1" fill="#22c55e" opacity="0.3" />
        <rect x="127.5" y="223" width="12" height="3" rx="1" fill="#22c55e" opacity="0.15" />
        <text x="133.5" y="235" textAnchor="middle" fill="#5a7a9a" fontSize="4" fontWeight="700">PW</text>
        <line x1="133.5" y1="208" x2="133.5" y2="210" stroke="#2a4565" strokeWidth="0.8" />

        {/* Utility meter */}
        <rect x="258" y="208" width="15" height="20" rx="2" fill="#0e1828" stroke="#2a4565" strokeWidth="0.6" />
        <circle cx="265.5" cy="216" r="4.5" fill="#0a1018" stroke="#3a5a7a" strokeWidth="0.4" />
        <line x1="265.5" y1="216" x2="268" y2="214" stroke="#8B5CF6" strokeWidth="0.5" opacity="0.8">
          <animateTransform attributeName="transform" type="rotate" from="0 265.5 216" to="360 265.5 216" dur="8s" repeatCount="indefinite" />
        </line>
        <circle cx="265.5" cy="216" r="0.7" fill="#8B5CF6" opacity="0.7" />
        <text x="265.5" y="225" textAnchor="middle" fill="#5a7a9a" fontSize="3" fontWeight="600">kWh</text>

        {/* Bushes */}
        <ellipse cx="155" cy="251" rx="7" ry="4" fill="#0f2a12" opacity="0.3" />
        <ellipse cx="245" cy="251" rx="7" ry="4" fill="#0f2a12" opacity="0.3" />

        {/* Ground */}
        <line x1="108" y1="255" x2="292" y2="255" stroke="#1a2535" strokeWidth="0.5" opacity="0.6" />
      </g>
    );
  }

  // Desktop version
  const cx = 200;
  return (
    <g>
      {/* Ground shadow */}
      <ellipse cx={cx} cy="298" rx="115" ry="7" fill="#050810" opacity="0.4" />

      {/* Foundation */}
      <rect x="122" y="290" width="156" height="8" rx="1.5" fill="#0e1420" stroke="#1e2a3c" strokeWidth="0.5" />

      {/* House body */}
      <rect x="128" y="192" width="144" height="100" rx="2" fill="url(#houseFill)" stroke="#2e4058" strokeWidth="1" />
      {/* Siding lines */}
      {[204, 216, 228, 240, 252, 264, 276, 288].map(y => (
        <line key={y} x1="129" y1={y} x2="271" y2={y} stroke="#253448" strokeWidth="0.3" opacity="0.4" />
      ))}
      {/* Corner trim */}
      <rect x="128" y="192" width="5" height="100" fill="#162030" opacity="0.6" />
      <rect x="267" y="192" width="5" height="100" fill="#162030" opacity="0.6" />

      {/* Roof */}
      <polygon points="108,195 200,108 292,195" fill="url(#roofFill)" stroke="#2e4058" strokeWidth="1" />
      <line x1={cx} y1="108" x2={cx} y2="113" stroke="#4a6580" strokeWidth="0.8" />
      <line x1="110" y1="195" x2="290" y2="195" stroke="#1a2838" strokeWidth="2" />
      {/* Roof texture lines */}
      <line x1="154" y1="152" x2="246" y2="152" stroke="#253448" strokeWidth="0.3" opacity="0.35" />
      <line x1="131" y1="175" x2="269" y2="175" stroke="#253448" strokeWidth="0.3" opacity="0.35" />

      {/* Chimney */}
      <rect x="253" y="130" width="15" height="38" rx="1.5" fill="#0e1828" stroke="#2e4058" strokeWidth="0.6" />
      <rect x="251" y="128" width="19" height="4.5" rx="1" fill="#0e1828" stroke="#2e4058" strokeWidth="0.5" />
      {/* Chimney brick lines */}
      <line x1="254" y1="136" x2="267" y2="136" stroke="#253448" strokeWidth="0.3" opacity="0.4" />
      <line x1="254" y1="144" x2="267" y2="144" stroke="#253448" strokeWidth="0.3" opacity="0.4" />
      <line x1="254" y1="152" x2="267" y2="152" stroke="#253448" strokeWidth="0.3" opacity="0.4" />

      {/* Solar panels */}
      {renderSolarPanels(113, 191, cx, 24, 2.5)}

      {/* Left window — 4-pane with shutters */}
      <rect x="142" y="210" width="30" height="34" rx="1.5" fill="#0a1018" stroke="#2e4058" strokeWidth="0.7" />
      <line x1="157" y1="210" x2="157" y2="244" stroke="#2e4058" strokeWidth="0.4" />
      <line x1="142" y1="227" x2="172" y2="227" stroke="#2e4058" strokeWidth="0.4" />
      {/* Shutters */}
      <rect x="138" y="209" width="4" height="36" rx="0.5" fill="#12203a" stroke="#253448" strokeWidth="0.4" />
      <rect x="172" y="209" width="4" height="36" rx="0.5" fill="#12203a" stroke="#253448" strokeWidth="0.4" />
      {/* Window sill */}
      <rect x="140" y="244" width="34" height="2.5" rx="0.5" fill="#1a2838" stroke="#2e4058" strokeWidth="0.3" />
      {/* Warm glow */}
      <rect x="143" y="211" width="13.5" height="15.5" rx="0.5" fill="url(#windowGlow)">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="6s" repeatCount="indefinite" />
      </rect>
      <rect x="158" y="228" width="13.5" height="15.5" rx="0.5" fill="url(#windowGlow)" opacity="0.5">
        <animate attributeName="opacity" values="0.4;0.7;0.4" dur="8s" repeatCount="indefinite" />
      </rect>
      <rect x="158" y="211" width="13.5" height="15.5" rx="0.5" fill="url(#windowGlow)" opacity="0.3">
        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="9s" repeatCount="indefinite" />
      </rect>

      {/* Right window — 4-pane with shutters */}
      <rect x="228" y="210" width="30" height="34" rx="1.5" fill="#0a1018" stroke="#2e4058" strokeWidth="0.7" />
      <line x1="243" y1="210" x2="243" y2="244" stroke="#2e4058" strokeWidth="0.4" />
      <line x1="228" y1="227" x2="258" y2="227" stroke="#2e4058" strokeWidth="0.4" />
      <rect x="224" y="209" width="4" height="36" rx="0.5" fill="#12203a" stroke="#253448" strokeWidth="0.4" />
      <rect x="258" y="209" width="4" height="36" rx="0.5" fill="#12203a" stroke="#253448" strokeWidth="0.4" />
      <rect x="226" y="244" width="34" height="2.5" rx="0.5" fill="#1a2838" stroke="#2e4058" strokeWidth="0.3" />
      <rect x="229" y="211" width="13.5" height="15.5" rx="0.5" fill="url(#windowGlow)" opacity="0.6">
        <animate attributeName="opacity" values="0.5;0.85;0.5" dur="7s" repeatCount="indefinite" />
      </rect>

      {/* Front door — paneled */}
      <rect x="184" y="253" width="32" height="40" rx="1.5" fill="#0c1420" stroke="#2e4058" strokeWidth="0.7" />
      {/* Transom window */}
      <rect x="187" y="255" width="26" height="9" rx="1" fill="#0a1018" stroke="#1e2a3c" strokeWidth="0.35" />
      <rect x="188" y="256" width="12" height="7" rx="0.5" fill="url(#windowGlow)" opacity="0.25" />
      {/* Door panels */}
      <rect x="187" y="267" width="12" height="12" rx="1" fill="#0a1018" stroke="#1e2a3c" strokeWidth="0.3" />
      <rect x="201" y="267" width="12" height="12" rx="1" fill="#0a1018" stroke="#1e2a3c" strokeWidth="0.3" />
      <rect x="187" y="281" width="12" height="10" rx="1" fill="#0a1018" stroke="#1e2a3c" strokeWidth="0.3" />
      <rect x="201" y="281" width="12" height="10" rx="1" fill="#0a1018" stroke="#1e2a3c" strokeWidth="0.3" />
      {/* Door handle */}
      <circle cx="211" cy="278" r="1.5" fill="#4a6a8a" opacity="0.7" />

      {/* Porch light */}
      <circle cx={cx} cy="250" r="2" fill="#F59E0B" opacity="0.25">
        <animate attributeName="opacity" values="0.15;0.4;0.15" dur="4s" repeatCount="indefinite" />
      </circle>
      <ellipse cx={cx} cy="254" rx="12" ry="6" fill="#F59E0B" opacity="0.05">
        <animate attributeName="opacity" values="0.03;0.08;0.03" dur="4s" repeatCount="indefinite" />
      </ellipse>

      {/* Porch steps */}
      <rect x="180" y="291" width="40" height="3.5" rx="0.5" fill="#12203a" stroke="#2e4058" strokeWidth="0.35" />
      <rect x="176" y="294.5" width="48" height="3.5" rx="0.5" fill="#0e1828" stroke="#253448" strokeWidth="0.25" />

      {/* Powerwall unit */}
      <rect x="96" y="248" width="24" height="44" rx="3" fill="#0e1828" stroke="#2a4565" strokeWidth="1" />
      <rect x="100" y="254" width="16" height="4" rx="1" fill="#22c55e" opacity="0.5">
        <animate attributeName="opacity" values="0.35;0.7;0.35" dur="3s" repeatCount="indefinite" />
      </rect>
      <rect x="100" y="260" width="16" height="4" rx="1" fill="#22c55e" opacity="0.3" />
      <rect x="100" y="266" width="16" height="4" rx="1" fill="#22c55e" opacity="0.15" />
      <rect x="100" y="272" width="16" height="4" rx="1" fill="#22c55e" opacity="0.08" />
      <text x="108" y="285" textAnchor="middle" fill="#5a7a9a" fontSize="5" fontWeight="700" letterSpacing="0.5">PW</text>
      <line x1="108" y1="246" x2="108" y2="248" stroke="#2a4565" strokeWidth="1" />

      {/* Utility meter */}
      <g>
        <rect x="280" y="242" width="20" height="28" rx="2" fill="#0e1828" stroke="#2a4565" strokeWidth="0.8" />
        <circle cx="290" cy="252" r="6" fill="#0a1018" stroke="#3a5a7a" strokeWidth="0.5" />
        <line x1="290" y1="252" x2="293" y2="250" stroke="#8B5CF6" strokeWidth="0.6" opacity="0.8">
          <animateTransform attributeName="transform" type="rotate" from="0 290 252" to="360 290 252" dur="8s" repeatCount="indefinite" />
        </line>
        <circle cx="290" cy="252" r="0.9" fill="#8B5CF6" opacity="0.7" />
        <rect x="283" y="261" width="14" height="5.5" rx="0.5" fill="#0a1018" stroke="#2a4565" strokeWidth="0.3" />
        <text x="290" y="265.5" textAnchor="middle" fill="#5a7a9a" fontSize="3.5" fontWeight="600" letterSpacing="0.3">kWh</text>
        <line x1="290" y1="270" x2="290" y2="278" stroke="#2a4565" strokeWidth="0.8" />
      </g>

      {/* Trees */}
      <g opacity="0.35">
        <rect x="123" y="280" width="2.5" height="14" rx="0.5" fill="#2a4020" />
        <ellipse cx="124" cy="278" rx="7" ry="9" fill="#0f2a12" />
        <ellipse cx="124" cy="273" rx="5" ry="7" fill="#153018" />
        <rect x="275" y="282" width="2.5" height="12" rx="0.5" fill="#2a4020" />
        <ellipse cx="276" cy="280" rx="6" ry="8" fill="#0f2a12" />
        <ellipse cx="276" cy="275" rx="4" ry="6" fill="#153018" />
      </g>

      {/* Bushes */}
      <ellipse cx="140" cy="292" rx="9" ry="4.5" fill="#0f2a12" opacity="0.25" />
      <ellipse cx="260" cy="292" rx="9" ry="4.5" fill="#0f2a12" opacity="0.25" />

      {/* Ground */}
      <line x1="65" y1="298" x2="335" y2="298" stroke="#1a2535" strokeWidth="0.6" opacity="0.5" />
    </g>
  );
}

export function AnimatedEnergyFlow({ data, className, showHeader = true }: AnimatedEnergyFlowProps) {
  const isMobile = useIsMobile();
  const compact = isMobile;

  const demoData: EnergyFlowData = {
    solarPower: 3.2,
    homePower: 0.7,
    batteryPower: -2.5,
    batteryPercent: 73,
    batteryCapacityKwh: 13.5,
    batteryReserveKwh: 9.9,
    gridPower: -0.8,
    evPower: 11,
  };

  const flow = data || demoData;

  // Tesla overrides EV when present
  const tesla = flow.tesla;
  const teslaActive = !!tesla;
  const teslaHomeCharging = teslaActive && tesla!.isCharging && tesla!.source === 'home';
  const teslaSuperchargerActive = teslaActive && tesla!.isCharging && tesla!.source === 'supercharger';
  const effectiveEvPower = teslaActive ? (teslaHomeCharging ? tesla!.kW : 0) : flow.evPower;

  // Flow calculations
  const solarToHome = flow.solarPower > 0 && flow.homePower > 0 ? Math.min(flow.solarPower, flow.homePower) : 0;
  const solarToBattery = flow.solarPower > 0 && flow.batteryPower > 0 ? Math.min(flow.solarPower - solarToHome, flow.batteryPower) : 0;
  const batteryToHome = flow.batteryPower < 0 ? Math.abs(flow.batteryPower) : 0;
  const gridToHome = flow.gridPower > 0 ? flow.gridPower : 0;
  const solarToGrid = flow.gridPower < 0 ? Math.abs(flow.gridPower) : 0;
  const solarToEV = effectiveEvPower > 0 ? effectiveEvPower : 0;

  const colors = {
    solar: '#F59E0B',
    battery: '#22C55E',
    home: '#F97316',
    grid: '#8B5CF6',
    ev: '#3B82F6',
    tesla: '#E11D48',
  };

  // Responsive node positions — tighter on mobile.
  // Compact viewBox is 400x440 (taller) so the isometric house can dominate
  // the middle ~55-60% without crowding the perimeter nodes/numbers.
  const nodes = compact
    ? {
        solar: { x: 200, y: 64 },        // pushed down so 28px value text (above) no longer clips the top
        home: { x: 200, y: 215 },
        battery: { x: 50, y: 250 },
        grid: { x: 350, y: 250 },
        ev: { x: 200, y: 380 },
      }
    : {
        solar: { x: 200, y: 55 },
        home: { x: 200, y: 230 },
        battery: { x: 45, y: 275 },
        grid: { x: 355, y: 275 },
        ev: { x: 200, y: 395 },
      };

  // Meter position (right side of house)
  const meter = compact ? { x: 263, y: 247 } : { x: 287, y: 254 };

  const vb = compact ? '0 0 400 440' : '0 0 400 470';
  const maxH = compact ? '480px' : '560px';
  // Tesla-grade legibility: large primary values readable at arm's length on 390px.
  const labelFs = compact ? 11 : 11;
  const valueFs = compact ? 28 : 32;       // perimeter nodes (Solar / Grid / EV)
  const subValueFs = compact ? 20 : 24;    // Powerwall stored kWh
  const homeFs = compact ? 36 : 38;        // centerpiece HOME kW

  return (
    <div className={`relative ${className}`}>
      {/* Refined header — eyebrow style, no neon */}
      {showHeader && <div className="relative z-10 pt-4 pb-2 px-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0"
            style={{ boxShadow: '0 0 8px hsla(142, 76%, 50%, 0.7)', animation: 'zenLivePulse 2.2s ease-in-out infinite' }}
          />
          <span className="text-[10px] uppercase tracking-[0.18em] font-medium text-muted-foreground/80">
            Live
          </span>
          <span className="hidden sm:inline text-muted-foreground/30">·</span>
          <h3 className="text-[13px] sm:text-sm font-semibold tracking-tight text-foreground/90 truncate">
            ZenEnergy Monitoring
          </h3>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] tracking-wide text-muted-foreground/60 font-medium shrink-0">
          <span>Enphase</span>
          <span className="text-muted-foreground/25">·</span>
          <span>Tesla</span>
          <span className="text-muted-foreground/25">·</span>
          <span>Wallbox</span>
        </div>
        <style>{`
          @keyframes zenLivePulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.55; transform: scale(0.85); }
          }
        `}</style>
      </div>}


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
          <filter id="valueGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <radialGradient id="solarAmbient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.solar} stopOpacity={0.12} />
            <stop offset="60%" stopColor={colors.solar} stopOpacity={0.04} />
            <stop offset="100%" stopColor={colors.solar} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="houseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e2d42" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#141e30" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="roofFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2840" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0f1a2a" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="windowGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="panelFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0c2a55" stopOpacity="0.85" />
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
        {/* Discharge channel underglow — energizes the path itself, not just the dots */}
        {batteryToHome > 0.05 && (
          <path
            d={`M${nodes.battery.x + 25},${nodes.battery.y - 15} C${nodes.battery.x + 60},${nodes.battery.y - 50} ${nodes.home.x - 60},${nodes.home.y + 10} ${nodes.home.x - 30},${nodes.home.y}`}
            fill="none" stroke={colors.battery} strokeWidth={6} strokeOpacity={0.18} strokeLinecap="round"
            filter="url(#dotGlow)"
          >
            <animate attributeName="stroke-opacity" values="0.10;0.28;0.10" dur="2s" repeatCount="indefinite" />
          </path>
        )}
        <path
          id="p-solar-grid"
          d={`M${meter.x + 8},${meter.y} C${meter.x + 30},${meter.y} ${nodes.grid.x - 30},${nodes.grid.y} ${nodes.grid.x},${nodes.grid.y}`}
          fill="none" stroke={colors.grid}
          strokeWidth={solarToGrid > 0 ? 1 : 0.3} strokeOpacity={solarToGrid > 0 ? 0.25 : 0.06}
        />
        <path
          id="p-grid-home"
          d={`M${nodes.grid.x},${nodes.grid.y} C${nodes.grid.x - 30},${nodes.grid.y} ${meter.x + 30},${meter.y} ${meter.x + 8},${meter.y}`}
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
        {batteryToHome > 0.05 && (
          <g data-flow="powerwall-home">
            <FlowingDots pathId="p-bat-home" color={colors.battery} power={Math.max(batteryToHome * 1.4, 2.0)} dotCount={8} />
          </g>
        )}
        <FlowingDots pathId="p-grid-home" color={colors.grid} power={gridToHome} dotCount={4} />
        <FlowingDots pathId="p-solar-grid" color={colors.grid} power={solarToGrid} dotCount={4} />
        <FlowingDots pathId="p-to-ev" color={colors.ev} power={solarToEV} dotCount={4} />


        {/* ── SOLAR ── */}
        <g>
          <circle cx={nodes.solar.x} cy={nodes.solar.y} r={compact ? 14 : 18} fill={colors.solar} fillOpacity={0.1} stroke={colors.solar} strokeWidth={0.8} strokeOpacity={0.35} />
          <foreignObject x={nodes.solar.x - 8} y={nodes.solar.y - 8} width={16} height={16}>
            <div className="flex items-center justify-center w-full h-full">
              <svg viewBox="0 0 24 24" fill="none" stroke={colors.solar} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            </div>
          </foreignObject>
          <text x={nodes.solar.x} y={nodes.solar.y - (compact ? 20 : 26)} textAnchor="middle" fill="#9ca3af" fontSize={labelFs} fontWeight="500" letterSpacing="1.5">SOLAR</text>
          <text x={nodes.solar.x} y={nodes.solar.y - (compact ? 29 : 37)} textAnchor="middle" fill={colors.solar} fontSize={valueFs} fontWeight="700">
            {flow.solarPower.toFixed(1)} kW
          </text>
          {/* Manufacturer — quiet monochrome tag */}
          <text x={nodes.solar.x} y={nodes.solar.y - (compact ? 11 : 15)} textAnchor="middle" fill="#6b7280" fontSize={compact ? 5.5 : 6.5} fontWeight="500" letterSpacing="0.6">enphase</text>
        </g>

        {/* ── HOME ── centered in house body, large hero number */}
        <g style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.85))' }}>
          <text x={nodes.home.x} y={compact ? 222 : 250} textAnchor="middle" fill="white" fontSize={homeFs} fontWeight="800" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px' }}>
            {flow.homePower.toFixed(1)}<tspan fontSize={compact ? 13 : 15} fontWeight="600" fill="#cbd5e1" dx={3}>kW</tspan>
          </text>
          <text x={nodes.home.x} y={compact ? 236 : 266} textAnchor="middle" fill="#9ca3af" fontSize={labelFs} fontWeight="600" letterSpacing="2">HOME</text>
        </g>

        {/* ── POWERWALL ── kWh stored is the primary number; kW is contextual */}
        {(() => {
          const display = derivePowerwallDisplay({
            capacity: flow.batteryCapacityKwh,
            reserve: flow.batteryReserveKwh,
            percent: flow.batteryPercent,
            power: flow.batteryPower,
          });
          const pwState: 'discharging' | 'charging' | 'idle' | 'unknown' =
            display.isUnknown
              ? 'unknown'
              : typeof flow.batteryPower === 'number' && Number.isFinite(flow.batteryPower) && flow.batteryPower < -0.05
                ? 'discharging'
                : typeof flow.batteryPower === 'number' && Number.isFinite(flow.batteryPower) && flow.batteryPower > 0.05
                  ? 'charging'
                  : 'idle';
          const isDischarging = pwState === 'discharging';
          return (
            <g data-state={pwState}>
              {/* Amber pulsing halo when discharging */}
              {isDischarging && (
                <>
                  <circle
                    cx={nodes.battery.x}
                    cy={nodes.battery.y}
                    r={compact ? 24 : 30}
                    fill="#F59E0B"
                    fillOpacity={0.18}
                  >
                    <animate attributeName="fill-opacity" values="0.12;0.28;0.12" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="r" values={compact ? '22;28;22' : '28;36;28'} dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle
                    cx={nodes.battery.x}
                    cy={nodes.battery.y}
                    r={compact ? 16 : 20}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth={1.2}
                    strokeOpacity={0.7}
                  >
                    <animate attributeName="stroke-opacity" values="0.4;0.85;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
              <circle cx={nodes.battery.x} cy={nodes.battery.y} r={compact ? 14 : 18} fill={colors.battery} fillOpacity={0.1} stroke={isDischarging ? '#F59E0B' : colors.battery} strokeWidth={isDischarging ? 1.2 : 0.8} strokeOpacity={isDischarging ? 0.7 : 0.35} />
              <BatteryIcon percent={flow.batteryPercent} color={colors.battery} cx={nodes.battery.x} cy={nodes.battery.y} />
              <text x={nodes.battery.x} y={nodes.battery.y + (compact ? 22 : 28)} textAnchor="middle" fill="#9ca3af" fontSize={labelFs} fontWeight="500" letterSpacing="1.2">POWERWALL</text>
              <text x={nodes.battery.x} y={nodes.battery.y - (compact ? 18 : 22)} textAnchor="middle" fill="#6b7280" fontSize={compact ? 5.5 : 6.5} fontWeight="500" letterSpacing="0.6">tesla</text>
              <text x={nodes.battery.x} y={nodes.battery.y + (compact ? 35 : 43)} textAnchor="middle" fill={colors.battery} fontSize={subValueFs} fontWeight="700">
                {display.primaryReserve}<tspan fontSize={compact ? 10 : 12} fontWeight="500" fill="#9ca3af"> / {display.primaryCapacity}</tspan>
              </text>
              <text x={nodes.battery.x} y={nodes.battery.y + (compact ? 47 : 57)} textAnchor="middle" fill={display.statusColor} fontSize={compact ? 10 : 12} fontWeight="600" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {display.status}
              </text>
              <rect x={nodes.battery.x - 16} y={nodes.battery.y + (compact ? 49 : 60)} width={32} height={4} rx={2} fill="#1a2030" fillOpacity={0.15} />
              <rect x={nodes.battery.x - 16} y={nodes.battery.y + (compact ? 49 : 60)} width={32 * (Math.max(0, Math.min(100, flow.batteryPercent || 0)) / 100)} height={4} rx={2} fill={colors.battery} fillOpacity={0.6} />
            </g>
          );
        })()}


        {/* ── GRID (power tower icon) ── */}
        <g>
          <circle cx={nodes.grid.x} cy={nodes.grid.y} r={compact ? 14 : 18} fill={colors.grid} fillOpacity={0.1} stroke={colors.grid} strokeWidth={0.8} strokeOpacity={0.35} />
          <foreignObject x={nodes.grid.x - 8} y={nodes.grid.y - 8} width={16} height={16}>
            <div className="flex items-center justify-center w-full h-full">
              <svg viewBox="0 0 24 24" fill="none" stroke={colors.grid} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M8 2h8l-2 6h3l-5 14 1-8H9l1-6H8z" fill="none" />
                <line x1="4" y1="8" x2="20" y2="8" />
                <line x1="6" y1="4" x2="18" y2="4" />
              </svg>
            </div>
          </foreignObject>
          <text x={nodes.grid.x} y={nodes.grid.y + (compact ? 22 : 28)} textAnchor="middle" fill="#9ca3af" fontSize={labelFs} fontWeight="500" letterSpacing="1.2">GRID</text>
          <text x={nodes.grid.x} y={nodes.grid.y + (compact ? 35 : 43)} textAnchor="middle" fill={colors.grid} fontSize={subValueFs} fontWeight="700">
            {Math.abs(flow.gridPower).toFixed(1)} kW
          </text>
          {flow.gridPower !== 0 && (
            <text x={nodes.grid.x} y={nodes.grid.y + (compact ? 45 : 55)} textAnchor="middle" fill="#6b7280" fontSize={compact ? 7 : 9}>
              {flow.gridPower > 0 ? 'importing' : 'exporting'}
            </text>
          )}
        </g>

        {/* ── EV CHARGER / TESLA VEHICLE ── */}
        {teslaActive ? (
          (() => {
            const nodeR = compact ? 17 : 22;
            const ringR = nodeR + 4;
            const soc = Math.max(0, Math.min(100, tesla!.soc));
            const circ = 2 * Math.PI * ringR;
            const dashOn = (soc / 100) * circ;
            const isLive = tesla!.isCharging;
            const accent = isLive ? colors.tesla : '#64748b';
            const mutedOpacity = isLive ? 1 : 0.55;
            return (
              <g opacity={mutedOpacity}>
                {/* SOC ring background */}
                <circle cx={nodes.ev.x} cy={nodes.ev.y} r={ringR} fill="none" stroke="#1f2937" strokeWidth={1.6} />
                {/* SOC ring progress */}
                <circle
                  cx={nodes.ev.x} cy={nodes.ev.y} r={ringR}
                  fill="none" stroke={accent} strokeWidth={1.8} strokeLinecap="round"
                  strokeDasharray={`${dashOn} ${circ}`}
                  transform={`rotate(-90 ${nodes.ev.x} ${nodes.ev.y})`}
                  opacity={0.85}
                />
                {/* Pulsing glow when charging */}
                {isLive && (
                  <circle cx={nodes.ev.x} cy={nodes.ev.y} r={ringR + 2} fill="none" stroke={colors.tesla} strokeWidth={1} opacity={0.4}>
                    <animate attributeName="r" values={`${ringR + 1};${ringR + 6};${ringR + 1}`} dur="2.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.55;0;0.55" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Node disc */}
                <circle cx={nodes.ev.x} cy={nodes.ev.y} r={nodeR} fill={accent} fillOpacity={0.12} stroke={accent} strokeWidth={0.8} strokeOpacity={0.45} />
                {/* Car silhouette */}
                <foreignObject x={nodes.ev.x - 10} y={nodes.ev.y - 8} width={20} height={16}>
                  <div className="flex items-center justify-center w-full h-full">
                    <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
                      <circle cx="6.5" cy="16.5" r="2.5" />
                      <circle cx="16.5" cy="16.5" r="2.5" />
                    </svg>
                  </div>
                </foreignObject>
                {/* Labels */}
                <text x={nodes.ev.x} y={nodes.ev.y + ringR + (compact ? 11 : 14)} textAnchor="middle" fill="#9ca3af" fontSize={labelFs} fontWeight="500" letterSpacing="1.2">TESLA</text>
                <text x={nodes.ev.x} y={nodes.ev.y - ringR - (compact ? 8 : 11)} textAnchor="middle" fill="#6b7280" fontSize={compact ? 5.5 : 6.5} fontWeight="500" letterSpacing="0.6">vehicle</text>
                <text x={nodes.ev.x} y={nodes.ev.y + ringR + (compact ? 23 : 28)} textAnchor="middle" fill={accent} fontSize={subValueFs} fontWeight="700">
                  {isLive ? `${tesla!.kW.toFixed(1)} kW` : `${Math.round(soc)}%`}
                </text>
                <text x={nodes.ev.x} y={nodes.ev.y + ringR + (compact ? 33 : 40)} textAnchor="middle" fill="#6b7280" fontSize={compact ? 7 : 9}>
                  {isLive
                    ? `${Math.round(soc)}% · charging`
                    : `Parked · ${Math.round(tesla!.rangeMi)} mi`}
                </text>
                {isLive && (
                  <circle cx={nodes.ev.x + (compact ? 22 : 28)} cy={nodes.ev.y - (compact ? 22 : 28)} r={2.5} fill={colors.tesla}>
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="1.4s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Supercharger badge — floats in from right when supercharging */}
                {teslaSuperchargerActive && (
                  <g>
                    <rect
                      x={nodes.ev.x + (compact ? 32 : 40)} y={nodes.ev.y - (compact ? 8 : 10)}
                      width={compact ? 60 : 72} height={compact ? 16 : 20} rx={compact ? 8 : 10}
                      fill={colors.tesla} fillOpacity={0.18} stroke={colors.tesla} strokeWidth={0.8}
                    />
                    <text
                      x={nodes.ev.x + (compact ? 62 : 76)} y={nodes.ev.y + (compact ? 3 : 4)}
                      textAnchor="middle" fill={colors.tesla} fontSize={compact ? 7.5 : 9}
                      fontWeight="700" letterSpacing="0.8"
                    >
                      SUPERCHARGER
                    </text>
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
                  </g>
                )}
              </g>
            );
          })()
        ) : (
          <g>
            <circle cx={nodes.ev.x} cy={nodes.ev.y} r={compact ? 14 : 18} fill={colors.ev} fillOpacity={0.1} stroke={colors.ev} strokeWidth={0.8} strokeOpacity={0.35} />
            <foreignObject x={nodes.ev.x - 8} y={nodes.ev.y - 8} width={16} height={16}>
              <div className="flex items-center justify-center w-full h-full">
                <svg viewBox="0 0 24 24" fill="none" stroke={colors.ev} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
            </foreignObject>
            {flow.evPower > 0 && (
              <g opacity="0.5">
                <path
                  d={`M${nodes.ev.x + 12},${nodes.ev.y - 1} Q${nodes.ev.x + 20},${nodes.ev.y - 8} ${nodes.ev.x + 16},${nodes.ev.y - 18}`}
                  fill="none" stroke={colors.ev} strokeWidth="1" strokeDasharray="3 2"
                >
                  <animate attributeName="stroke-dashoffset" values="0;-10" dur="1s" repeatCount="indefinite" />
                </path>
              </g>
            )}
            <text x={nodes.ev.x} y={nodes.ev.y + (compact ? 22 : 28)} textAnchor="middle" fill="#9ca3af" fontSize={labelFs} fontWeight="500" letterSpacing="1.2">EV CHARGER</text>
            <text x={nodes.ev.x} y={nodes.ev.y - (compact ? 18 : 22)} textAnchor="middle" fill="#6b7280" fontSize={compact ? 5.5 : 6.5} fontWeight="500" letterSpacing="0.6">wallbox</text>
            <text x={nodes.ev.x} y={nodes.ev.y + (compact ? 35 : 43)} textAnchor="middle" fill={colors.ev} fontSize={subValueFs} fontWeight="700">
              {flow.evPower.toFixed(1)} kW
            </text>
            {flow.evPower > 0 && (
              <text x={nodes.ev.x} y={nodes.ev.y + (compact ? 45 : 55)} textAnchor="middle" fill={colors.ev} fontSize={compact ? 6.5 : 8.5} fontWeight="500">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
                charging
              </text>
            )}
          </g>
        )}

        {/* Footer panel removed — values already shown at each node, no need to repeat */}
      </svg>
    </div>
  );
}
