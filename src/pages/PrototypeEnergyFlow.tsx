/**
 * Prototype — Unified Live Energy Flow Card (REMIX preview)
 * ---------------------------------------------------------
 * Self-contained. Fixture data only. Direction C "Stacked Flow" locked.
 * Lift this whole file into the remix at src/features/cockpit/LiveEnergyFlowCard/.
 *
 * Demonstrates:
 *  - 3D-perspective animated flow lines with traveling particles
 *  - Radial 4-segment energy distribution ring around the house
 *  - Tap-any-node 24h drawer with sparkline + KPIs
 *  - Asset-aware glyphs (solar panels on roof, Powerwall unit, Model Y silhouette)
 *  - Live-data feel (numbers wobble every 4s)
 */

import { useEffect, useMemo, useState } from "react";

/* ---------- fixture ---------- */
const FIXTURE = {
  solar: { kw: 5.4, oem: "Enphase", panels: 20 },
  battery: { soc: 87, kw: 2.1, oem: "Tesla Powerwall", direction: "in" as const },
  grid: { kw: 0.0, state: "balanced" as const },
  house: { kw: 3.4 },
  ev: {
    model: "Model Y",
    trim: "Long Range",
    color: "#f5f5f7",
    accent: "#0b0d12",
    soc: 64,
    range: 210,
    kw: 7.2,
    etaMin: 80,
    mode: "Charging" as const,
    fsd: true,
    oem: "Tesla Wallbox",
  },
};

const sparklineFor = (seed: number) =>
  Array.from({ length: 24 }, (_, i) =>
    50 + Math.sin((i + seed) * 0.6) * 28 + Math.cos((i + seed) * 0.3) * 14
  );

/* ---------- page ---------- */
export default function PrototypeEnergyFlow() {
  const [tick, setTick] = useState(0);
  const [drawer, setDrawer] = useState<null | "solar" | "battery" | "grid" | "ev">(null);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  // tiny live wobble
  const wob = (base: number, amp = 0.15) =>
    +(base + Math.sin(tick * 1.7) * amp).toFixed(1);

  const solarKw = wob(FIXTURE.solar.kw, 0.4);
  const houseKw = wob(FIXTURE.house.kw, 0.3);
  const evKw = wob(FIXTURE.ev.kw, 0.2);
  const battKw = wob(FIXTURE.battery.kw, 0.25);

  const totalFlow = Math.max(solarKw + Math.abs(battKw) + Math.abs(FIXTURE.grid.kw) + evKw, 0.1);
  const segs = [
    { key: "solar", color: "#22c98a", pct: solarKw / totalFlow },
    { key: "battery", color: "#4ade80", pct: Math.abs(battKw) / totalFlow },
    { key: "grid", color: "#f5c84c", pct: Math.abs(FIXTURE.grid.kw) / totalFlow + 0.05 },
    { key: "ev", color: "#7ce0ff", pct: evKw / totalFlow },
  ];

  return (
    <div className="min-h-screen w-full bg-[#05070a] text-white flex justify-center px-3 py-6"
         style={{ fontFamily: "'Manrope', system-ui, sans-serif" }}>
      <FontLoader />

      <div className="w-full max-w-[393px] flex flex-col gap-4">
        {/* Hero card */}
        <article
          className="relative overflow-hidden rounded-[32px] border bg-[#0a0f1e]"
          style={{
            borderColor: "rgba(34, 201, 138, 0.22)",
            boxShadow:
              "0 30px 60px -30px rgba(34, 201, 138, 0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Header */}
          <header className="px-6 pt-6 pb-2 flex justify-between items-start">
            <div>
              <h2
                className="text-[#22c98a] text-xs font-bold tracking-widest uppercase mb-1"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                ZenEnergy Monitoring
              </h2>
              <div className="flex items-center gap-2">
                <LivePulse />
                <span className="text-white/90 text-sm font-semibold tracking-tight">
                  Home Energy Cockpit
                </span>
              </div>
            </div>
            <div className="bg-[#22c98a]/10 border border-[#22c98a]/30 px-3 py-1 rounded-full">
              <span className="text-[#22c98a] text-[10px] font-bold tracking-tighter uppercase">
                LIVE
              </span>
            </div>
          </header>

          {/* Solar node (top) */}
          <button
            onClick={() => setDrawer("solar")}
            className="relative z-10 w-full flex flex-col items-center mt-4 mb-2 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                Solar
              </span>
              <span className="px-1.5 py-0.5 bg-white/5 rounded text-[8px] text-white/60 border border-white/10 uppercase tracking-wider">
                {FIXTURE.solar.oem}
              </span>
            </div>
            <div
              className="text-4xl font-bold text-white tracking-tighter tabular-nums"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {solarKw.toFixed(1)}
              <span className="text-lg ml-1 text-[#22c98a]">kW</span>
            </div>
            <div className="text-[10px] text-[#4ade80] font-medium">Producing at Peak</div>
          </button>

          {/* Central schematic */}
          <div className="relative w-full h-[260px] flex items-center justify-center">
            {/* 3D-perspective flow layer */}
            <FlowLayer
              solarOn={solarKw > 0.3}
              battOn={Math.abs(battKw) > 0.2}
              evOn={evKw > 0.3}
              gridImporting={FIXTURE.grid.kw > 0.2}
            />

            {/* Battery node (left, floating) */}
            <button
              onClick={() => setDrawer("battery")}
              className="absolute left-3 top-[40%] -translate-y-1/2 z-20 active:scale-[0.97] transition-transform"
            >
              <GlassCard>
                <div className="flex items-center gap-1.5 justify-end mb-0.5">
                  <span className="text-[8px] text-white/40 font-bold uppercase">Tesla</span>
                  <BatteryGlyph soc={FIXTURE.battery.soc} />
                </div>
                <div className="text-sm font-bold text-white tracking-tight tabular-nums">
                  {FIXTURE.battery.soc}
                  <span className="text-[10px] text-[#4ade80] ml-0.5">%</span>
                </div>
                <div className="text-[9px] text-[#4ade80] font-medium tabular-nums">
                  +{battKw.toFixed(1)} kW
                </div>
              </GlassCard>
            </button>

            {/* Grid node (right, floating) */}
            <button
              onClick={() => setDrawer("grid")}
              className="absolute right-3 top-[40%] -translate-y-1/2 z-20 active:scale-[0.97] transition-transform"
            >
              <GlassCard>
                <div className="text-[8px] text-white/40 font-bold uppercase">Grid</div>
                <div className="text-sm font-bold text-white tracking-tight tabular-nums">
                  {FIXTURE.grid.kw.toFixed(1)}
                  <span className="text-[10px] text-white/40 ml-0.5">kW</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1 h-1 rounded-full bg-[#f5c84c]" />
                  <span className="text-[9px] text-[#f5c84c] capitalize">{FIXTURE.grid.state}</span>
                </div>
              </GlassCard>
            </button>

            {/* House + radial ring + asset glyphs */}
            <div className="relative z-10 flex items-center justify-center">
              <RadialRing segs={segs} />
              <HouseGlyph hasPanels panels={FIXTURE.solar.panels} houseKw={houseKw} />
            </div>
          </div>

          {/* EV node (bottom) */}
          <div className="px-5 pb-5 mt-2">
            <button
              onClick={() => setDrawer("ev")}
              className="relative w-full active:scale-[0.99] transition-transform text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#22c98a]/10 to-transparent rounded-2xl" />
              <div
                className="relative rounded-2xl p-4 border border-white/10"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <EVGlyph color={FIXTURE.ev.color} accent={FIXTURE.ev.accent} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-bold text-sm tracking-tight">
                          {FIXTURE.ev.model}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-[#4ade80]/20 text-[#4ade80] rounded font-bold uppercase tracking-tight">
                          {FIXTURE.ev.mode}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40">
                        {FIXTURE.ev.trim} • {FIXTURE.ev.oem}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-lg font-bold text-white tracking-tighter tabular-nums"
                      style={{ fontFamily: "'Sora', sans-serif" }}
                    >
                      {evKw.toFixed(1)}
                      <span className="text-xs text-[#22c98a] ml-1">kW</span>
                    </div>
                    <div className="text-[10px] text-[#4ade80] font-medium italic">
                      ETA {Math.floor(FIXTURE.ev.etaMin / 60)}h {FIXTURE.ev.etaMin % 60}m
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                  <div
                    className="absolute h-full bg-gradient-to-r from-[#22c98a] to-[#4ade80] rounded-full"
                    style={{ width: `${FIXTURE.ev.soc}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${FIXTURE.ev.soc}%`,
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                      animation: "shimmer 2.4s linear infinite",
                    }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    <Stat label="Battery" value={`${FIXTURE.ev.soc}%`} />
                    <Stat label="Range" value={`${FIXTURE.ev.range} mi`} />
                  </div>
                  {FIXTURE.ev.fsd && (
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-[#22c98a]/10 rounded-lg border border-[#22c98a]/30">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c98a] opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#22c98a]" />
                      </span>
                      <span className="text-[10px] text-[#22c98a] font-bold uppercase tracking-tight">
                        FSD Engaged
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <footer className="px-6 pb-5 pt-2 flex justify-between border-t border-white/5">
            <Stat label="Solar Daily" value="38.6 kWh" />
            <Stat label="Saved Today" value={<span className="text-[#4ade80]">$12.45</span>} alignRight />
          </footer>
        </article>

        {/* Hint */}
        <p className="text-center text-[11px] text-white/40">
          Tap any node — Solar, Battery, Grid, EV — to open the 24h drawer
        </p>
      </div>

      {/* Drawer */}
      {drawer && <Drawer kind={drawer} onClose={() => setDrawer(null)} />}

      {/* keyframes (scoped via style tag) */}
      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes dashflow { to { stroke-dashoffset: -40; } }
        @keyframes dashflow-rev { to { stroke-dashoffset: 40; } }
        @keyframes ringspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes drawer-in { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

/* ---------- tiny atoms ---------- */
function FontLoader() {
  useEffect(() => {
    const id = "remix-font-soram";
    if (document.getElementById(id)) return;
    const l = document.createElement("link");
    l.id = id;
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap";
    document.head.appendChild(l);
  }, []);
  return null;
}

function LivePulse() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4ade80]" />
    </span>
  );
}

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border border-white/10 p-2 text-right"
      style={{
        background: "rgba(10,15,30,0.65)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 4px 18px -8px rgba(34,201,138,0.25)",
      }}
    >
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  alignRight = false,
}: {
  label: string;
  value: React.ReactNode;
  alignRight?: boolean;
}) {
  return (
    <div className={`flex flex-col ${alignRight ? "items-end text-right" : ""}`}>
      <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">{label}</span>
      <span className="text-sm text-white font-semibold tracking-tight tabular-nums">{value}</span>
    </div>
  );
}

/* ---------- radial 4-segment ring ---------- */
function RadialRing({ segs }: { segs: { key: string; color: string; pct: number }[] }) {
  const R = 78;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg
      className="absolute"
      width="186"
      height="186"
      viewBox="0 0 186 186"
      style={{ filter: "drop-shadow(0 0 12px rgba(34,201,138,0.25))" }}
    >
      <circle cx="93" cy="93" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
      {segs.map((s) => {
        const len = Math.max(s.pct * C - 4, 2);
        const dash = `${len} ${C - len}`;
        const el = (
          <circle
            key={s.key}
            cx="93"
            cy="93"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={dash}
            strokeDashoffset={-offset}
            transform="rotate(-90 93 93)"
            style={{ transition: "stroke-dasharray 600ms ease, stroke-dashoffset 600ms ease" }}
          />
        );
        offset += s.pct * C;
        return el;
      })}
    </svg>
  );
}

/* ---------- house glyph (asset-aware) ---------- */
function HouseGlyph({
  hasPanels,
  panels,
  houseKw,
}: {
  hasPanels: boolean;
  panels: number;
  houseKw: number;
}) {
  const rows = 2;
  const cols = Math.max(4, Math.ceil(panels / rows));
  return (
    <div className="relative w-[112px] h-[112px] flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="roof" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#1a2435" />
            <stop offset="1" stopColor="#0e1525" />
          </linearGradient>
          <linearGradient id="wall" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#141c2d" />
            <stop offset="1" stopColor="#0a0f1e" />
          </linearGradient>
        </defs>
        {/* Body */}
        <rect x="22" y="48" width="56" height="38" rx="2" fill="url(#wall)" stroke="rgba(34,201,138,0.35)" strokeWidth="0.6" />
        {/* Roof */}
        <polygon points="18,50 50,26 82,50" fill="url(#roof)" stroke="rgba(34,201,138,0.4)" strokeWidth="0.6" />
        {/* Door */}
        <rect x="44" y="64" width="12" height="22" fill="#0a0f1e" stroke="rgba(34,201,138,0.4)" strokeWidth="0.5" />
        <circle cx="54" cy="76" r="0.8" fill="#22c98a" />
        {/* Windows */}
        <rect x="28" y="56" width="10" height="8" fill="#22c98a" opacity="0.18" />
        <rect x="62" y="56" width="10" height="8" fill="#22c98a" opacity="0.18" />
        {/* Solar panels on roof */}
        {hasPanels &&
          Array.from({ length: rows * cols }).slice(0, panels).map((_, i) => {
            const r = Math.floor(i / cols);
            const c = i % cols;
            const w = 36 / cols;
            const h = 4.5;
            const x = 32 + c * w;
            const y = 32 + r * (h + 0.6);
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={w - 0.6}
                height={h}
                fill="#0a3b5a"
                stroke="#4ade80"
                strokeWidth="0.25"
              />
            );
          })}
      </svg>
      {/* Usage chip */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#0a0f1e] border border-[#22c98a]/40">
        <span className="text-[9px] font-bold text-white tabular-nums tracking-tighter"
              style={{ fontFamily: "'Sora', sans-serif" }}>
          {houseKw.toFixed(1)}<span className="text-[#22c98a] ml-0.5">kW</span>
        </span>
      </div>
    </div>
  );
}

/* ---------- battery glyph ---------- */
function BatteryGlyph({ soc }: { soc: number }) {
  return (
    <span className="inline-block w-4 h-2 border border-[#4ade80]/60 rounded-[1px] relative">
      <span
        className="absolute inset-y-0 left-0 bg-[#4ade80] rounded-[1px]"
        style={{ width: `${soc}%`, transition: "width 600ms ease" }}
      />
    </span>
  );
}

/* ---------- EV glyph (Model Y silhouette, color-aware) ---------- */
function EVGlyph({ color, accent }: { color: string; accent: string }) {
  return (
    <div
      className="w-11 h-11 rounded-lg flex items-center justify-center border border-[#22c98a]/30"
      style={{ background: "#0a0f1e" }}
    >
      <svg viewBox="0 0 48 24" className="w-9 h-9">
        {/* Body */}
        <path
          d="M3 16 C 5 10, 10 6, 18 6 L 30 6 C 38 6, 43 10, 45 16 L 45 18 L 3 18 Z"
          fill={color}
          stroke={accent}
          strokeWidth="0.6"
        />
        {/* Window */}
        <path d="M12 11 L 19 7 L 30 7 L 36 11 Z" fill={accent} opacity="0.55" />
        {/* Wheels */}
        <circle cx="13" cy="18" r="3" fill={accent} />
        <circle cx="13" cy="18" r="1.2" fill="#4ade80" />
        <circle cx="35" cy="18" r="3" fill={accent} />
        <circle cx="35" cy="18" r="1.2" fill="#4ade80" />
      </svg>
    </div>
  );
}

/* ---------- flow lines + traveling particles (3D perspective) ---------- */
function FlowLayer({
  solarOn,
  battOn,
  evOn,
  gridImporting,
}: {
  solarOn: boolean;
  battOn: boolean;
  evOn: boolean;
  gridImporting: boolean;
}) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 360 260"
      style={{ transform: "perspective(800px) rotateX(10deg)", transformOrigin: "center 65%" }}
    >
      <defs>
        <linearGradient id="g-solar" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#22c98a" stopOpacity="0" />
          <stop offset="0.5" stopColor="#22c98a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#22c98a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="g-batt" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#4ade80" stopOpacity="0" />
          <stop offset="0.5" stopColor="#4ade80" stopOpacity="0.85" />
          <stop offset="1" stopColor="#4ade80" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="g-grid" x1="1" x2="0" y1="0" y2="0">
          <stop offset="0" stopColor="#f5c84c" stopOpacity="0" />
          <stop offset="0.5" stopColor="#f5c84c" stopOpacity="0.7" />
          <stop offset="1" stopColor="#f5c84c" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="g-ev" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7ce0ff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#7ce0ff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#7ce0ff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Solar → House (top center, downward) */}
      <path id="path-solar" d="M180 -10 C 180 50, 180 80, 180 130" fill="none" stroke="url(#g-solar)" strokeWidth="2" />
      <path d="M180 -10 C 180 50, 180 80, 180 130" fill="none" stroke="#22c98a" strokeWidth="1.2"
            strokeDasharray="4 8" opacity={solarOn ? 0.8 : 0.15}
            style={{ animation: "dashflow 1.4s linear infinite" }} />

      {/* Battery → House */}
      <path id="path-batt" d="M70 130 C 110 130, 140 130, 180 130" fill="none" stroke="url(#g-batt)" strokeWidth="2" />
      <path d="M70 130 C 110 130, 140 130, 180 130" fill="none" stroke="#4ade80" strokeWidth="1.2"
            strokeDasharray="4 8" opacity={battOn ? 0.8 : 0.2}
            style={{ animation: "dashflow 1.6s linear infinite" }} />

      {/* Grid ↔ House */}
      <path id="path-grid" d="M290 130 C 250 130, 220 130, 180 130" fill="none" stroke="url(#g-grid)" strokeWidth="2" />
      <path d="M290 130 C 250 130, 220 130, 180 130" fill="none" stroke="#f5c84c" strokeWidth="1.2"
            strokeDasharray="4 8" opacity={gridImporting ? 0.7 : 0.15}
            style={{ animation: "dashflow-rev 2s linear infinite" }} />

      {/* House → EV (downward) */}
      <path id="path-ev" d="M180 130 C 180 180, 180 220, 180 280" fill="none" stroke="url(#g-ev)" strokeWidth="2" />
      <path d="M180 130 C 180 180, 180 220, 180 280" fill="none" stroke="#7ce0ff" strokeWidth="1.2"
            strokeDasharray="4 8" opacity={evOn ? 0.85 : 0.2}
            style={{ animation: "dashflow 1.3s linear infinite" }} />

      {/* Traveling particles */}
      {solarOn &&
        [0, 0.5, 1].map((delay) => (
          <circle key={`ps-${delay}`} r="2.2" fill="#22c98a">
            <animateMotion dur="1.6s" repeatCount="indefinite" begin={`${delay}s`}>
              <mpath href="#path-solar" />
            </animateMotion>
          </circle>
        ))}
      {battOn &&
        [0, 0.7].map((delay) => (
          <circle key={`pb-${delay}`} r="2" fill="#4ade80">
            <animateMotion dur="1.8s" repeatCount="indefinite" begin={`${delay}s`}>
              <mpath href="#path-batt" />
            </animateMotion>
          </circle>
        ))}
      {evOn &&
        [0, 0.6, 1.2].map((delay) => (
          <circle key={`pe-${delay}`} r="2.4" fill="#7ce0ff">
            <animateMotion dur="1.4s" repeatCount="indefinite" begin={`${delay}s`}>
              <mpath href="#path-ev" />
            </animateMotion>
          </circle>
        ))}
    </svg>
  );
}

/* ---------- 24h drawer ---------- */
function Drawer({
  kind,
  onClose,
}: {
  kind: "solar" | "battery" | "grid" | "ev";
  onClose: () => void;
}) {
  const meta = {
    solar: { title: "Solar Production", oem: "Enphase IQ8+", color: "#22c98a", today: "38.6 kWh", peak: "6.1 kW @ 12:42", source: 12 },
    battery: { title: "Powerwall Storage", oem: "Tesla Powerwall 2", color: "#4ade80", today: "+18.2 kWh in / 6.4 kWh out", peak: "SOC 87%", source: 3 },
    grid: { title: "Grid Exchange", oem: "PG&E Utility", color: "#f5c84c", today: "0.4 kWh net export", peak: "Balanced", source: 7 },
    ev: { title: "Model Y · Wallbox", oem: "Tesla Wallbox Gen 3", color: "#7ce0ff", today: "Charging session: +12.4 kWh", peak: "ETA 1h 20m · 64% → 100%", source: 21 },
  }[kind];

  const data = useMemo(() => sparklineFor(meta.source), [meta.source]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70"
      style={{ animation: "fade-in 180ms ease-out" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] rounded-t-[28px] border-t border-x bg-[#0a0f1e] p-5 pb-8"
        style={{
          borderColor: `${meta.color}55`,
          boxShadow: `0 -20px 60px -20px ${meta.color}40`,
          animation: "drawer-in 260ms cubic-bezier(0.2, 0.9, 0.2, 1)",
          fontFamily: "'Manrope', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />

        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-white text-lg font-bold tracking-tight"
                style={{ fontFamily: "'Sora', sans-serif" }}>
              {meta.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold"
                    style={{ background: `${meta.color}1f`, color: meta.color, border: `1px solid ${meta.color}55` }}>
                {meta.oem}
              </span>
              <span className="text-[10px] text-white/40">Last 24 hours</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm"
          >
            ✕
          </button>
        </div>

        <Sparkline data={data} color={meta.color} />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <DrawerStat label="Today" value={meta.today} color={meta.color} />
          <DrawerStat label="Peak / Status" value={meta.peak} color={meta.color} />
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl py-3 text-sm font-bold text-[#05070a]"
          style={{ background: meta.color }}
        >
          View Full History →
        </button>
      </div>
    </div>
  );
}

function DrawerStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[9px] uppercase font-bold tracking-widest text-white/40 mb-1">{label}</div>
      <div className="text-sm font-semibold text-white tabular-nums leading-tight" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 320;
  const H = 90;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / (max - min || 1)) * (H - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `0,${H} ${pts} ${W},${H}`;
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[90px]">
        <defs>
          <linearGradient id={`spark-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.4" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#spark-${color})`} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="absolute top-2 right-3 text-[9px] uppercase tracking-widest text-white/40 font-bold">
        24h
      </div>
    </div>
  );
}
