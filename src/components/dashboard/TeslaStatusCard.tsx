/**
 * TeslaStatusCard — always-visible Tesla vehicle summary for the
 * Live Energy Flow Card. Hero variant is full-width (used in Tesla-Only
 * scene directly under the car), secondary variant is a compact card.
 */
import type { CSSProperties } from "react";

export type TeslaStatusCardProps = {
  variant: "hero" | "secondary";
  model: string;
  fsdInstalled?: boolean;
  fsdVersion?: string;
  soc: number; // 0-100
  odometerMi: number;
  rangeMi: number;
  chargingKw?: number; // omit when not charging
  etaMin?: number;
  /** drives status pill + ring color */
  state: "unplugged" | "plugged-idle" | "charging" | "supercharging" | "offline";
};

const STATE_COPY: Record<TeslaStatusCardProps["state"], { label: string; color: string }> = {
  unplugged: { label: "Parked", color: "#94a3b8" },
  "plugged-idle": { label: "Plugged in · idle", color: "#f5c84c" },
  charging: { label: "Charging at home", color: "#22c98a" },
  supercharging: { label: "Supercharging", color: "#ff8a3d" },
  offline: { label: "Vehicle Offline", color: "#ef4444" },
};

export function TeslaStatusCard(props: TeslaStatusCardProps) {
  const { variant, model, fsdInstalled, fsdVersion, soc, odometerMi, rangeMi, chargingKw, etaMin, state } = props;
  const status = STATE_COPY[state];
  const isHero = variant === "hero";

  const ringSize = isHero ? 96 : 64;
  const stroke = isHero ? 7 : 5;
  const r = (ringSize - stroke) / 2;
  const C = 2 * Math.PI * r;
  const dash = C * (soc / 100);

  const cardStyle: CSSProperties = {
    background: isHero
      ? "linear-gradient(180deg, rgba(28,32,40,0.95) 0%, rgba(10,12,16,0.95) 100%)"
      : "rgba(20,22,28,0.85)",
    border: isHero ? "1px solid rgba(34,201,138,0.25)" : "1px solid rgba(255,255,255,0.06)",
    boxShadow: isHero ? "0 12px 40px -10px rgba(34,201,138,0.25)" : undefined,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    fontFamily: "'Manrope', system-ui, sans-serif",
  };

  return (
    <div
      className={`mx-3 my-3 rounded-2xl ${isHero ? "p-5" : "p-4"}`}
      style={cardStyle}
      data-testid="tesla-status-card"
      data-variant={variant}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: isHero ? 18 : 14 }} className="text-white font-semibold tracking-tight" >
            {model}
          </span>
          {fsdInstalled && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-bold uppercase text-emerald-300 tracking-wider">
              FSD{fsdVersion ? ` ${fsdVersion}` : ""}
            </span>
          )}
        </div>
        <span
          className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full"
          style={{ color: status.color, background: `${status.color}1f`, border: `1px solid ${status.color}55` }}
        >
          ● {status.label}
        </span>
      </div>

      {/* Body */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize} className="-rotate-90">
            <circle cx={ringSize / 2} cy={ringSize / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={r}
              stroke={status.color}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${C}`}
              style={{ transition: "stroke-dasharray 1s ease, stroke 0.4s ease", filter: `drop-shadow(0 0 6px ${status.color}88)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span style={{ fontSize: isHero ? 24 : 18 }} className="text-white font-semibold tabular-nums">
              {soc}
            </span>
            <span className="text-[9px] text-white/50 tracking-wider mt-0.5">SOC</span>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5">
          <StatRow label="Odometer" value={`${odometerMi.toLocaleString()} mi`} />
          <StatRow label="Range" value={`${rangeMi} mi`} />
          {chargingKw !== undefined && chargingKw > 0 && (
            <StatRow
              label={state === "supercharging" ? "Rate" : "Charging"}
              value={`${chargingKw.toFixed(1)} kW`}
              accent={status.color}
            />
          )}
          {etaMin !== undefined && etaMin > 0 && (
            <StatRow
              label="ETA"
              value={etaMin >= 60 ? `${Math.floor(etaMin / 60)}h ${etaMin % 60}m` : `${etaMin}m`}
              accent={status.color}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[9px] text-white/45 tracking-[0.18em] uppercase">{label}</span>
      <span className="text-[13px] font-semibold tabular-nums" style={{ color: accent ?? "rgba(255,255,255,0.92)" }}>
        {value}
      </span>
    </div>
  );
}
