/**
 * HouseSceneV5 — v5 Final (Phase C polish).
 *
 * Renders the premium baked 3-D isometric house PNG plus a richer
 * weather + sky overlay layer:
 *   · Drifting clouds for partly-cloudy / overcast codes
 *   · Fog band for fog / depositing-rime codes
 *   · Angled rain with subtle splash, denser on storms
 *   · Drifting snow flakes with sway
 *   · Lightning bolt + full-frame flash for thunderstorms
 *   · Sun glow on clear days, moon + star field on clear nights
 *
 * All overlays are positional-stable across re-renders (seeded jitter).
 * Anchors used by the scene's halos + flow paths live in
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
  const isClear = wx === 0 || wx === 1 || wx == null;
  const isPartlyCloudy = wx === 2;
  const isOvercast = wx === 3;
  const isFog = wx != null && wx >= 45 && wx <= 48;
  const isDrizzleOrRain =
    wx != null && ((wx >= 51 && wx <= 67) || (wx >= 80 && wx <= 82));
  const isSnow = wx != null && wx >= 71 && wx <= 86;
  const isStorm = wx != null && wx >= 95;
  const showRain = isDrizzleOrRain || isStorm || scene === 'rain';
  const showClouds = isPartlyCloudy || isOvercast || isStorm;

  // Stable jitter so precip / clouds / stars don't reflow between renders.
  const drops = useMemo(
    () =>
      Array.from({ length: isStorm ? 44 : 32 }).map((_, i) => ({
        x: (i * 3.1) % 100,
        y: (i * 5.7) % 60,
        len: 3.4 + ((i * 7) % 3),
        delay: (i % 8) * 0.12,
      })),
    [isStorm],
  );
  const flakes = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        x: (i * 3.7) % 100,
        y: (i * 5.9) % 70,
        r: 0.35 + ((i * 11) % 3) * 0.12,
        delay: (i % 6) * 0.18,
        sway: ((i * 17) % 4) - 2,
      })),
    [],
  );
  const clouds = useMemo(
    () =>
      Array.from({ length: isOvercast || isStorm ? 5 : 3 }).map((_, i) => ({
        x: (i * 27 + 8) % 100,
        y: 8 + ((i * 7) % 12),
        rx: 14 + (i % 3) * 4,
        ry: 4 + (i % 2),
        dur: 60 + (i % 4) * 12,
        opacity: isStorm ? 0.55 : isOvercast ? 0.5 : 0.32,
      })),
    [isStorm, isOvercast],
  );
  const stars = useMemo(
    () =>
      Array.from({ length: 36 }).map((_, i) => ({
        x: (i * 7.3) % 100,
        y: (i * 3.9) % 38,
        r: 0.18 + ((i * 13) % 3) * 0.06,
        twinkle: 2 + (i % 4) * 0.7,
      })),
    [],
  );

  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-1/2 mx-auto h-[92%] w-auto max-w-[98%] -translate-y-1/2"
      style={{ aspectRatio: '1 / 1' }}
    >
      {/* Sky-only overlay BEHIND the house — celestial + cloud bodies that
          should look like they sit in the air above the roofline. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ zIndex: 1 }}
      >
        {/* Clear-night star field */}
        {isNight && isClear && (
          <g fill="hsl(210 40% 92%)">
            {stars.map((s, i) => (
              <circle key={`st-${i}`} cx={s.x} cy={s.y} r={s.r}>
                <animate
                  attributeName="opacity"
                  values="0.35;0.95;0.35"
                  dur={`${s.twinkle}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))}
            {/* Moon */}
            <circle cx="78" cy="14" r="3.2" fill="hsl(48 60% 90%)" opacity="0.85" />
            <circle cx="78" cy="14" r="5" fill="hsl(48 60% 90%)" opacity="0.18" style={{ filter: 'blur(1.2px)' }} />
          </g>
        )}
        {/* Clear-day sun bloom */}
        {!isNight && isClear && (
          <g>
            <circle cx="78" cy="16" r="3.6" fill="hsl(48 95% 70%)" opacity="0.85" />
            <circle cx="78" cy="16" r="7" fill="hsl(45 95% 65%)" opacity="0.25" style={{ filter: 'blur(1.4px)' }} />
          </g>
        )}
        {/* Drifting clouds (partly-cloudy, overcast, storm) */}
        {showClouds && (
          <g fill={isNight ? 'hsl(220 18% 70%)' : 'hsl(210 14% 90%)'}>
            {clouds.map((c, i) => (
              <g key={`cl-${i}`} opacity={c.opacity} style={{ filter: 'blur(0.6px)' }}>
                <ellipse cx={c.x} cy={c.y} rx={c.rx} ry={c.ry} />
                <ellipse cx={c.x + c.rx * 0.4} cy={c.y - c.ry * 0.5} rx={c.rx * 0.55} ry={c.ry * 0.85} />
                <ellipse cx={c.x - c.rx * 0.4} cy={c.y + c.ry * 0.2} rx={c.rx * 0.45} ry={c.ry * 0.7} />
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  from="-10 0"
                  to="10 0"
                  dur={`${c.dur}s`}
                  repeatCount="indefinite"
                  additive="sum"
                />
              </g>
            ))}
          </g>
        )}
        {/* Fog band */}
        {isFog && (
          <g>
            <rect
              x="0"
              y="42"
              width="100"
              height="22"
              fill="hsl(210 12% 78%)"
              opacity="0.32"
              style={{ filter: 'blur(2.4px)' }}
            >
              <animate
                attributeName="opacity"
                values="0.22;0.40;0.22"
                dur="9s"
                repeatCount="indefinite"
              />
            </rect>
          </g>
        )}
      </svg>

      {/* Hero PNG — the premium baked house. */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full select-none object-contain drop-shadow-[0_28px_44px_hsl(220_70%_3%/0.6)]"
        style={{ zIndex: 2 }}
        draggable={false}
      />

      {/* Weather precip layer — sits ABOVE the house so droplets fall in
          front of the roof and walls. */}
      {(showRain || isSnow || isStorm) && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ zIndex: 3 }}
        >
          {showRain && (
            <g opacity={isStorm ? 0.7 : 0.55}>
              {drops.map((d, i) => (
                <line
                  key={`rd-${i}`}
                  x1={d.x}
                  y1={d.y}
                  x2={d.x - 1.6}
                  y2={d.y + d.len}
                  stroke="hsl(205 65% 82%)"
                  strokeWidth="0.2"
                  strokeLinecap="round"
                >
                  <animate
                    attributeName="opacity"
                    values="0;0.9;0"
                    dur={isStorm ? '0.7s' : '0.95s'}
                    begin={`${d.delay}s`}
                    repeatCount="indefinite"
                  />
                </line>
              ))}
            </g>
          )}
          {isSnow && (
            <g fill="hsl(210 30% 96%)" opacity="0.88">
              {flakes.map((f, i) => (
                <circle key={`sn-${i}`} cx={f.x} cy={f.y} r={f.r}>
                  <animate
                    attributeName="cy"
                    from={f.y}
                    to={f.y + 14}
                    dur="3.8s"
                    begin={`${f.delay}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="cx"
                    values={`${f.x};${f.x + f.sway};${f.x}`}
                    dur="3.8s"
                    begin={`${f.delay}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.15;0.95;0.15"
                    dur="3.8s"
                    begin={`${f.delay}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
            </g>
          )}
          {isStorm && (
            <>
              <polyline
                points="58,8 55,22 61,22 54,40"
                fill="none"
                stroke="hsl(50 100% 82%)"
                strokeWidth="0.6"
                strokeLinecap="round"
                opacity="0"
                style={{ filter: 'drop-shadow(0 0 1.2px hsl(50 100% 80%))' }}
              >
                <animate
                  attributeName="opacity"
                  values="0;0;0.95;0;0"
                  keyTimes="0;0.7;0.74;0.78;1"
                  dur="6s"
                  repeatCount="indefinite"
                />
              </polyline>
              {/* Full-frame flash sells the strike */}
              <rect x="0" y="0" width="100" height="100" fill="hsl(50 100% 90%)" opacity="0">
                <animate
                  attributeName="opacity"
                  values="0;0;0.22;0;0"
                  keyTimes="0;0.72;0.745;0.77;1"
                  dur="6s"
                  repeatCount="indefinite"
                />
              </rect>
            </>
          )}
        </svg>
      )}

      {/* Subtle vignette to seat the house in the card. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 4,
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
