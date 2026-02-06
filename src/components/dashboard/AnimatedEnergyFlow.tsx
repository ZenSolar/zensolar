import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

interface EnergyFlowData {
  solarPower: number; // kW currently generating
  homePower: number; // kW consuming
  batteryPower: number; // kW positive = charging, negative = discharging
  batteryPercent: number; // 0-100
  gridPower: number; // kW positive = importing, negative = exporting
  evPower: number; // kW charging
}

interface AnimatedEnergyFlowProps {
  data?: EnergyFlowData;
  className?: string;
}

// Animated dot that flows along an SVG path
function FlowingDots({ 
  pathId, 
  color, 
  power, 
  reverse = false,
  dotCount = 3,
}: { 
  pathId: string; 
  color: string; 
  power: number; 
  reverse?: boolean;
  dotCount?: number;
}) {
  const [pathLength, setPathLength] = useState(0);
  const pathRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const path = document.getElementById(pathId) as unknown as SVGPathElement | null;
    if (path) {
      pathRef.current = path;
      setPathLength(path.getTotalLength());
    }
  }, [pathId]);

  if (power <= 0 || pathLength === 0) return null;

  // Speed inversely proportional to power (more power = faster)
  const duration = Math.max(1.5, 4 - power * 0.3);
  const actualDotCount = Math.min(Math.max(2, Math.ceil(power * 0.8)), dotCount);

  return (
    <>
      {Array.from({ length: actualDotCount }).map((_, i) => (
        <motion.circle
          key={`${pathId}-dot-${i}`}
          r={3.5}
          fill={color}
          filter="url(#glow)"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{
            duration,
            repeat: Infinity,
            delay: (i / actualDotCount) * duration,
            ease: "linear",
          }}
        >
          <animateMotion
            dur={`${duration}s`}
            repeatCount="indefinite"
            begin={`${(i / actualDotCount) * duration}s`}
            keyPoints={reverse ? "1;0" : "0;1"}
            keyTimes="0;1"
            calcMode="linear"
          >
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </motion.circle>
      ))}
    </>
  );
}

// Node label component
function NodeLabel({
  x,
  y,
  label,
  value,
  unit = 'kW',
  subLabel,
  color,
  icon,
}: {
  x: number;
  y: number;
  label: string;
  value: number;
  unit?: string;
  subLabel?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <g>
      {/* Icon circle */}
      <circle cx={x} cy={y} r={28} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.5} />
      <circle cx={x} cy={y} r={22} fill={color} fillOpacity={0.08} />
      
      {/* Icon placeholder - we'll use text for simplicity */}
      <foreignObject x={x - 12} y={y - 12} width={24} height={24}>
        <div className="flex items-center justify-center w-full h-full text-current" style={{ color }}>
          {icon}
        </div>
      </foreignObject>

      {/* Label */}
      <text
        x={x}
        y={y + 42}
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize={11}
        fontWeight={500}
        letterSpacing={1.5}
      >
        {label.toUpperCase()}
      </text>

      {/* Value */}
      <text
        x={x}
        y={y + 58}
        textAnchor="middle"
        className="fill-foreground"
        fontSize={16}
        fontWeight={700}
      >
        {value.toFixed(1)} {unit}
      </text>

      {/* Sub label (e.g., battery %) */}
      {subLabel && (
        <text
          x={x}
          y={y + 73}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={11}
        >
          {subLabel}
        </text>
      )}
    </g>
  );
}

// Battery gauge
function BatteryGauge({ x, y, percent, color }: { x: number; y: number; percent: number; color: string }) {
  const barWidth = 36;
  const barHeight = 8;
  const fillWidth = (percent / 100) * barWidth;
  
  return (
    <g>
      <rect
        x={x - barWidth / 2}
        y={y}
        width={barWidth}
        height={barHeight}
        rx={3}
        fill="currentColor"
        className="text-muted/30"
      />
      <rect
        x={x - barWidth / 2}
        y={y}
        width={fillWidth}
        height={barHeight}
        rx={3}
        fill={color}
        fillOpacity={0.8}
      />
      {/* Battery tip */}
      <rect
        x={x + barWidth / 2 + 1}
        y={y + 2}
        width={3}
        height={4}
        rx={1}
        fill="currentColor"
        className="text-muted-foreground/40"
      />
    </g>
  );
}

export function AnimatedEnergyFlow({ data, className }: AnimatedEnergyFlowProps) {
  const demoData: EnergyFlowData = {
    solarPower: 3.2,
    homePower: 0.7,
    batteryPower: -2.5, // discharging
    batteryPercent: 73,
    gridPower: 0,
    evPower: 0.8,
  };

  const flow = data || demoData;

  // Determine flow directions
  const solarToHome = flow.solarPower > 0 && flow.homePower > 0 ? Math.min(flow.solarPower, flow.homePower) : 0;
  const solarToBattery = flow.solarPower > 0 && flow.batteryPower > 0 ? Math.min(flow.solarPower - solarToHome, flow.batteryPower) : 0;
  const batteryToHome = flow.batteryPower < 0 ? Math.abs(flow.batteryPower) : 0;
  const gridToHome = flow.gridPower > 0 ? flow.gridPower : 0;
  const solarToGrid = flow.gridPower < 0 ? Math.abs(flow.gridPower) : 0;
  const solarToEV = flow.evPower > 0 ? flow.evPower : 0;

  // Colors
  const colors = {
    solar: '#F59E0B',
    battery: '#22C55E',
    home: '#F97316',
    grid: '#8B5CF6',
    ev: '#3B82F6',
  };

  // Node positions (centered in viewBox)
  const nodes = {
    solar: { x: 200, y: 50 },
    home: { x: 330, y: 170 },
    battery: { x: 70, y: 300 },
    grid: { x: 330, y: 300 },
    ev: { x: 200, y: 380 },
  };

  return (
    <div className={className}>
      <svg
        viewBox="0 0 400 440"
        className="w-full h-full"
        style={{ maxHeight: '500px' }}
      >
        <defs>
          {/* Glow filter for dots */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Gradient backgrounds */}
          <radialGradient id="solarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={colors.solar} stopOpacity={0.15} />
            <stop offset="100%" stopColor={colors.solar} stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Background solar glow */}
        {flow.solarPower > 0 && (
          <circle cx={nodes.solar.x} cy={nodes.solar.y} r={80} fill="url(#solarGlow)">
            <animate attributeName="r" values="70;85;70" dur="3s" repeatCount="indefinite" />
          </circle>
        )}

        {/* Connection paths */}
        {/* Solar → Home */}
        <path
          id="path-solar-home"
          d={`M${nodes.solar.x},${nodes.solar.y + 30} C${nodes.solar.x + 40},${nodes.solar.y + 80} ${nodes.home.x - 40},${nodes.home.y - 50} ${nodes.home.x},${nodes.home.y - 30}`}
          fill="none"
          stroke={colors.solar}
          strokeWidth={solarToHome > 0 ? 1.5 : 0.5}
          strokeOpacity={solarToHome > 0 ? 0.3 : 0.08}
          strokeDasharray={solarToHome > 0 ? "none" : "4 4"}
        />

        {/* Solar → Battery */}
        <path
          id="path-solar-battery"
          d={`M${nodes.solar.x - 20},${nodes.solar.y + 30} C${nodes.solar.x - 60},${nodes.solar.y + 100} ${nodes.battery.x + 40},${nodes.battery.y - 80} ${nodes.battery.x},${nodes.battery.y - 30}`}
          fill="none"
          stroke={colors.solar}
          strokeWidth={solarToBattery > 0 ? 1.5 : 0.5}
          strokeOpacity={solarToBattery > 0 ? 0.3 : 0.08}
          strokeDasharray={solarToBattery > 0 ? "none" : "4 4"}
        />

        {/* Battery → Home */}
        <path
          id="path-battery-home"
          d={`M${nodes.battery.x + 30},${nodes.battery.y - 10} C${nodes.battery.x + 100},${nodes.battery.y - 60} ${nodes.home.x - 80},${nodes.home.y + 40} ${nodes.home.x - 30},${nodes.home.y + 10}`}
          fill="none"
          stroke={colors.battery}
          strokeWidth={batteryToHome > 0 ? 1.5 : 0.5}
          strokeOpacity={batteryToHome > 0 ? 0.3 : 0.08}
          strokeDasharray={batteryToHome > 0 ? "none" : "4 4"}
        />

        {/* Grid → Home */}
        <path
          id="path-grid-home"
          d={`M${nodes.grid.x},${nodes.grid.y - 30} L${nodes.home.x},${nodes.home.y + 30}`}
          fill="none"
          stroke={colors.grid}
          strokeWidth={gridToHome > 0 ? 1.5 : 0.5}
          strokeOpacity={gridToHome > 0 ? 0.3 : 0.08}
          strokeDasharray={gridToHome > 0 ? "none" : "4 4"}
        />

        {/* Solar → Grid (export) */}
        <path
          id="path-solar-grid"
          d={`M${nodes.solar.x + 30},${nodes.solar.y + 25} C${nodes.solar.x + 80},${nodes.solar.y + 100} ${nodes.grid.x + 20},${nodes.grid.y - 100} ${nodes.grid.x},${nodes.grid.y - 30}`}
          fill="none"
          stroke={colors.grid}
          strokeWidth={solarToGrid > 0 ? 1.5 : 0.5}
          strokeOpacity={solarToGrid > 0 ? 0.3 : 0.08}
          strokeDasharray={solarToGrid > 0 ? "none" : "4 4"}
        />

        {/* Solar/Battery → EV */}
        <path
          id="path-solar-ev"
          d={`M${nodes.solar.x},${nodes.solar.y + 30} C${nodes.solar.x},${nodes.solar.y + 160} ${nodes.ev.x},${nodes.ev.y - 80} ${nodes.ev.x},${nodes.ev.y - 30}`}
          fill="none"
          stroke={colors.ev}
          strokeWidth={solarToEV > 0 ? 1.5 : 0.5}
          strokeOpacity={solarToEV > 0 ? 0.3 : 0.08}
          strokeDasharray={solarToEV > 0 ? "none" : "4 4"}
        />

        {/* Animated flowing dots */}
        <FlowingDots pathId="path-solar-home" color={colors.solar} power={solarToHome} dotCount={4} />
        <FlowingDots pathId="path-solar-battery" color={colors.solar} power={solarToBattery} dotCount={3} />
        <FlowingDots pathId="path-battery-home" color={colors.battery} power={batteryToHome} dotCount={4} />
        <FlowingDots pathId="path-grid-home" color={colors.grid} power={gridToHome} dotCount={3} />
        <FlowingDots pathId="path-solar-grid" color={colors.solar} power={solarToGrid} dotCount={3} />
        <FlowingDots pathId="path-solar-ev" color={colors.ev} power={solarToEV} dotCount={3} />

        {/* Node labels with icons */}
        <NodeLabel
          x={nodes.solar.x}
          y={nodes.solar.y}
          label="Solar"
          value={flow.solarPower}
          color={colors.solar}
          icon={<SolarIcon />}
        />
        <NodeLabel
          x={nodes.home.x}
          y={nodes.home.y}
          label="Home"
          value={flow.homePower}
          color={colors.home}
          icon={<HomeIcon />}
        />
        <NodeLabel
          x={nodes.battery.x}
          y={nodes.battery.y}
          label="Powerwall"
          value={Math.abs(flow.batteryPower)}
          color={colors.battery}
          subLabel={`${flow.batteryPercent}%`}
          icon={<BatteryIcon />}
        />
        <BatteryGauge x={nodes.battery.x} y={nodes.battery.y + 76} percent={flow.batteryPercent} color={colors.battery} />
        
        <NodeLabel
          x={nodes.grid.x}
          y={nodes.grid.y}
          label="Grid"
          value={Math.abs(flow.gridPower)}
          color={colors.grid}
          icon={<GridIcon />}
        />
        <NodeLabel
          x={nodes.ev.x}
          y={nodes.ev.y}
          label="EV"
          value={flow.evPower}
          color={colors.ev}
          icon={<EvIcon />}
        />
      </svg>
    </div>
  );
}

// Simple inline SVG icons for nodes
function SolarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="1" y="6" width="18" height="12" rx="2" ry="2" />
      <line x1="23" y1="13" x2="23" y2="11" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function EvIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2" />
      <circle cx="6.5" cy="16.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </svg>
  );
}
