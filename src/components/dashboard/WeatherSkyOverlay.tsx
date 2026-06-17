/**
 * WeatherSkyOverlay — subtle weather tint + precipitation layer rendered
 * above the hero image and below sprites in the Live Energy Flow Card.
 * Fixture-driven (no live data wiring) for the prototype.
 */
import type { CSSProperties } from "react";

export type Weather = "clear" | "clouds" | "rain" | "snow" | "night";

export function WeatherSkyOverlay({
  weather,
  reducedMotion = false,
}: {
  weather: Weather;
  reducedMotion?: boolean;
}) {
  if (weather === "clear") return null;

  const tint: Record<Exclude<Weather, "clear">, string> = {
    clouds: "rgba(120,130,145,0.22)",
    rain: "rgba(60,75,95,0.32)",
    snow: "rgba(200,215,230,0.18)",
    night: "rgba(10,15,30,0.55)",
  };

  const base: CSSProperties = {
    position: "absolute",
    inset: 0,
    background: tint[weather],
    pointerEvents: "none",
    mixBlendMode: "multiply",
  };

  return (
    <>
      <div style={base} />
      {weather === "rain" && !reducedMotion && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
          {Array.from({ length: 18 }).map((_, i) => {
            const x = (i * 6.1 + 3) % 100;
            const delay = (i % 6) * 0.18;
            return (
              <line
                key={i}
                x1={x}
                y1={-5}
                x2={x - 3}
                y2={12}
                stroke="rgba(180,210,240,0.55)"
                strokeWidth={0.25}
                strokeLinecap="round"
                style={{
                  animation: `rainfall 1.4s linear ${delay}s infinite`,
                  transformOrigin: "center",
                }}
              />
            );
          })}
        </svg>
      )}
      {weather === "snow" && !reducedMotion && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
          {Array.from({ length: 14 }).map((_, i) => {
            const x = (i * 7.3 + 4) % 100;
            const delay = (i % 7) * 0.4;
            return (
              <circle
                key={i}
                cx={x}
                cy={-2}
                r={0.4}
                fill="rgba(255,255,255,0.85)"
                style={{ animation: `snowfall 4.5s linear ${delay}s infinite` }}
              />
            );
          })}
        </svg>
      )}
      <style>{`
        @keyframes rainfall {
          0% { transform: translateY(-10%); opacity: 0; }
          15% { opacity: 0.9; }
          100% { transform: translateY(120%); opacity: 0; }
        }
        @keyframes snowfall {
          0% { transform: translate(0, -10%); opacity: 0; }
          15% { opacity: 0.85; }
          100% { transform: translate(3%, 120%); opacity: 0; }
        }
      `}</style>
    </>
  );
}
