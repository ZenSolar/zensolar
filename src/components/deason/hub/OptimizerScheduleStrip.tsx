import { useMemo } from "react";
import { Battery, Car, Sun, Zap, Info } from "lucide-react";
import type { OptimizerSchedule } from "@/hooks/useDeasonOptimizer";
import { cn } from "@/lib/utils";

interface Props {
  schedule: OptimizerSchedule | null;
  /** Raw optimizer forecast payload — used to disclose modelled vs measured inputs. */
  forecast?: { sources?: Record<string, unknown> } | null;
  compact?: boolean;
}

/** True when the solar/weather inputs came from built-in curves rather than PVWatts/OpenWeather. */
function isModelled(forecast?: { sources?: Record<string, unknown> } | null) {
  const src = forecast?.sources as Record<string, any> | undefined;
  if (!src) return true;
  const solar = String(src.solar ?? "heuristic");
  const weatherUnavailable = String(src.weather ?? "unavailable") === "unavailable";
  return solar.startsWith("heuristic") || weatherUnavailable;
}

/**
 * Visual hourly timeline of the optimizer's recommended schedule.
 * Shows a 24h strip with color-coded actions (solar, battery charge/discharge,
 * EV charge, grid import) and a totals row (savings, tokens, self-consumption).
 */
export function OptimizerScheduleStrip({ schedule, forecast = null, compact = false }: Props) {
  const modelled = isModelled(forecast);
  const slots = schedule?.schedule ?? [];
  const totals = schedule?.totals ?? null;

  const cells = useMemo(() => {
    return slots.slice(0, 24).map((s) => {
      const solar = Number(s.solar_kw ?? 0);
      const battery = Number(s.battery_kw ?? 0); // + charge / - discharge
      const ev = Number(s.ev_kw ?? 0);
      const gridImport = Number(s.grid_import_kw ?? 0);
      // Priority for coloring
      let cls = "bg-muted/30";
      let label = "idle";
      if (ev > 0.1) { cls = "bg-blue-500/70"; label = "EV charging"; }
      else if (battery < -0.1) { cls = "bg-amber-500/70"; label = "Battery discharging"; }
      else if (battery > 0.1) { cls = "bg-emerald-500/70"; label = "Battery charging"; }
      else if (solar > 0.1) { cls = "bg-yellow-500/60"; label = "Solar producing"; }
      else if (gridImport > 0.1) { cls = "bg-rose-500/50"; label = "Grid import"; }
      return { hour: Number(s.hour ?? 0), cls, label };
    });
  }, [slots]);

  if (!schedule || cells.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-3 text-xs text-muted-foreground">
        Connect a device or upload a bill to generate your personalized 24h schedule.
      </div>
    );
  }

  const selfConsumption = totals?.self_consumption_pct != null
    ? Math.round(Number(totals.self_consumption_pct))
    : null;
  const savings = totals?.savings_usd != null ? Number(totals.savings_usd) : null;
  const tokens = totals?.zsolar_tokens != null ? Number(totals.zsolar_tokens) : null;

  return (
    <div className="space-y-2 rounded-xl border border-border/60 bg-card/60 p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold">Today's Optimized Schedule</div>
        <div className="text-[10px] text-muted-foreground">
          {modelled ? "24h · modelled estimate" : "24h · forecast-driven"}
        </div>
      </div>

      {modelled && (
        <div className="flex items-start gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2 py-1.5 text-[10px] leading-snug text-muted-foreground">
          <Info className="mt-[1px] h-3 w-3 flex-shrink-0" />
          <span>
            Estimate only. Solar and weather forecasts are unavailable, so this schedule uses
            modelled typical-day curves rather than readings from your system.
          </span>
        </div>
      )}

      {/* Hour strip */}
      <div className="grid grid-cols-24 gap-[2px]" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
        {cells.map((c) => (
          <div
            key={c.hour}
            title={`${String(c.hour).padStart(2, "0")}:00 — ${c.label}`}
            className={cn("h-6 rounded-sm", c.cls)}
          />
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground">
        <span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>11p</span>
      </div>

      {/* Legend */}
      {!compact && (
        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
          <Legend dot="bg-yellow-500/60" icon={<Sun className="h-3 w-3" />}>Solar</Legend>
          <Legend dot="bg-emerald-500/70" icon={<Battery className="h-3 w-3" />}>Charge</Legend>
          <Legend dot="bg-amber-500/70" icon={<Battery className="h-3 w-3" />}>Discharge</Legend>
          <Legend dot="bg-blue-500/70" icon={<Car className="h-3 w-3" />}>EV</Legend>
          <Legend dot="bg-rose-500/50" icon={<Zap className="h-3 w-3" />}>Grid</Legend>
        </div>
      )}

      {/* Totals */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <Stat label={modelled ? "Est. savings" : "Savings"} value={savings != null ? `$${savings.toFixed(2)}` : "—"} accent="text-emerald-500" />
        <Stat label="$ZSOLAR" value={tokens != null ? tokens.toFixed(0) : "—"} accent="text-amber-500" />
        <Stat label="Self-use" value={selfConsumption != null ? `${selfConsumption}%` : "—"} accent="text-sky-400" />
      </div>
    </div>
  );
}

function Legend({ dot, icon, children }: { dot: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-2 w-2 rounded-sm", dot)} />
      {icon}
      {children}
    </span>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg bg-background/60 p-2 text-center">
      <div className={cn("text-sm font-semibold tabular-nums", accent)}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
