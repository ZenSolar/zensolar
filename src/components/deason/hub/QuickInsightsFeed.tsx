import { AlertTriangle, Lightbulb, Sparkles, X } from "lucide-react";
import type { Insight } from "@/hooks/useDeasonHub";

const ICONS = {
  savings: <Sparkles className="h-3.5 w-3.5" />,
  risk: <AlertTriangle className="h-3.5 w-3.5" />,
  opportunity: <Lightbulb className="h-3.5 w-3.5" />,
  seasonal: <Sparkles className="h-3.5 w-3.5" />,
} as const;

export function QuickInsightsFeed({ insights, onDismiss }: { insights: Insight[]; onDismiss: (id: string) => void }) {
  if (!insights.length) return null;
  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">Quick insights</div>
      {insights.slice(0, 3).map((i) => (
        <div key={i.id} className="flex items-start gap-2 rounded-xl border border-border bg-card p-3">
          <div className={
            "mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full " +
            (i.severity === "warn" ? "bg-destructive/15 text-destructive" : "bg-amber-500/15 text-amber-500")
          }>
            {ICONS[i.kind]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">{i.title}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{i.body}</div>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(i.id)}
            className="text-muted-foreground hover:text-foreground"
            title="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
