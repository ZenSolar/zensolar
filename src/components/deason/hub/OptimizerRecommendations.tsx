import { Lightbulb } from "lucide-react";
import type { OptimizerRecommendation } from "@/hooks/useDeasonOptimizer";
import { cn } from "@/lib/utils";

interface Props {
  recommendations: OptimizerRecommendation[];
  max?: number;
}

/** Top personalized recommendations from the optimizer, with explanations + sources. */
export function OptimizerRecommendations({ recommendations, max = 5 }: Props) {
  const recs = recommendations.slice(0, max);
  if (!recs.length) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-3 text-xs text-muted-foreground">
        Upload your latest bill so Deason can write personalized recommendations.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
        Top personalized actions
      </div>
      <ul className="space-y-1.5">
        {recs.map((r, i) => (
          <li key={r.id} className="rounded-lg border border-border/60 bg-card/60 p-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-xs font-semibold">
                <span className="mr-1 text-muted-foreground">{i + 1}.</span>
                {r.title}
              </div>
              <SeverityBadge severity={r.severity} />
            </div>
            <p className="mt-1 text-[11px] leading-snug text-foreground/90">{r.action}</p>
            <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{r.rationale}</p>
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex flex-wrap gap-1">
                {r.sources.slice(0, 3).map((s) => (
                  <span key={s} className="rounded-sm bg-muted/60 px-1.5 py-[1px] text-[9px] text-muted-foreground">
                    {s.replace(/^rule:/, "rule ").replace(/_/g, " ")}
                  </span>
                ))}
              </div>
              <div className="text-[10px] tabular-nums text-emerald-500">
                ~${r.est_monthly_savings_usd.toFixed(0)}/mo
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: OptimizerRecommendation["severity"] }) {
  const cls = severity === "high"
    ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
    : severity === "medium"
    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
    : "bg-muted/60 text-muted-foreground border-border/60";
  return (
    <span className={cn("rounded-sm border px-1.5 py-[1px] text-[9px] uppercase tracking-wide", cls)}>
      {severity}
    </span>
  );
}
