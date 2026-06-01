import { Leaf } from "lucide-react";

interface Props {
  monthLabel: string;
  co2Tons: number;
  takeaway: string | null;
}

/**
 * Hero header for the Monthly Clean Energy Report.
 * Uses the PoG receipt visual language: CO₂-tons headline + 1-line Deason's take.
 */
export function MonthHero({ monthLabel, co2Tons, takeaway }: Props) {
  const tonsLabel = co2Tons >= 1 ? co2Tons.toFixed(2) : (co2Tons * 1000).toFixed(0);
  const tonsUnit = co2Tons >= 1 ? "tons CO₂" : "kg CO₂";
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-transparent to-amber-500/5 p-4">
      <div className="flex items-center gap-2">
        <Leaf className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-400">
          Clean Energy Report
        </span>
      </div>
      <div className="mt-1 text-base font-semibold text-foreground">{monthLabel}</div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-4xl font-bold tracking-tight text-emerald-300 tabular-nums">
          {tonsLabel}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {tonsUnit} avoided
        </span>
      </div>
      {takeaway && (
        <p className="mt-3 text-sm leading-snug text-muted-foreground">
          <span className="font-medium text-foreground">Deason’s take:</span> {takeaway}
        </p>
      )}
    </div>
  );
}
