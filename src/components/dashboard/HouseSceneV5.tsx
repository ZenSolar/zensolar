/**
 * HouseSceneV5 — Phase 1 of the v5 scene rebuild.
 *
 * Pure-SVG, deterministic isometric-feel house silhouette drawn in the same
 * 0–100 viewBox the overlay halos & flow paths use. No PNG dependency, so
 * the geometry, scale, and anchor map are owned by code.
 *
 * Goals (per user feedback that prior v5 felt unchanged):
 *   • Big readable house silhouette filling the scene.
 *   • Large lit windows (~3× prior render).
 *   • Real garage opening sized to host the dynamic Tesla.
 *   • Driveway slab leading out to the carPark anchor.
 *   • Roof plane reserved for solar shimmer.
 *
 * Anchors below MUST match the constants in HomeBlueprint.ts. Both files are
 * tuned together; if you move geometry here, update the blueprint.
 */
import { memo } from 'react';
import type { SceneKey } from './EnergyFlowScene';

interface Props {
  scene: SceneKey;
  homeActive?: boolean;
  solarActive?: boolean;
  garageOpen?: boolean;
  /** v5 Phase 4 — Open-Meteo WMO weather code to tint sky + add precip. */
  weatherCode?: number | null;
}

function HouseSceneV5Inner({ scene, homeActive, solarActive, garageOpen, weatherCode }: Props) {
  const isNight = scene === 'night' || scene === 'night-ev';
  const wx = weatherCode ?? null;
  // Derive weather flags (Open-Meteo WMO).
  const isOvercast = wx === 3;
  const isPartlyCloudy = wx === 2;
  const isFog = wx != null && wx >= 45 && wx <= 48;
  const isDrizzleOrRain =
    wx != null && ((wx >= 51 && wx <= 67) || (wx >= 80 && wx <= 82));
  const isSnow = wx != null && wx >= 71 && wx <= 86;
  const isStorm = wx != null && wx >= 95;
  const isRain = scene === 'rain' || isDrizzleOrRain || isStorm;


  // Palette per scene — kept design-token-adjacent (slate/primary).
  // Weather modulates day sky: overcast/fog warm grey, storm deep violet, snow pale.
  let skyTop = isNight ? '#06090f' : '#0e1626';
  let skyBot = isNight ? '#020306' : '#050912';
  if (!isNight) {
    if (isStorm) { skyTop = '#1a1430'; skyBot = '#0a0814'; }
    else if (isRain) { skyTop = '#1a2230'; skyBot = '#0a0f17'; }
    else if (isFog) { skyTop = '#2a2f38'; skyBot = '#10141a'; }
    else if (isOvercast) { skyTop = '#1d242f'; skyBot = '#0a0f17'; }
    else if (isSnow) { skyTop = '#2a3344'; skyBot = '#0f1622'; }
    else if (isPartlyCloudy) { skyTop = '#152038'; skyBot = '#060a16'; }
  }

  const ground = isNight ? '#070b14' : '#0b1322';
  const wallFront = isNight ? '#1a2236' : '#2a3550';
  const wallSide = isNight ? '#121a2c' : '#1d2740';
  const roof = isNight ? '#0a0f1c' : '#141d31';
  const trim = isNight ? '#2a3754' : '#3b4a6b';
  const windowOn = '#ffd47a';
  const windowOff = isNight ? '#0c1322' : '#1b243a';
  const garageInner = garageOpen ? '#3a2a14' : '#06090f';

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className="absolute inset-x-0 top-1/2 mx-auto h-[88%] w-auto max-w-[98%] -translate-y-1/2 select-none drop-shadow-[0_24px_40px_hsl(220_70%_3%/0.55)]"
      style={{ aspectRatio: '1 / 1' }}
    >
      <defs>
        <linearGradient id="hv5-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="100%" stopColor={skyBot} />
        </linearGradient>
        <linearGradient id="hv5-roof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={roof} />
          <stop offset="100%" stopColor={wallSide} />
        </linearGradient>
        <linearGradient id="hv5-wallF" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={wallFront} />
          <stop offset="100%" stopColor={wallSide} />
        </linearGradient>
        <linearGradient id="hv5-drive" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2235" />
          <stop offset="100%" stopColor={ground} />
        </linearGradient>
        <radialGradient id="hv5-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={windowOn} stopOpacity="0.85" />
          <stop offset="100%" stopColor={windowOn} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hv5-solar" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f1d3a" />
          <stop offset="100%" stopColor="#1d3260" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="100" height="84" fill="url(#hv5-sky)" />

      {/* Ground / lawn */}
      <rect x="0" y="80" width="100" height="20" fill={ground} />
      <ellipse cx="50" cy="92" rx="55" ry="6" fill="#000" opacity="0.35" />

      {/* Driveway slab — leads from garage opening out to carPark */}
      <polygon
        points="3,96 38,96 34,68 8,68"
        fill="url(#hv5-drive)"
        stroke={trim}
        strokeWidth="0.25"
        opacity="0.95"
      />
      {/* Driveway center seam */}
      <line x1="21" y1="68" x2="21" y2="96" stroke={trim} strokeWidth="0.2" strokeDasharray="1 1.4" opacity="0.45" />

      {/* ─── House: roof ─── */}
      {/* Main pitched roof spanning garage + living block */}
      <polygon
        points="4,42 50,16 96,42 90,46 50,22 10,46"
        fill="url(#hv5-roof)"
        stroke={trim}
        strokeWidth="0.3"
      />
      {/* Roof shadow band */}
      <polygon points="10,46 50,22 90,46 90,49 50,25 10,49" fill="#000" opacity="0.35" />

      {/* Solar array on front roof slope (left half of roof) */}
      <g opacity={solarActive ? 1 : 0.75}>
        <polygon points="20,38 50,21 50,30 26,42" fill="url(#hv5-solar)" stroke="#2a3f6c" strokeWidth="0.25" />
        {/* Panel cell grid */}
        {Array.from({ length: 4 }).map((_, row) =>
          Array.from({ length: 5 }).map((_, col) => (
            <rect
              key={`p-${row}-${col}`}
              x={22 + col * 5.4}
              y={23 + row * 4.5}
              width="4.6"
              height="3.6"
              fill="#11203e"
              stroke="#2c4170"
              strokeWidth="0.15"
              transform={`skewX(${-18 + row * 1.2})`}
              opacity="0.85"
            />
          )),
        )}
      </g>

      {/* ─── Garage block (left) ─── */}
      <rect x="4" y="46" width="36" height="34" fill="url(#hv5-wallF)" stroke={trim} strokeWidth="0.3" />
      {/* Garage opening (the Tesla parks here) */}
      <rect
        x="7"
        y="50"
        width="30"
        height="26"
        rx="1.5"
        fill={garageInner}
        stroke={trim}
        strokeWidth="0.35"
      />
      {garageOpen && (
        <rect x="7" y="50" width="30" height="26" rx="1.5" fill="url(#hv5-glow)" opacity="0.55" />
      )}
      {/* Garage door header trim */}
      <rect x="6" y="48" width="32" height="2.2" fill={trim} opacity="0.9" />

      {/* ─── Living block (right) ─── */}
      <rect x="40" y="42" width="56" height="38" fill="url(#hv5-wallF)" stroke={trim} strokeWidth="0.3" />
      {/* Side wall sliver for depth */}
      <polygon points="96,42 99,46 99,80 96,80" fill={wallSide} stroke={trim} strokeWidth="0.25" />

      {/* Front door (recessed) */}
      <rect x="44" y="58" width="8" height="22" fill="#0a0f1c" stroke={trim} strokeWidth="0.3" />
      <rect x="45.2" y="60" width="5.6" height="18" fill={trim} opacity="0.4" />
      <circle cx="50.4" cy="69" r="0.5" fill="#cfa14b" />

      {/* ─── Lit windows cluster (BIG — was the main complaint) ─── */}
      {/* 2x2 grid of large warm panes filling right half of living block */}
      {(() => {
        const winsActive = homeActive ?? true;
        const fill = winsActive ? windowOn : windowOff;
        const panes: Array<{ x: number; y: number }> = [];
        const cols = 2;
        const rows = 2;
        const xStart = 58;
        const yStart = 48;
        const w = 14;
        const h = 12;
        const gx = 4;
        const gy = 3;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            panes.push({ x: xStart + c * (w + gx), y: yStart + r * (h + gy) });
          }
        }
        return (
          <g>
            {/* Warm interior bloom behind windows */}
            {winsActive && (
              <rect x="55" y="46" width="38" height="32" fill="url(#hv5-glow)" opacity="0.55" />
            )}
            {panes.map((p, i) => (
              <g key={i}>
                <rect
                  x={p.x}
                  y={p.y}
                  width={w}
                  height={h}
                  fill={fill}
                  stroke={trim}
                  strokeWidth="0.35"
                  rx="0.6"
                  opacity={winsActive ? 0.95 : 0.85}
                />
                {/* Mullions */}
                <line x1={p.x + w / 2} y1={p.y} x2={p.x + w / 2} y2={p.y + h} stroke={trim} strokeWidth="0.35" />
                <line x1={p.x} y1={p.y + h / 2} x2={p.x + w} y2={p.y + h / 2} stroke={trim} strokeWidth="0.35" />
              </g>
            ))}
          </g>
        );
      })()}

      {/* Grid meter box (right edge of front wall) */}
      <rect x="92" y="66" width="3.5" height="5" fill={wallSide} stroke={trim} strokeWidth="0.25" />
      <circle cx="93.75" cy="68.4" r="0.8" fill="#2c4170" />

      {/* Powerwall slot indicator (left of living block, on porch) — actual halo
          is drawn by EnergyFlowScene over this geometry */}
      <rect x="40.5" y="64" width="3.2" height="14" fill={wallSide} stroke={trim} strokeWidth="0.25" rx="0.4" />

      {/* Porch shadow line */}
      <line x1="4" y1="80" x2="96" y2="80" stroke="#000" strokeWidth="0.5" opacity="0.6" />

      {/* Rain streaks */}
      {isRain && (
        <g opacity="0.55" stroke="#9bb6d4" strokeWidth="0.18">
          {Array.from({ length: 28 }).map((_, i) => {
            const x = (i * 3.7) % 100;
            const y = (i * 5.1) % 50;
            return <line key={i} x1={x} y1={y} x2={x - 1.2} y2={y + 4} />;
          })}
        </g>
      )}

      {/* v5 Phase 4 — Snowfall */}
      {isSnow && (
        <g fill="#e7eef7" opacity="0.85">
          {Array.from({ length: 26 }).map((_, i) => (
            <circle key={i} cx={(i * 4.1) % 100} cy={(i * 6.3) % 70} r="0.4" />
          ))}
        </g>
      )}

      {/* v5 Phase 4 — Clouds (partly cloudy, overcast, fog, storm) */}
      {!isNight && (isPartlyCloudy || isOvercast || isFog || isStorm) && (
        <g
          fill={isStorm ? '#1a1830' : isFog ? '#3a4252' : isOvercast ? '#2b3344' : '#3b4660'}
          opacity={isFog ? 0.85 : isOvercast ? 0.75 : isStorm ? 0.7 : 0.55}
        >
          <ellipse cx="22" cy="14" rx="14" ry="3.4" />
          <ellipse cx="55" cy="10" rx="18" ry="4" />
          <ellipse cx="82" cy="16" rx="13" ry="3.2" />
          {(isOvercast || isFog || isStorm) && (
            <>
              <ellipse cx="40" cy="22" rx="22" ry="3" />
              <ellipse cx="78" cy="26" rx="20" ry="2.6" />
            </>
          )}
        </g>
      )}

      {/* v5 Phase 4 — Lightning flash hint for thunderstorms */}
      {isStorm && (
        <polyline
          points="62,12 60,22 64,22 60,34"
          fill="none"
          stroke="#fff4a8"
          strokeWidth="0.6"
          opacity="0.85"
        />
      )}


      {/* Subtle stars on night scenes */}
      {isNight &&
        Array.from({ length: 14 }).map((_, i) => (
          <circle
            key={i}
            cx={(i * 7.3) % 100}
            cy={(i * 3.1) % 14 + 2}
            r="0.18"
            fill="#cdd8ee"
            opacity="0.7"
          />
        ))}
    </svg>
  );
}

export const HouseSceneV5 = memo(HouseSceneV5Inner);
