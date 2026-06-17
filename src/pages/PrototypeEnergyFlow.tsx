/**
 * Prototype v4 — Unified Live Energy Flow Card (Tesla-fidelity, asset-aware)
 * --------------------------------------------------------------------------
 * Adds:
 *   1. 4 hero-render variants swapped by connected-asset state
 *      - default          (Solar + Powerwall + Model Y, dusk)
 *      - no-ev            (Solar + Powerwall, empty driveway, dusk)
 *      - no-battery       (Solar only, clean garage wall, dusk)
 *      - outage           (night, grid-down, Powerwall island mode)
 *   2. KPI overlap fix — Powerwall moved to mid-left, Grid stays bottom-left,
 *      Home top-right, Solar top-left. 12px safe gutters.
 *   3. Multi-Powerwall stacking (1–4 units) via transparent sprite overlay.
 *      5+ caps at 4 with "+N" badge. Aggregate kWh = units × 13.5.
 *   4. Top-right dev segmented control to flip variant + Powerwall count.
 *
 * All hero renders share matched camera, lens, and house geometry so KPI
 * positions and sprite anchors are reusable across variants.
 */

import { useEffect, useMemo, useState } from "react";
import heroDefault from "@/assets/energy-flow-house-hero.jpg";
import heroNoEv from "@/assets/energy-flow-house-hero-no-ev.jpg";
import heroNoBattery from "@/assets/energy-flow-house-hero-no-battery.jpg";
import heroOutage from "@/assets/energy-flow-house-hero-outage.jpg";
import powerwallSprite from "@/assets/powerwall-sprite.png";

type Variant = "default" | "no-ev" | "no-battery" | "outage";

const HEROES: Record<Variant, string> = {
  default: heroDefault,
  "no-ev": heroNoEv,
  "no-battery": heroNoBattery,
  outage: heroOutage,
};

const FIXTURE = {
  homeName: "ZenCasa",
  solar: { kw: 4.8, label: "Producing" },
  home: { kw: 1.7, label: "Drawing" },
  powerwall: { kw: 0.0, soc: 100, label: "Charged" },
  grid: { kw: 3.1, label: "Exporting" },
  ev: { model: "Model Y", soc: 64, kw: 7.2, etaMin: 80, fsd: true },
};

// Powerwall mount anchor on the garage wall (% of hero box)
// Tuned to the existing default render. All variants share geometry.
const PW_ANCHOR = { left: 46, top: 70 }; // center of bottommost unit
const PW_W = 7;   // width as % of hero
const PW_GAP = 0.8; // % gap between units

export default function PrototypeEnergyFlow() {
  const [tick, setTick] = useState(0);
  const [variant, setVariant] = useState<Variant>("default");
  const [pwCount, setPwCount] = useState(1);

  // Dev controls only render when ?dev=1 is in the URL (kept out of production UI)
  const showDev =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("dev") === "1";

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  const wob = (b: number, a = 0.15) => +(b + Math.sin(tick * 1.7) * a).toFixed(1);

  // Derived asset state from variant
  const hasBattery = variant !== "no-battery";
  const hasEV = variant !== "no-ev";
  const isOutage = variant === "outage";

  // KPI values per variant
  const solarKw = isOutage ? 0 : wob(FIXTURE.solar.kw, 0.3);
  const homeKw = wob(FIXTURE.home.kw, 0.2);
  const gridKw = isOutage ? 0 : wob(FIXTURE.grid.kw, 0.3);
  const pwKw = isOutage ? -2.4 : FIXTURE.powerwall.kw;
  const pwSoc = isOutage ? 87 : FIXTURE.powerwall.soc;
  const pwLabel = isOutage ? "Backup" : FIXTURE.powerwall.label;
  const gridLabel = isOutage ? "Offline" : FIXTURE.grid.label;
  const solarLabel = isOutage ? "Standby" : FIXTURE.solar.label;

  // Aggregated Powerwall capacity
  const totalPwKwh = (Math.min(pwCount, 4) * 13.5).toFixed(1);
  const cappedCount = Math.min(pwCount, 4);
  const overflow = pwCount > 4 ? pwCount - 4 : 0;

  // Sprite stack positions relative to anchor (returns array of {leftPct,topPct})
  const spritePositions = useMemo(() => {
    const n = cappedCount;
    const positions: Array<{ left: number; top: number; z: number }> = [];
    if (n === 1) {
      positions.push({ left: PW_ANCHOR.left, top: PW_ANCHOR.top, z: 1 });
    } else if (n === 2) {
      positions.push({ left: PW_ANCHOR.left - (PW_W + PW_GAP) / 2, top: PW_ANCHOR.top, z: 1 });
      positions.push({ left: PW_ANCHOR.left + (PW_W + PW_GAP) / 2, top: PW_ANCHOR.top, z: 1 });
    } else if (n === 3) {
      positions.push({ left: PW_ANCHOR.left - (PW_W + PW_GAP), top: PW_ANCHOR.top, z: 1 });
      positions.push({ left: PW_ANCHOR.left, top: PW_ANCHOR.top, z: 1 });
      positions.push({ left: PW_ANCHOR.left + (PW_W + PW_GAP), top: PW_ANCHOR.top, z: 1 });
    } else {
      // 4 → 2×2
      const dx = (PW_W + PW_GAP) / 2;
      const dy = 7; // vertical row offset in %
      positions.push({ left: PW_ANCHOR.left - dx, top: PW_ANCHOR.top - dy, z: 1 });
      positions.push({ left: PW_ANCHOR.left + dx, top: PW_ANCHOR.top - dy, z: 1 });
      positions.push({ left: PW_ANCHOR.left - dx, top: PW_ANCHOR.top, z: 2 });
      positions.push({ left: PW_ANCHOR.left + dx, top: PW_ANCHOR.top, z: 2 });
    }
    return positions;
  }, [cappedCount]);

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

        {/* Dev controls — only when ?dev=1 (hidden in production) */}
        {showDev && (
          <DevControls
            variant={variant}
            setVariant={setVariant}
            pwCount={pwCount}
            setPwCount={setPwCount}
          />
        )}

        {/* THE CARD — full-bleed render */}
        <article className="relative w-full overflow-hidden" style={{ aspectRatio: "1024 / 1280" }}>
          <img
            src={HEROES[variant]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
          {/* subtle bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-black/70" />
          {isOutage && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 backdrop-blur-md">
              <span className="text-[10px] tracking-[0.22em] text-amber-200 font-semibold">
                GRID OUTAGE · ISLAND MODE
              </span>
            </div>
          )}

          {/* Multi-Powerwall sprite overlay (only when battery present and >1 unit) */}
          {hasBattery && pwCount > 1 && (
            <div className="absolute inset-0 pointer-events-none">
              {spritePositions.map((p, i) => (
                <img
                  key={i}
                  src={powerwallSprite}
                  alt=""
                  className="absolute"
                  style={{
                    left: `${p.left}%`,
                    top: `${p.top}%`,
                    width: `${PW_W}%`,
                    transform: "translate(-50%, -50%)",
                    zIndex: p.z,
                    filter: isOutage
                      ? "drop-shadow(0 0 8px rgba(34,201,138,0.6))"
                      : "drop-shadow(0 4px 10px rgba(0,0,0,0.5))",
                  }}
                />
              ))}
              {overflow > 0 && (
                <div
                  className="absolute px-1.5 py-0.5 rounded bg-emerald-500/90 text-black text-[10px] font-bold tabular-nums"
                  style={{
                    left: `${PW_ANCHOR.left + PW_W}%`,
                    top: `${PW_ANCHOR.top - 6}%`,
                    transform: "translate(-50%, -50%)",
                    fontFamily: "'Sora', sans-serif",
                  }}
                >
                  +{overflow}
                </div>
              )}
            </div>
          )}

          {/* SOLAR — top-left, 12px safe gutter */}
          <Label
            style={{ top: "5%", left: "5%" }}
            label="SOLAR"
            value={`${solarKw.toFixed(1)} kW`}
            sub={solarLabel}
            align="left"
            dot
            dotColor="#f5c84c"
            dimmed={isOutage}
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

          {/* POWERWALL — mid-left (was bottom-left), only when battery present */}
          {hasBattery && (
            <Label
              style={{ top: "44%", left: "5%", transform: "translateY(-50%)" }}
              label={pwCount > 1 ? `POWERWALL ×${pwCount}` : "POWERWALL"}
              value={`${Math.abs(pwKw).toFixed(1)} kW · ${pwSoc}%`}
              sub={`${pwLabel} · ${totalPwKwh} kWh`}
              align="left"
              dot
              dotColor="#22c98a"
            />
          )}

          {/* GRID — bottom-left */}
          <Label
            style={{ bottom: "6%", left: "5%" }}
            label="GRID"
            value={isOutage ? "—" : `${gridKw.toFixed(1)} kW`}
            sub={gridLabel}
            align="left"
            dot
            dotColor={isOutage ? "#ef4444" : "#f5c84c"}
            dimmed={isOutage}
          />

          {/* Powerwall LED pulse — only when battery present (anchored to bottommost unit) */}
          {hasBattery && (
            <span
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${PW_ANCHOR.left}%`,
                top: `${PW_ANCHOR.top + 1.5}%`,
                width: 10,
                height: 10,
                transform: "translate(-50%, -50%)",
                background:
                  "radial-gradient(circle, #22c98a 0%, rgba(34,201,138,0) 70%)",
                animation: `glowpulse ${isOutage ? "1.0s" : "1.8s"} ease-in-out infinite`,
                filter: "blur(0.5px)",
              }}
            />
          )}

          {/* chevron hint */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/40">
            <svg width="22" height="10" viewBox="0 0 22 10">
              <path d="M2 2l9 6 9-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </article>

        {/* Row list */}
        <nav className="bg-black">
          {hasEV && (
            <Row
              icon={<IconBolt />}
              iconBg="#22c98a"
              iconColor="#0a0a0a"
              title={`${FIXTURE.ev.model} · ${isOutage ? "Idle" : "Charging"}`}
              sub={
                isOutage
                  ? `${FIXTURE.ev.soc}% · Charging paused (outage)`
                  : `${FIXTURE.ev.kw.toFixed(1)} kW · ${FIXTURE.ev.soc}% · ETA ${Math.floor(
                      FIXTURE.ev.etaMin / 60
                    )}h ${FIXTURE.ev.etaMin % 60}m`
              }
              badge={FIXTURE.ev.fsd ? "FSD" : undefined}
            />
          )}
          <Row icon={<IconChart />} title="Energy" sub="38.6 kWh Generated Today" />
          <Row icon={<IconLeaf />} title="Impact" sub="74% Self-Powered Today" />
          <Row icon={<IconGear />} title="Settings" sub="3 devices connected" hasDot />
          {hasBattery && (
            <Row icon={<IconShield />} title="Go Off-Grid" sub="Powerwall reserve · 20%" />
          )}
        </nav>
      </div>

      <style>{`
        @keyframes glowpulse { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.7 } 50% { transform: translate(-50%,-50%) scale(1.6); opacity: 1 } }
      `}</style>
    </div>
  );
}

/* ---------- dev controls ---------- */
function DevControls({
  variant,
  setVariant,
  pwCount,
  setPwCount,
}: {
  variant: Variant;
  setVariant: (v: Variant) => void;
  pwCount: number;
  setPwCount: (n: number) => void;
}) {
  const variants: Array<{ key: Variant; label: string }> = [
    { key: "default", label: "All" },
    { key: "no-ev", label: "No EV" },
    { key: "no-battery", label: "No Battery" },
    { key: "outage", label: "Outage" },
  ];
  return (
    <div className="px-3 pb-3 flex flex-col gap-2 bg-black">
      <div className="flex gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
        {variants.map((v) => (
          <button
            key={v.key}
            onClick={() => setVariant(v.key)}
            className={`flex-1 text-[10px] font-semibold tracking-wider uppercase py-1.5 rounded-full transition ${
              variant === v.key ? "bg-emerald-500 text-black" : "text-white/60"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 text-[10px] text-white/50 px-1">
        <span className="tracking-[0.18em] uppercase">Powerwalls</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setPwCount(n)}
              disabled={variant === "no-battery"}
              className={`w-6 h-6 rounded text-[11px] font-semibold tabular-nums transition ${
                pwCount === n
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/60 disabled:opacity-30"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
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
  dimmed = false,
}: {
  style: React.CSSProperties;
  label: string;
  value: string;
  sub?: string;
  align: "left" | "center" | "right";
  dot?: boolean;
  dotColor?: string;
  dimmed?: boolean;
}) {
  const textAlign = align;
  const justify =
    align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";
  return (
    <div
      className="absolute"
      style={{
        ...style,
        textAlign,
        textShadow: "0 2px 14px rgba(0,0,0,0.7)",
        opacity: dimmed ? 0.55 : 1,
      }}
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
