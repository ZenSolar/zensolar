/**
 * Prototype v2 — Unified Live Energy Flow Card (Tesla-app fidelity)
 * -----------------------------------------------------------------
 * Full-bleed 3D hero render + corner KPIs with leader lines + animated
 * energy conduits anchored to architectural features. Includes Model Y
 * + Wallbox + FSD chip — our differentiator over Tesla's card.
 *
 * Lift this whole file into the remix at
 * src/features/cockpit/LiveEnergyFlowCard/. Hero asset:
 * src/assets/energy-flow-house-hero.jpg
 */

import { useEffect, useState } from "react";
import heroHouse from "@/assets/energy-flow-house-hero.jpg";

/* ---------- fixture ---------- */
const FIXTURE = {
  homeName: "ZenCasa",
  solar: { kw: 4.8, label: "Producing" },
  home: { kw: 1.7, label: "Drawing" },
  powerwall: { kw: 0.0, soc: 100, label: "Charged" },
  grid: { kw: 3.1, direction: "export" as const, label: "Exporting" },
  ev: { model: "Model Y", soc: 64, kw: 7.2, etaMin: 80, fsd: true },
};

/* ---------- page ---------- */
export default function PrototypeEnergyFlow() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  const wob = (b: number, a = 0.15) => +(b + Math.sin(tick * 1.7) * a).toFixed(1);
  const solarKw = wob(FIXTURE.solar.kw, 0.3);
  const homeKw = wob(FIXTURE.home.kw, 0.2);
  const gridKw = wob(FIXTURE.grid.kw, 0.3);
  const evKw = wob(FIXTURE.ev.kw, 0.2);

  return (
    <div
      className="min-h-screen w-full bg-black text-white flex justify-center"
      style={{ fontFamily: "'Manrope', system-ui, sans-serif" }}
    >
      <FontLoader />

      <div className="w-full max-w-[420px] flex flex-col">
        {/* Header — Tesla style: home name + chat + menu */}
        <header className="flex items-center justify-between px-5 pt-5 pb-3 bg-black">
          <button className="flex items-center gap-1.5">
            <span
              className="text-white text-[22px] font-medium tracking-tight"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {FIXTURE.homeName}
            </span>
            <svg width="14" height="14" viewBox="0 0 14 14" className="text-white/60">
              <path d="M3 5l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex items-center gap-4 text-white/80">
            <IconChat />
            <IconMenu />
          </div>
        </header>

        {/* THE CARD — full-bleed render + overlays */}
        <article className="relative w-full" style={{ aspectRatio: "1024 / 1280" }}>
          {/* 3D hero render */}
          <img
            src={heroHouse}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
          {/* subtle bottom fade so the row list reads cleanly */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-black/80" />

          {/* Energy conduit overlay (anchored to architectural features) */}
          <ConduitOverlay
            solarOn={solarKw > 0.3}
            evOn={evKw > 0.3}
            gridExport={FIXTURE.grid.direction === "export" && gridKw > 0.2}
          />

          {/* 4 KPI corner labels with leader lines */}
          <KpiCorner
            placement="top-left"
            label="SOLAR"
            value={`${solarKw.toFixed(1)} kW`}
            sub={FIXTURE.solar.label}
            /* leader to roof solar panels */
            leaderTo={{ x: 56, y: 47 }}
            anchor={{ x: 22, y: 14 }}
          />
          <KpiCorner
            placement="top-right"
            label="HOME"
            value={`${homeKw.toFixed(1)} kW`}
            sub={FIXTURE.home.label}
            dot
            /* leader through window */
            leaderTo={{ x: 80, y: 70 }}
            anchor={{ x: 78, y: 14 }}
          />
          <KpiCorner
            placement="bottom-left"
            label="POWERWALL"
            value={`${FIXTURE.powerwall.kw.toFixed(1)} kW · ${FIXTURE.powerwall.soc}%`}
            sub={FIXTURE.powerwall.label}
            dotColor="#22c98a"
            dot
            /* leader to Powerwall green LED strip */
            leaderTo={{ x: 48, y: 76 }}
            anchor={{ x: 22, y: 90 }}
          />
          <KpiCorner
            placement="bottom-right"
            label="GRID"
            value={`${gridKw.toFixed(1)} kW`}
            sub={FIXTURE.grid.label}
            dotColor="#f5c84c"
            dot
            /* leader to ground/grid line */
            leaderTo={{ x: 64, y: 85 }}
            anchor={{ x: 78, y: 90 }}
          />

          {/* EV chip — our differentiator, anchored to Model Y */}
          <EVChip
            soc={FIXTURE.ev.soc}
            kw={evKw}
            etaMin={FIXTURE.ev.etaMin}
            fsd={FIXTURE.ev.fsd}
            /* anchored above the car */
            anchor={{ x: 18, y: 80 }}
            leaderTo={{ x: 22, y: 86 }}
          />

          {/* tiny chevron hint at the very bottom */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/40">
            <svg width="20" height="10" viewBox="0 0 20 10">
              <path d="M2 2l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </article>

        {/* Tesla-style row list below */}
        <nav className="bg-black px-1">
          <Row icon={<IconChart />} title="Energy" sub="38.6 kWh Generated Today" />
          <Row icon={<IconLeaf />} title="Impact" sub="74% Self-Powered Today" />
          <Row icon={<IconBolt />} title="EV · Model Y" sub={`Charging · 64% · ETA 1h 20m`} />
          <Row icon={<IconGear />} title="Settings" sub="3 devices connected" hasDot />
          <Row icon={<IconShield />} title="Go Off-Grid" sub="Powerwall reserve · 20%" />
        </nav>
      </div>

      <style>{`
        @keyframes pulseflow { to { stroke-dashoffset: -32; } }
        @keyframes pulseflow-rev { to { stroke-dashoffset: 32; } }
        @keyframes glowpulse { 0%,100% { opacity: 0.55 } 50% { opacity: 1 } }
        @keyframes leaderdraw { from { stroke-dashoffset: 60 } to { stroke-dashoffset: 0 } }
      `}</style>
    </div>
  );
}

/* ---------- KPI corner with leader line ---------- */
function KpiCorner({
  placement,
  label,
  value,
  sub,
  dot = false,
  dotColor = "#22c98a",
  leaderTo,
  anchor,
}: {
  placement: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  label: string;
  value: string;
  sub?: string;
  dot?: boolean;
  dotColor?: string;
  leaderTo: { x: number; y: number }; // % within the card
  anchor: { x: number; y: number };   // % within the card (label anchor pt)
}) {
  const isRight = placement.includes("right");
  const isBottom = placement.includes("bottom");
  return (
    <>
      {/* leader line as SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line
          x1={anchor.x}
          y1={anchor.y}
          x2={leaderTo.x}
          y2={leaderTo.y}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="0.18"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="60"
          style={{ animation: "leaderdraw 900ms ease-out forwards" }}
        />
        <circle cx={leaderTo.x} cy={leaderTo.y} r="0.5" fill="white" vectorEffect="non-scaling-stroke" />
      </svg>

      {/* the label */}
      <div
        className={`absolute px-3 ${isRight ? "text-right" : "text-left"}`}
        style={{
          top: isBottom ? undefined : "3.5%",
          bottom: isBottom ? "16%" : undefined,
          left: isRight ? undefined : "4%",
          right: isRight ? "4%" : undefined,
        }}
      >
        <div
          className={`flex items-center gap-1.5 ${isRight ? "justify-end" : ""} mb-0.5`}
        >
          {dot && !isRight && (
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
          )}
          <span
            className="text-[10px] text-white/65 font-medium tracking-[0.18em]"
          >
            {label}
          </span>
          {dot && isRight && (
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
          )}
        </div>
        <div
          className="text-white text-[26px] leading-none font-medium tabular-nums tracking-tight"
          style={{ fontFamily: "'Sora', sans-serif", textShadow: "0 2px 12px rgba(0,0,0,0.55)" }}
        >
          {value}
        </div>
        {sub && (
          <div className="text-[11px] text-white/55 mt-0.5">{sub}</div>
        )}
      </div>
    </>
  );
}

/* ---------- EV chip ---------- */
function EVChip({
  soc,
  kw,
  etaMin,
  fsd,
  anchor,
  leaderTo,
}: {
  soc: number;
  kw: number;
  etaMin: number;
  fsd: boolean;
  anchor: { x: number; y: number };
  leaderTo: { x: number; y: number };
}) {
  return (
    <>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line
          x1={anchor.x}
          y1={anchor.y}
          x2={leaderTo.x}
          y2={leaderTo.y}
          stroke="rgba(124,224,255,0.7)"
          strokeWidth="0.22"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={leaderTo.x} cy={leaderTo.y} r="0.6" fill="#7ce0ff" vectorEffect="non-scaling-stroke" />
      </svg>

      <div
        className="absolute left-[4%]"
        style={{ top: `${anchor.y - 6}%` }}
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7ce0ff]" style={{ animation: "glowpulse 1.6s ease-in-out infinite" }} />
          <span className="text-[10px] text-white/65 font-medium tracking-[0.18em]">MODEL Y</span>
        </div>
        <div
          className="text-white text-[20px] leading-none font-medium tabular-nums tracking-tight"
          style={{ fontFamily: "'Sora', sans-serif", textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}
        >
          {kw.toFixed(1)} kW
        </div>
        <div className="text-[11px] text-white/65 mt-0.5">
          {soc}% · ETA {Math.floor(etaMin / 60)}h {etaMin % 60}m
        </div>
        {fsd && (
          <span className="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded bg-[#22c98a]/20 border border-[#22c98a]/40">
            <span className="w-1 h-1 rounded-full bg-[#22c98a]" />
            <span className="text-[9px] font-bold uppercase text-[#22c98a] tracking-wider">FSD</span>
          </span>
        )}
      </div>
    </>
  );
}

/* ---------- conduit overlay (animated amber pulses) ---------- */
function ConduitOverlay({
  solarOn,
  evOn,
  gridExport,
}: {
  solarOn: boolean;
  evOn: boolean;
  gridExport: boolean;
}) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {/* solar panel → eave → wall conduit → Powerwall */}
      <path
        id="conduit-pv"
        d="M58 50 L 50 60 L 42 73 L 47 78"
        fill="none"
        stroke="#f5c84c"
        strokeWidth="0.45"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        strokeDasharray="2 4"
        opacity={solarOn ? 0.95 : 0.2}
        style={{ animation: "pulseflow 1.3s linear infinite" }}
      />
      {/* Powerwall → ground → grid */}
      <path
        d="M48 80 L 55 86 L 66 86"
        fill="none"
        stroke="#f5c84c"
        strokeWidth="0.45"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        strokeDasharray="2 4"
        opacity={gridExport ? 0.85 : 0.15}
        style={{ animation: "pulseflow-rev 1.6s linear infinite" }}
      />
      {/* Wallbox → Model Y charging cable */}
      <path
        d="M40 84 L 32 88 L 24 90"
        fill="none"
        stroke="#7ce0ff"
        strokeWidth="0.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        strokeDasharray="2 3"
        opacity={evOn ? 0.95 : 0.2}
        style={{ animation: "pulseflow 1.1s linear infinite" }}
      />
      {/* Powerwall LED glow halo */}
      <circle
        cx="47"
        cy="76"
        r="1.2"
        fill="#22c98a"
        opacity="0.7"
        vectorEffect="non-scaling-stroke"
        style={{ animation: "glowpulse 2s ease-in-out infinite" }}
      />
    </svg>
  );
}

/* ---------- row list ---------- */
function Row({
  icon,
  title,
  sub,
  hasDot = false,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  hasDot?: boolean;
}) {
  return (
    <button className="w-full flex items-center gap-4 px-4 py-3.5 border-b border-white/[0.06] active:bg-white/[0.03] transition-colors">
      <div className="relative w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center text-white/70">
        {icon}
        {hasDot && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#3b82f6]" />}
      </div>
      <div className="flex-1 text-left">
        <div
          className="text-white text-[16px] font-semibold tracking-tight leading-tight"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          {title}
        </div>
        <div className="text-[12px] text-white/45 leading-tight mt-0.5">{sub}</div>
      </div>
      <svg width="10" height="14" viewBox="0 0 10 14" className="text-white/35">
        <path d="M2 2l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/* ---------- icons ---------- */
const IconChat = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12.5a8.5 8.5 0 1 1-3.4-6.8" /><circle cx="7" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="11" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const IconMenu = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M4 7h14M4 12h14M4 17h14" />
  </svg>
);
const IconChart = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 13l4-4 3 3 6-7" /><path d="M11 5h4v4" />
  </svg>
);
const IconLeaf = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3c-7 0-12 4-12 9 0 2 1 3 2 3 5 0 10-5 10-12z" /><path d="M3 15c2-4 5-7 9-9" />
  </svg>
);
const IconBolt = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2L3 11h5l-1 5 7-9h-5z" />
  </svg>
);
const IconGear = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="9" cy="9" r="2.5" /><path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.5 3.5l1.5 1.5M13 13l1.5 1.5M3.5 14.5L5 13M13 5l1.5-1.5" strokeLinecap="round" />
  </svg>
);
const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
    <path d="M9 2l6 2v5c0 4-3 6-6 7-3-1-6-3-6-7V4l6-2z" /><path d="M6 9l2 2 4-4" />
  </svg>
);

/* ---------- font loader ---------- */
function FontLoader() {
  useEffect(() => {
    const id = "remix-font-soram";
    if (document.getElementById(id)) return;
    const l = document.createElement("link");
    l.id = id;
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap";
    document.head.appendChild(l);
  }, []);
  return null;
}
