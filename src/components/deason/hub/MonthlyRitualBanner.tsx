import { Sparkles, ArrowRight } from "lucide-react";
import type { MonthlyReport } from "@/hooks/useDeasonHub";

interface Props {
  latest: MonthlyReport | null;
  onStart: () => void;
}

/**
 * Shown at the top of the hub when the user has no report for the current
 * calendar month. Friendly nudge — never blocks.
 */
export function MonthlyRitualBanner({ latest, onStart }: Props) {
  const now = new Date();
  const currentPeriod = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const upToDate = latest?.period_month === currentPeriod;
  if (upToDate) return null;
  const monthName = now.toLocaleString(undefined, { month: "long" });
  return (
    <button
      type="button"
      onClick={onStart}
      className="flex w-full items-center gap-3 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent p-4 text-left transition-colors hover:from-amber-500/20"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">Run your {monthName} Clean Energy Report</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          Upload this month's bill — Deason tracks savings, flags risks, and earns you bonus $ZSOLAR.
        </div>
      </div>
      <ArrowRight className="h-4 w-4 flex-shrink-0 text-amber-500" />
    </button>
  );
}
