import { CheckCircle2, MessageSquare, Calendar, ArrowRight } from "lucide-react";
import type { MonthlyReport } from "@/hooks/useDeasonHub";

interface Props {
  latest: MonthlyReport;
  onAskDeason: () => void;
  onScheduleReminder?: () => void;
}

/**
 * Shown immediately AFTER a monthly report is generated for the current
 * calendar month. Replaces the "run your report" nudge with a celebratory,
 * action-oriented set of next steps.
 */
export function NextStepsCard({ latest, onAskDeason, onScheduleReminder }: Props) {
  const monthLabel = new Date(latest.period_month).toLocaleString(undefined, { month: "long" });
  const nextMonth = new Date(latest.period_month);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  const nextLabel = nextMonth.toLocaleString(undefined, { month: "long" });

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        {monthLabel} report saved — next steps
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Deason banked <span className="font-medium text-emerald-500">${Math.round(latest.dollars_saved)}</span>
        {" "}for {monthLabel}. Lock in the wins, then come back on the 1st of {nextLabel}.
      </p>

      <ul className="mt-3 space-y-2 text-xs">
        <Step n={1} title="Knock out the top action item" body="Open the report below and complete the #1 ranked action — Deason ranks by $ impact." />
        <Step n={2} title="Ask Deason follow-ups" body="Have a question about a charge, a clause, or a recommendation? Open a chat thread." />
        <Step n={3} title={`Upload ${nextLabel}'s bill when it arrives`} body="Deason will compare it line-by-line and update your streak." />
      </ul>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onAskDeason}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-black hover:bg-amber-400"
        >
          <MessageSquare className="h-3.5 w-3.5" /> Ask Deason
          <ArrowRight className="h-3 w-3" />
        </button>
        {onScheduleReminder && (
          <button
            type="button"
            onClick={onScheduleReminder}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-accent"
          >
            <Calendar className="h-3.5 w-3.5" /> Remind me {nextLabel} 1st
          </button>
        )}
      </div>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-2">
      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-500">
        {n}
      </span>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-muted-foreground">{body}</div>
      </div>
    </li>
  );
}
