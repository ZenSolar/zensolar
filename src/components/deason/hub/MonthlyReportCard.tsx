import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, Coins } from "lucide-react";
import { EnergyReportCard } from "@/components/deason/EnergyReportCard";
import type { MonthlyReport } from "@/hooks/useDeasonHub";
import type { EnergyReportPreview, EnergyReportFull } from "@/hooks/useEnergyReport";

export function MonthlyReportCard({ report }: { report: MonthlyReport | null }) {
  const [expanded, setExpanded] = useState(false);

  if (!report) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4 text-center">
        <Sparkles className="mx-auto h-5 w-5 text-amber-500" />
        <div className="mt-2 text-sm font-semibold">Your first Monthly Clean Energy Report</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Upload your latest utility bill to start tracking month-over-month savings and earning bonus $ZSOLAR.
        </div>
      </div>
    );
  }

  const monthLabel = new Date(report.period_month).toLocaleString(undefined, { month: "long", year: "numeric" });
  const preview = report.structured_report?.preview as unknown as EnergyReportPreview | undefined;
  const full = report.structured_report?.full as unknown as EnergyReportFull | undefined;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-amber-500">Monthly Clean Energy Report</div>
          <div className="mt-0.5 text-lg font-semibold">{monthLabel}</div>
          {report.narrative && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{report.narrative}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Tracked</div>
          <div className="text-2xl font-bold text-amber-500">${Math.round(report.dollars_saved)}</div>
          <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
            <Coins className="h-3 w-3" /> +{Math.round(report.bonus_tokens)} $ZSOLAR
          </div>
        </div>
      </div>

      {(preview || full) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-border/40 bg-background py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? "Hide details" : "View full report"}
        </button>
      )}

      {expanded && preview && (
        <div className="mt-3">
          <EnergyReportCard preview={preview} full={full ?? null} entitled />
        </div>
      )}
    </div>
  );
}
