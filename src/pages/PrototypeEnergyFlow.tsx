/**
 * Prototype v5 — Unified Live Energy Flow Card (Production Polish)
 * -----------------------------------------------------------------
 * v5 adds on top of v4:
 *   1. Scene state machine with 6 scenes — precedence:
 *      outage > supercharging > tesla-only > no-battery > no-ev > default
 *   2. Glossy PV panels baked into re-rendered hero images.
 *   3. Wall Connector ALWAYS visible (baked into hero; sprite overlay
 *      in supercharging/tesla-only scenes for control).
 *   4. Cable arc ALWAYS visible when plugged (3 states: unplugged hidden,
 *      plugged-idle muted, charging emerald w/ animated particles).
 *   5. Pull-forward animation on charging (22% → 30%, 1.4s ease-out).
 *   6. Multi-Powerwall 1–5 (5 = 2×2 + 1 above, 6+ = +N badge).
 *   7. Tesla Status Card — hero in tesla-only, secondary elsewhere.
 *   8. Weather sky overlay (clear/clouds/rain/snow/night).
 *   9. Tesla-Only + Supercharging scenes.
 */

import { useEffect, useMemo, useState } from "react";
import heroDefault from "@/assets/energy-flow-house-hero.jpg";
import heroNoEv from "@/assets/energy-flow-house-hero-no-ev.jpg";
import heroNoBattery from "@/assets/energy-flow-house-hero-no-battery.jpg";
import heroOutage from "@/assets/energy-flow-house-hero-outage.jpg";
import heroTeslaOnly from "@/assets/energy-flow-house-hero-tesla-only.jpg";
import heroSupercharger from "@/assets/energy-flow-supercharger-bg.jpg";
import powerwallSprite from "@/assets/powerwall-sprite.png";
import teslaSprite from "@/assets/tesla-model-y-sprite.png";
import wallConnectorSprite from "@/assets/wall-connector-sprite.png";
import { TeslaStatusCard } from "@/components/dashboard/TeslaStatusCard";
import { WeatherSkyOverlay, type Weather } from "@/components/dashboard/WeatherSkyOverlay";

type Scene = "default" | "no-ev" | "no-battery" | "outage" | "tesla-only" | "supercharging";
type ChargeState = "unplugged" | "plugged-idle" | "charging" | "supercharging";

const HEROES: Record<Scene, string> = {
  default: heroDefault,
  "no-ev": heroNoEv,
  "no-battery": heroNoBattery,
  outage: heroOutage,
  "tesla-only": heroTeslaOnly,
  supercharging: heroSupercharger,
};

const FIXTURE = {
  homeName: "ZenCasa",
  solar: { kw: 4.8, label: "Producing" },
  home: { kw: 1.7, label: "Drawing" },
  powerwall: { kw: 0.0, soc: 100, label: "Charged" },
  grid: { kw: 3.1, label: "Exporting" },
  ev: {
    model: "Model Y Performance",
    soc: 64,
    kw: 11.5,
    etaMin: 192,
    fsd: true,
    fsdVersion: "v13.2",
    odometer: 24481,
    range: 198,
  },
  supercharger: {
    location: "Harris Ranch, CA",
    kw: 247,
    targetSoc: 80,
    addedMi: 128,
    etaMin: 12,
  },
};

// Powerwall mount anchor (% of hero box)
const PW_ANCHOR = { left: 16, top: 78 };
const PW_W = 7;
const PW_GAP = 0.8;

// Anchors for car + wall connector + charge port (% of hero box)
const CAR_IDLE = { left: 36, top: 78 };
const CAR_FORWARD = { left: 44, top: 80 };
const WC_ANCHOR = { left: 82, top: 66 };

export default function PrototypeEnergyFlow() {
  const [tick, setTick] = useState(0);
  const [scene, setScene] = useState<Scene>("default");
  const [pwCount, setPwCount] = useState(1);
  const [chargeState, setChargeState] = useState<ChargeState>("charging");
  const [weather, setWeather] = useState<Weather>("clear");
  const [soc, setSoc] = useState(FIXTURE.ev.soc);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  const wob = (b: number, a = 0.15) => +(b + Math.sin(tick * 1.7) * a).toFixed(1);

  // Derived
  const isOutage = scene === "outage";
  const isSupercharging = scene === "supercharging";
  const isTeslaOnly = scene === "tesla-only";
  const hasBattery = scene !== "no-battery" && !isSupercharging && !isTeslaOnly;
  const hasEV = scene !== "no-ev";
  const hasSolar = !isSupercharging && !isTeslaOnly;
  const hasGrid = !isSupercharging && !isTeslaOnly;

  // Effective charge state per scene
  const effectiveCharge: ChargeState = isSupercharging
    ? "supercharging"
    : isOutage
      ? "unplugged"
      : chargeState;

  // KPI values
  const solarKw = isOutage ? 0 : wob(FIXTURE.solar.kw, 0.3);
  const homeKw = wob(FIXTURE.home.kw, 0.2);
  const gridKw = isOutage ? 0 : wob(FIXTURE.grid.kw, 0.3);
  const pwKw = isOutage ? -2.4 : FIXTURE.powerwall.kw;
  const pwSoc = isOutage ? 87 : FIXTURE.powerwall.soc;
  const pwLabel = isOutage ? "Backup" : FIXTURE.powerwall.label;
  const gridLabel = isOutage ? "Offline" : FIXTURE.grid.label;
  const solarLabel = isOutage ? "Standby" : FIXTURE.solar.label;

  const totalPwKwh = (Math.min(pwCount, 5) * 13.5).toFixed(1);
  const cappedCount = Math.min(pwCount, 5);
  const overflow = pwCount > 5 ? pwCount - 5 : 0;

  // Multi-PW sprite positions (1–5)
  const spritePositions = useMemo(() => {
    const n = cappedCount;
    const positions: Array<{ left: number; top: number; z: number }> = [];
    const dx = (PW_W + PW_GAP) / 2;
    const dy = 6;
    if (n === 1) {
      positions.push({ left: PW_ANCHOR.left, top: PW_ANCHOR.top, z: 1 });
    } else if (n === 2) {
      positions.push({ left: PW_ANCHOR.left - dx, top: PW_ANCHOR.top, z: 1 });
      positions.push({ left: PW_ANCHOR.left + dx, top: PW_ANCHOR.top, z: 1 });
    } else if (n === 3) {
      positions.push({ left: PW_ANCHOR.left - (PW_W + PW_GAP), top: PW_ANCHOR.top, z: 1 });
      positions.push({ left: PW_ANCHOR.left, top: PW_ANCHOR.top, z: 1 });
      positions.push({ left: PW_ANCHOR.left + (PW_W + PW_GAP), top: PW_ANCHOR.top, z: 1 });
    } else if (n === 4) {
      positions.push({ left: PW_ANCHOR.left - dx, top: PW_ANCHOR.top - dy, z: 1 });
      positions.push({ left: PW_ANCHOR.left + dx, top: PW_ANCHOR.top - dy, z: 1 });
      positions.push({ left: PW_ANCHOR.left - dx, top: PW_ANCHOR.top, z: 2 });
      positions.push({ left: PW_ANCHOR.left + dx, top: PW_ANCHOR.top, z: 2 });
    } else {
      // 5 → 2×2 + 1 centered above
      positions.push({ left: PW_ANCHOR.left, top: PW_ANCHOR.top - dy * 2, z: 1 });
      positions.push({ left: PW_ANCHOR.left - dx, top: PW_ANCHOR.top - dy, z: 1 });
      positions.push({ left: PW_ANCHOR.left + dx, top: PW_ANCHOR.top - dy, z: 1 });
      positions.push({ left: PW_ANCHOR.left - dx, top: PW_ANCHOR.top, z: 2 });
      positions.push({ left: PW_ANCHOR.left + dx, top: PW_ANCHOR.top, z: 2 });
    }
    return positions;
  }, [cappedCount]);

  // Car position — pull forward when charging
  const isCharging = effectiveCharge === "charging";
  const carPos = isSupercharging
    ? { left: 50, top: 60 }
    : isTeslaOnly
      ? { left: 50, top: 70 }
      : isCharging
        ? CAR_FORWARD
        : CAR_IDLE;

  // Status card visibility/variant
  const showStatusCard = hasEV && !isOutage;
  const statusVariant: "hero" | "secondary" = isTeslaOnly ? "hero" : "secondary";

  // Cable visibility — only fully hidden if unplugged or supercharging
  const cableVisible = hasEV && (effectiveCharge === "plugged-idle" || effectiveCharge === "charging");

  // Effective weather (outage forces night)
  const effectiveWeather: Weather = isOutage ? "night" : weather;

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
            <span className="text-white text-[22px] font-medium tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
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

        <DevControls
          scene={scene} setScene={setScene}
          pwCount={pwCount} setPwCount={setPwCount}
          chargeState={chargeState} setChargeState={setChargeState}
          weather={weather} setWeather={setWeather}
          soc={soc} setSoc={setSoc}
        />

        {/* THE CARD */}
        <article className="relative w-full overflow-hidden" style={{ aspectRatio: "1024 / 1280" }}>
          <img
            src={HEROES[scene]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />

          {/* Weather sky overlay */}
          <WeatherSkyOverlay weather={effectiveWeather} />

          {/* bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-black/70" />

          {/* Top banners */}
          {isOutage && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 backdrop-blur-md">
              <span className="text-[10px] tracking-[0.22em] text-amber-200 font-semibold">
                GRID OUTAGE · ISLAND MODE
              </span>
            </div>
          )}
          {isSupercharging && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-orange-500/25 border border-orange-400/50 backdrop-blur-md">
              <span className="text-[10px] tracking-[0.22em] text-orange-200 font-semibold">
                📍 {FIXTURE.supercharger.location}
              </span>
            </div>
          )}

          {/* Multi-Powerwall sprite overlay (only when battery present + >1) */}
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
                    top: `${PW_ANCHOR.top - 10}%`,
                    transform: "translate(-50%, -50%)",
                    fontFamily: "'Sora', sans-serif",
                  }}
                >
                  +{overflow}
                </div>
              )}
            </div>
          )}

          {/* Wall Connector sprite overlay — only in tesla-only / supercharging where bg has it small/none */}
          {isTeslaOnly && (
            <img
              src={wallConnectorSprite}
              alt=""
              className="absolute pointer-events-none"
              style={{
                left: "70%", top: "44%",
                width: "5%",
                transform: "translate(-50%, -50%)",
                opacity: 0.85,
                filter: cableVisible
                  ? "drop-shadow(0 0 8px rgba(34,201,138,0.6))"
                  : "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
              }}
            />
          )}

          {/* Tesla car sprite (default/no-battery/tesla-only/supercharging scenes) */}
          {hasEV && (
            <img
              src={teslaSprite}
              alt=""
              className="absolute pointer-events-none"
              style={{
                left: `${carPos.left}%`,
                top: `${carPos.top}%`,
                width: isTeslaOnly ? "78%" : isSupercharging ? "72%" : "42%",
                transform: "translate(-50%, -50%)",
                transition: "left 1.4s cubic-bezier(0.4,0,0.2,1), top 1.4s cubic-bezier(0.4,0,0.2,1), width 0.6s ease",
                filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.6))",
                zIndex: 3,
              }}
            />
          )}

          {/* Cable arc — always visible when plugged */}
          {cableVisible && !isTeslaOnly && !isSupercharging && (
            <CableArc
              from={WC_ANCHOR}
              to={{ left: carPos.left + 8, top: carPos.top - 2 }}
              state={effectiveCharge === "charging" ? "charging" : "plugged-idle"}
            />
          )}
          {cableVisible && isTeslaOnly && (
            <CableArc
              from={{ left: 70, top: 44 }}
              to={{ left: carPos.left + 10, top: carPos.top - 4 }}
              state={effectiveCharge === "charging" ? "charging" : "plugged-idle"}
            />
          )}

          {/* Supercharging amber flow from off-canvas right */}
          {isSupercharging && (
            <SuperchargerFlow to={{ left: carPos.left + 18, top: carPos.top - 2 }} />
          )}

          {/* KPI Labels */}
          {hasSolar && (
            <Label
              style={{ top: "5%", left: "5%" }}
              label="SOLAR"
              value={`${solarKw.toFixed(1)} kW`}
              sub={solarLabel}
              align="left" dot dotColor="#f5c84c" dimmed={isOutage}
            />
          )}
          {!isSupercharging && (
            <Label
              style={{ top: "5%", right: "5%" }}
              label="HOME"
              value={`${homeKw.toFixed(1)} kW`}
              sub={FIXTURE.home.label}
              align="right" dot dotColor="#7ce0ff"
            />
          )}
          {hasBattery && (
            <Label
              style={{ top: "44%", left: "5%", transform: "translateY(-50%)" }}
              label={pwCount > 1 ? `POWERWALL ×${pwCount}` : "POWERWALL"}
              value={`${Math.abs(pwKw).toFixed(1)} kW · ${pwSoc}%`}
              sub={`${pwLabel} · ${totalPwKwh} kWh`}
              align="left" dot dotColor="#22c98a"
            />
          )}
          {hasGrid && (
            <Label
              style={{ bottom: "6%", left: "5%" }}
              label="GRID"
              value={isOutage ? "—" : `${gridKw.toFixed(1)} kW`}
              sub={gridLabel}
              align="left" dot dotColor={isOutage ? "#ef4444" : "#f5c84c"} dimmed={isOutage}
            />
          )}

          {/* Supercharging KPI strip */}
          {isSupercharging && (
            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center text-center px-4">
              <div className="text-orange-300 text-[10px] tracking-[0.22em] font-semibold mb-1">SUPERCHARGING</div>
              <div className="text-white text-[34px] font-semibold tabular-nums leading-none" style={{ fontFamily: "'Sora', sans-serif" }}>
                {FIXTURE.supercharger.kw} kW
              </div>
              <div className="flex gap-4 mt-2 text-[12px] text-white/80 tabular-nums">
                <span>SOC {soc}% → {FIXTURE.supercharger.targetSoc}%</span>
                <span className="text-orange-300">+{FIXTURE.supercharger.addedMi} mi</span>
                <span>ETA {FIXTURE.supercharger.etaMin}m</span>
              </div>
            </div>
          )}

          {/* Powerwall LED pulse */}
          {hasBattery && (
            <span
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${PW_ANCHOR.left}%`,
                top: `${PW_ANCHOR.top + 1.5}%`,
                width: 10, height: 10,
                transform: "translate(-50%, -50%)",
                background: "radial-gradient(circle, #22c98a 0%, rgba(34,201,138,0) 70%)",
                animation: `glowpulse ${isOutage ? "1.0s" : "1.8s"} ease-in-out infinite`,
                filter: "blur(0.5px)",
              }}
            />
          )}

          {/* chevron */}
          {!isSupercharging && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/40">
              <svg width="22" height="10" viewBox="0 0 22 10">
                <path d="M2 2l9 6 9-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </article>

        {/* Tesla Status Card */}
        {showStatusCard && (
          <TeslaStatusCard
            variant={statusVariant}
            model={FIXTURE.ev.model}
            fsdInstalled={FIXTURE.ev.fsd}
            fsdVersion={FIXTURE.ev.fsdVersion}
            soc={soc}
            odometerMi={FIXTURE.ev.odometer}
            rangeMi={FIXTURE.ev.range}
            chargingKw={
              isSupercharging
                ? FIXTURE.supercharger.kw
                : effectiveCharge === "charging" ? FIXTURE.ev.kw : undefined
            }
            etaMin={
              isSupercharging
                ? FIXTURE.supercharger.etaMin
                : effectiveCharge === "charging" ? FIXTURE.ev.etaMin : undefined
            }
            state={effectiveCharge}
          />
        )}

        {/* Row list */}
        <nav className="bg-black">
          <Row icon={<IconChart />} title="Energy" sub="38.6 kWh Generated Today" />
          <Row icon={<IconLeaf />} title="Impact" sub="74% Self-Powered Today" />
          <Row icon={<IconGear />} title="Settings" sub="3 devices connected" hasDot />
          {hasBattery && <Row icon={<IconShield />} title="Go Off-Grid" sub="Powerwall reserve · 20%" />}
        </nav>
      </div>

      <style>{`
        @keyframes glowpulse { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.7 } 50% { transform: translate(-50%,-50%) scale(1.6); opacity: 1 } }
        @keyframes cableflow { from { stroke-dashoffset: 0 } to { stroke-dashoffset: -20 } }
      `}</style>
    </div>
  );
}

/* ---------- cable arc ---------- */
function CableArc({
  from, to, state,
}: {
  from: { left: number; top: number };
  to: { left: number; top: number };
  state: "plugged-idle" | "charging";
}) {
  // quadratic bezier with sag
  const midX = (from.left + to.left) / 2;
  const midY = Math.max(from.top, to.top) + 6;
  const d = `M ${from.left} ${from.top} Q ${midX} ${midY} ${to.left} ${to.top}`;
  const charging = state === "charging";
  const color = charging ? "#22c98a" : "#7ce0ff";
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ zIndex: 4, overflow: "visible" }}
    >
      <defs>
        <filter id="cable-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={charging ? "1.2" : "0.6"} />
        </filter>
        <path id="cable-arc-path" d={d} />
      </defs>
      {/* Outer glow */}
      <path
        d={d}
        stroke={color}
        strokeOpacity={charging ? 0.5 : 0.25}
        strokeWidth={charging ? 2.4 : 1.6}
        fill="none"
        strokeLinecap="round"
        filter="url(#cable-glow)"
        vectorEffect="non-scaling-stroke"
      />
      {/* Core cable */}
      <path
        d={d}
        stroke={color}
        strokeOpacity={charging ? 0.95 : 0.45}
        strokeWidth={charging ? 0.8 : 0.55}
        fill="none"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Animated particles (charging only) */}
      {charging && Array.from({ length: 3 }).map((_, i) => (
        <circle key={i} r={0.7} fill="#a7f3d0" vectorEffect="non-scaling-stroke">
          <animateMotion dur="1.2s" repeatCount="indefinite" begin={`${i * 0.4}s`}>
            <mpath href="#cable-arc-path" />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.8;1" dur="1.2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* ---------- supercharger flow ---------- */
function SuperchargerFlow({ to }: { to: { left: number; top: number } }) {
  const d = `M 110 ${to.top - 5} Q 80 ${to.top + 4} ${to.left} ${to.top}`;
  return (
    <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 4, overflow: "visible" }}>
      <defs>
        <path id="sc-path" d={d} />
        <filter id="sc-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" /></filter>
      </defs>
      <path d={d} stroke="#ff8a3d" strokeOpacity={0.55} strokeWidth={3} fill="none" strokeLinecap="round" filter="url(#sc-glow)" vectorEffect="non-scaling-stroke" />
      <path d={d} stroke="#ffb066" strokeOpacity={0.95} strokeWidth={0.9} fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {Array.from({ length: 4 }).map((_, i) => (
        <circle key={i} r={0.9} fill="#ffd9a8" vectorEffect="non-scaling-stroke">
          <animateMotion dur="1.0s" repeatCount="indefinite" begin={`${i * 0.25}s`}>
            <mpath href="#sc-path" />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.8;1" dur="1.0s" begin={`${i * 0.25}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* ---------- dev controls ---------- */
function DevControls({
  scene, setScene, pwCount, setPwCount,
  chargeState, setChargeState, weather, setWeather, soc, setSoc,
}: {
  scene: Scene; setScene: (s: Scene) => void;
  pwCount: number; setPwCount: (n: number) => void;
  chargeState: ChargeState; setChargeState: (s: ChargeState) => void;
  weather: Weather; setWeather: (w: Weather) => void;
  soc: number; setSoc: (n: number) => void;
}) {
  const scenes: Array<{ key: Scene; label: string }> = [
    { key: "default", label: "All" },
    { key: "no-ev", label: "No EV" },
    { key: "no-battery", label: "No Bat" },
    { key: "outage", label: "Outage" },
    { key: "tesla-only", label: "Tesla" },
    { key: "supercharging", label: "Super" },
  ];
  const charges: Array<{ key: ChargeState; label: string }> = [
    { key: "unplugged", label: "Unplug" },
    { key: "plugged-idle", label: "Idle" },
    { key: "charging", label: "Charge" },
  ];
  const weathers: Weather[] = ["clear", "clouds", "rain", "snow", "night"];
  return (
    <div className="px-3 pb-3 flex flex-col gap-2 bg-black">
      <div className="grid grid-cols-6 gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
        {scenes.map((v) => (
          <button key={v.key} onClick={() => setScene(v.key)}
            className={`text-[9px] font-semibold tracking-wider uppercase py-1.5 rounded-full transition ${
              scene === v.key ? "bg-emerald-500 text-black" : "text-white/60"
            }`}>{v.label}</button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
        {charges.map((c) => (
          <button key={c.key} onClick={() => setChargeState(c.key)}
            disabled={scene === "supercharging" || scene === "outage"}
            className={`text-[9px] font-semibold tracking-wider uppercase py-1.5 rounded-full transition ${
              chargeState === c.key ? "bg-cyan-400 text-black" : "text-white/60 disabled:opacity-30"
            }`}>{c.label}</button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 text-[10px] text-white/50 px-1">
        <span className="tracking-[0.18em] uppercase">PW</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button key={n} onClick={() => setPwCount(n)} disabled={scene === "no-battery" || scene === "supercharging" || scene === "tesla-only"}
              className={`w-6 h-6 rounded text-[10px] font-semibold tabular-nums transition ${
                pwCount === n ? "bg-white text-black" : "bg-white/5 text-white/60 disabled:opacity-30"
              }`}>{n}</button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 text-[10px] text-white/50 px-1">
        <span className="tracking-[0.18em] uppercase">Wx</span>
        <div className="flex gap-1">
          {weathers.map((w) => (
            <button key={w} onClick={() => setWeather(w)}
              className={`px-2 h-6 rounded text-[10px] font-semibold uppercase transition ${
                weather === w ? "bg-white text-black" : "bg-white/5 text-white/60"
              }`}>{w}</button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-white/50 px-1">
        <span className="tracking-[0.18em] uppercase">SOC</span>
        <input type="range" min={0} max={100} value={soc} onChange={(e) => setSoc(+e.target.value)} className="flex-1 accent-emerald-400" />
        <span className="tabular-nums w-8 text-right text-white/80">{soc}%</span>
      </div>
    </div>
  );
}

/* ---------- floating label ---------- */
function Label({
  style, label, value, sub, align, dot = false, dotColor = "#22c98a", dimmed = false,
}: {
  style: React.CSSProperties;
  label: string; value: string; sub?: string;
  align: "left" | "center" | "right";
  dot?: boolean; dotColor?: string; dimmed?: boolean;
}) {
  const justify = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";
  return (
    <div className="absolute" style={{ ...style, textAlign: align, textShadow: "0 2px 14px rgba(0,0,0,0.7)", opacity: dimmed ? 0.55 : 1, zIndex: 5 }}>
      <div className={`flex items-center gap-1.5 mb-1 ${justify}`}>
        {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />}
        <span className="text-[10px] text-white/70 font-medium tracking-[0.22em]">{label}</span>
      </div>
      <div className="text-white text-[24px] leading-none font-medium tabular-nums tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>{value}</div>
      {sub && <div className="text-[11px] text-white/60 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ---------- row list ---------- */
function Row({
  icon, iconBg = "rgba(255,255,255,0.08)", iconColor = "rgba(255,255,255,0.7)",
  title, sub, hasDot = false, badge,
}: {
  icon: React.ReactNode; iconBg?: string; iconColor?: string;
  title: string; sub: string; hasDot?: boolean; badge?: string;
}) {
  return (
    <button className="w-full flex items-center gap-4 px-4 py-3.5 border-b border-white/[0.06] active:bg-white/[0.03] transition-colors">
      <div className="relative w-9 h-9 rounded-full flex items-center justify-center" style={{ background: iconBg, color: iconColor }}>
        {icon}
        {hasDot && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#3b82f6]" />}
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="text-white text-[15px] font-semibold tracking-tight leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>{title}</span>
          {badge && <span className="px-1.5 py-0.5 rounded bg-[#22c98a]/20 border border-[#22c98a]/40 text-[9px] font-bold uppercase text-[#22c98a] tracking-wider">{badge}</span>}
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
    <path d="M3 14V8m4 6V5m4 9v-7m4 7v-4" />
  </svg>
);
const IconLeaf = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 4c0 6-4 10-10 10 0-6 4-10 10-10z" /><path d="M4 14L10 8" />
  </svg>
);
const IconGear = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="9" r="2.5" /><path d="M9 1v3M9 14v3M1 9h3M14 9h3M3.5 3.5l2.1 2.1M12.4 12.4l2.1 2.1M3.5 14.5l2.1-2.1M12.4 5.6l2.1-2.1" />
  </svg>
);
const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 1l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V4l7-3z" />
  </svg>
);

const FontLoader = () => (
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap" rel="stylesheet" />
);
