import { useDeasonOptimizer } from "@/hooks/useDeasonOptimizer";
import { Loader2, Sparkles, TrendingUp, Zap } from "lucide-react";
import { Link } from "react-router-dom";

/** Compact summary of today's optimizer insights for the Settings page. */
export function OptimizerInsightsSummary() {
  const { data, loading } = useDeasonOptimizer();

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
        Running Deason's optimizer for today…
      </div>
    );
  }

  if (!data) return null;

  const monthly = data.summary?.est_monthly_savings_usd ?? 0;
  const tokens = Number(data.schedule?.totals?.zsolar_tokens ?? 0);
  const selfUse = data.schedule?.totals?.self_consumption_pct;
  const topRec = data.recommendations?.[0];

  return (
    <Link
      to="/deason"
      className="block rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/5 via-card to-card p-3 transition-colors hover:border-amber-500/40"
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-500">
        <Sparkles className="h-3 w-3" /> Today's Optimizer Insights
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Stat icon={<TrendingUp className="h-3 w-3" />} label="Projected/mo" value={`$${monthly.toFixed(0)}`} />
        <Stat icon={<Zap className="h-3 w-3" />} label="$ZSOLAR" value={tokens.toFixed(0)} />
        <Stat icon={<Sparkles className="h-3 w-3" />} label="Self-use" value={selfUse != null ? `${Math.round(Number(selfUse))}%` : "—"} />
      </div>
      {topRec && (
        <div className="mt-2 rounded-md bg-background/50 p-2 text-[11px] leading-snug">
          <span className="font-semibold">Top action:</span> {topRec.title} —{" "}
          <span className="text-emerald-500">~${topRec.est_monthly_savings_usd.toFixed(0)}/mo</span>
        </div>
      )}
    </Link>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-background/50 p-2 text-center">
      <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
