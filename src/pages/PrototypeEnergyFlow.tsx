/**
 * Prototype v3 — Unified Live Energy Flow Card (Tesla-app fidelity)
 * -----------------------------------------------------------------
 * Full-bleed 3D hero render + minimal floating labels positioned NEAR
 * (not on) the architectural feature. Matches the actual Tesla app
 * Energy card. Our differentiator: Model Y + FSD live in the row list,
 * not as an overlay (preserves the cinematic feel of the hero).
 *
 * Hero asset: src/assets/energy-flow-house-hero.jpg
 */

import { useEffect, useState } from "react";
import heroHouse from "@/assets/energy-flow-house-hero.jpg";

const FIXTURE = {
  homeName: "ZenCasa",
  solar: { kw: 4.8, label: "Producing" },
  home: { kw: 1.7, label: "Drawing" },
  powerwall: { kw: 0.0, soc: 100, label: "Charged" },
  grid: { kw: 3.1, label: "Exporting" },
  ev: { model: "Model Y", soc: 64, kw: 7.2, etaMin: 80, fsd: true },
};

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

  return (
    <div
      className="min-h-screen w-full bg-black text-white flex justify-center"
      style={{ fontFamily: "'Manrope', system-ui, sans-serif" }}
    >
      <FontLoader />

      <div className="w-full max-w-[420px] flex flex-col">
        {/* Header */}
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

        {/* THE CARD — full-bleed render */}
        <article className="relative w-full overflow-hidden" style={{ aspectRatio: "1024 / 1280" }}>
          <img
            src={heroHouse}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
          {/* subtle bottom fade only */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-black/70" />

          {/* SOLAR — top center-left (above roof panels) */}
          <Label
            style={{ top: "5%", left: "38%", transform: "translateX(-50%)" }}
            label="SOLAR"
            value={`${solarKw.toFixed(1)} kW`}
            sub={FIXTURE.solar.label}
            align="center"
          />

          {/* HOME — top right */}
          <Label
            style={{ top: "5%", right: "5%" }}
            label="HOME"
            value={`${homeKw.toFixed(1)} kW`}
            sub={FIXTURE.home.label}
            align="right"
            dot
            dotColor="#7ce0ff"
          />

          {/* POWERWALL — bottom left, just below the wall unit */}
          <Label
            style={{ bottom: "20%", left: "5%" }}
            label="POWERWALL"
            value={`${FIXTURE.powerwall.kw.toFixed(1)} kW · ${FIXTURE.powerwall.soc}%`}
            sub={FIXTURE.powerwall.label}
            align="left"
            dot
            dotColor="#22c98a"
          />

          {/* GRID — bottom right */}
          <Label
            style={{ bottom: "20%", right: "5%" }}
            label="GRID"
            value={`${gridKw.toFixed(1)} kW`}
            sub={FIXTURE.grid.label}
            align="right"
            dot
            dotColor="#f5c84c"
          />

          {/* Powerwall LED pulse (anchored to the green strip on the wall unit) */}
          <span
            className="absolute rounded-full"
            style={{
              left: "45.5%",
              top: "73.5%",
              width: 10,
              height: 10,
              background: "radial-gradient(circle, #22c98a 0%, rgba(34,201,138,0) 70%)",
              animation: "glowpulse 1.8s ease-in-out infinite",
              filter: "blur(0.5px)",
            }}
          />

          {/* tiny chevron hint */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/40">
            <svg width="22" height="10" viewBox="0 0 22 10">
              <path d="M2 2l9 6 9-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </article>

        {/* Row list — EV / Energy / Impact / Settings / Off-Grid */}
        <nav className="bg-black">
          <Row
            icon={<IconBolt />}
            iconBg="#22c98a"
            iconColor="#0a0a0a"
            title="Model Y · Charging"
            sub={`${FIXTURE.ev.kw.toFixed(1)} kW · ${FIXTURE.ev.soc}% · ETA ${Math.floor(FIXTURE.ev.etaMin/60)}h ${FIXTURE.ev.etaMin%60}m`}
            badge={FIXTURE.ev.fsd ? "FSD" : undefined}
          />
          <Row icon={<IconChart />} title="Energy" sub="38.6 kWh Generated Today" />
          <Row icon={<IconLeaf />} title="Impact" sub="74% Self-Powered Today" />
          <Row icon={<IconGear />} title="Settings" sub="3 devices connected" hasDot />
          <Row icon={<IconShield />} title="Go Off-Grid" sub="Powerwall reserve · 20%" />
        </nav>
      </div>

      <style>{`
        @keyframes glowpulse { 0%,100% { transform: scale(1); opacity: 0.7 } 50% { transform: scale(1.6); opacity: 1 } }
      `}</style>
    </div>
  );
}

/* ---------- floating label ---------- */
function Label({
  style,
  label,
  value,
  sub,
  align,
  dot = false,
  dotColor = "#22c98a",
}: {
  style: React.CSSProperties;
  label: string;
  value: string;
  sub?: string;
  align: "left" | "center" | "right";
  dot?: boolean;
  dotColor?: string;
}) {
  const textAlign = align;
  const justify =
    align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";
  return (
    <div
      className="absolute"
      style={{ ...style, textAlign, textShadow: "0 2px 14px rgba(0,0,0,0.7)" }}
    >
      <div className={`flex items-center gap-1.5 mb-1 ${justify}`}>
        {dot && (
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }}
          />
        )}
        <span className="text-[10px] text-white/70 font-medium tracking-[0.22em]">{label}</span>
      </div>
      <div
        className="text-white text-[26px] leading-none font-medium tabular-nums tracking-tight"
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-white/60 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ---------- row list ---------- */
function Row({
  icon,
  iconBg = "rgba(255,255,255,0.08)",
  iconColor = "rgba(255,255,255,0.7)",
  title,
  sub,
  hasDot = false,
  badge,
}: {
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  title: string;
  sub: string;
  hasDot?: boolean;
  badge?: string;
}) {
  return (
    <button className="w-full flex items-center gap-4 px-4 py-3.5 border-b border-white/[0.06] active:bg-white/[0.03] transition-colors">
      <div
        className="relative w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
        {hasDot && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#3b82f6]" />}
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span
            className="text-white text-[16px] font-semibold tracking-tight leading-tight"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {title}
          </span>
          {badge && (
            <span className="px-1.5 py-0.5 rounded bg-[#22c98a]/20 border border-[#22c98a]/40 text-[9px] font-bold uppercase text-[#22c98a] tracking-wider">
              {badge}
            </span>
          )}
        </div>
        <div className="text-[12px] text-white/50 leading-tight mt-0.5">{sub}</div>
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
  <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" stroke="none">
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
