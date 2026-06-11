/**
 * HouseSceneV5 — v5 Final.
 *
 * Renders the premium baked 3-D isometric house PNG (the depth-shaded,
 * lit-windows hero the user approved as the base) plus a thin weather
 * overlay layer (precip particles + optional sky tint). The flat hand-
 * drawn SVG silhouette the earlier Phase 1 used has been retired.
 *
 * Geometry/anchors used by the scene's halos + flow paths live in
 * `HomeBlueprint.ts` and are tuned to these PNGs.
 */
import { memo, useMemo } from 'react';
import type { SceneKey } from './EnergyFlowScene';

import sceneDay from '@/assets/zencasa/house-day.png';
import sceneDusk from '@/assets/zencasa/house-dusk.png';
import sceneNight from '@/assets/zencasa/house-night.png';
import sceneNightEv from '@/assets/zencasa/house-night-ev.png';
import sceneNightPw from '@/assets/zencasa/house-night-pw-discharge.png';
import sceneNightPwEv from '@/assets/zencasa/house-night-pw-discharge-ev.png';
import sceneDayExport from '@/assets/zencasa/house-day-export.png';
import sceneRain from '@/assets/zencasa/house-rain.png';

const SCENE_SRC: Record<SceneKey, string> = {
  day: sceneDay,
  dusk: sceneDusk,
  night: sceneNight,
  'night-ev': sceneNightEv,
  'night-pw-discharge': sceneNightPw,
  'night-pw-discharge-ev': sceneNightPwEv,
  'day-export': sceneDayExport,
  rain: sceneRain,
};

interface Props {
  scene: SceneKey;
  /** Reserved — kept for backwards-compat. */
  homeActive?: boolean;
  solarActive?: boolean;
  garageOpen?: boolean;
  /** Open-Meteo WMO weather code → precip overlays (rain/snow/storm). */
  weatherCode?: number | null;
}

function HouseSceneV5Inner({ scene, weatherCode }: Props) {
  const src = SCENE_SRC[scene] ?? SCENE_SRC.day;
  const isNight =
    scene === 'night' ||
    scene === 'night-ev' ||
    scene === 'night-pw-discharge' ||
    scene === 'night-pw-discharge-ev';

  // Weather flags (Open-Meteo WMO).
  const wx = weatherCode ?? null;
  const isDrizzleOrRain =
    wx != null && ((wx >= 51 && wx <= 67) || (wx >= 80 && wx <= 82));
  const isSnow = wx != null && wx >= 71 && wx <= 86;
  const isStorm = wx != null && wx >= 95;
  const showRain = isDrizzleOrRain || isStorm || scene === 'rain';

  // Stable jitter for precip droplets so they don't reflow every render.
  const drops = useMemo(
    () =>
      Array.from({ length: 32 }).map((_, i) => ({
        x: (i * 3.1) % 100,
        y: (i * 5.7) % 60,
        len: 3.4 + ((i * 7) % 3),
        delay: (i % 8) * 0.12,
      })),
    [],
  );
  const flakes = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        x: (i * 3.7) % 100,
        y: (i * 5.9) % 70,
        r: 0.35 + ((i * 11) % 3) * 0.12,
        delay: (i % 6) * 0.18,
      })),
    [],
  );

  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-1/2 mx-auto h-[92%] w-auto max-w-[98%] -translate-y-1/2"
      style={{ aspectRatio: '1 / 1' }}
    >
      {/* Hero PNG — the premium baked house. */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full select-none object-contain drop-shadow-[0_28px_44px_hsl(220_70%_3%/0.6)]"
        draggable={false}
      />

      {/* Weather precip layer (SVG over the PNG, same square). */}
      {(showRain || isSnow || isStorm) && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {showRain && (
            <g opacity={isStorm ? 0.65 : 0.5}>
              {drops.map((d, i) => (
                <line
                  key={`rd-${i}`}
                  x1={d.x}
                  y1={d.y}
                  x2={d.x - 1.4}
                  y2={d.y + d.len}
                  stroke="hsl(210 60% 78%)"
                  strokeWidth="0.18"
                  strokeLinecap="round"
                >
                  <animate
                    attributeName="opacity"
                    values="0;0.85;0"
                    dur="0.9s"
                    begin={`${d.delay}s`}
                    repeatCount="indefinite"
                  />
                </line>
              ))}
            </g>
          )}
          {isSnow && (
            <g fill="hsl(210 30% 95%)" opacity="0.85">
              {flakes.map((f, i) => (
                <circle key={`sn-${i}`} cx={f.x} cy={f.y} r={f.r}>
                  <animate
                    attributeName="cy"
                    from={f.y}
                    to={f.y + 12}
                    dur="3.6s"
                    begin={`${f.delay}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.2;0.95;0.2"
                    dur="3.6s"
                    begin={`${f.delay}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
            </g>
          )}
          {isStorm && (
            <polyline
              points="58,10 56,22 60,22 56,36"
              fill="none"
              stroke="hsl(50 100% 80%)"
              strokeWidth="0.55"
              opacity="0"
            >
              <animate
                attributeName="opacity"
                values="0;0;0.95;0;0"
                keyTimes="0;0.7;0.74;0.78;1"
                dur="6s"
                repeatCount="indefinite"
              />
            </polyline>
          )}
        </svg>
      )}

      {/* Subtle vignette to seat the house in the card. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 60%, transparent 55%, hsl(220 70% 3% / 0.55) 100%)',
        }}
      />
      {/* Hide unused props for TS. */}
      <span className="sr-only" data-night={isNight ? '1' : '0'} />
    </div>
  );
}

export const HouseSceneV5 = memo(HouseSceneV5Inner);
