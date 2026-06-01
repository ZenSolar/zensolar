import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { EnergyReportCard } from "@/components/deason/EnergyReportCard";
import type { MonthlyReport } from "@/hooks/useDeasonHub";
import type { EnergyReportPreview, EnergyReportFull } from "@/hooks/useEnergyReport";
import { GRID_KG_PER_KWH } from "@/lib/co2Math";
import { MonthHero } from "@/components/deason/report/MonthHero";
import { InsightTiles } from "@/components/deason/report/InsightTiles";
import { WhatChanged } from "@/components/deason/report/WhatChanged";
import { BillSavingsStrip } from "@/components/deason/report/BillSavingsStrip";
import { TrendSparkline, type TrendPoint } from "@/components/deason/report/TrendSparkline";
import { ShareMonthButton } from "@/components/deason/report/ShareMonthButton";

interface Props {
  report: MonthlyReport | null;
  /** Past reports (oldest → newest order not required; we sort internally). */
  pastReports?: MonthlyReport[];
}

function shortMonth(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short" });
}

export function MonthlyReportCard({ report, pastReports = [] }: Props) {
  const [expanded, setExpanded] = useState(false);

  // ── Empty / early-month state ──────────────────────────────────────────────
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

  const monthLabel = new Date(report.period_month).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
  const preview = report.structured_report?.preview as unknown as EnergyReportPreview | undefined;
  const full = report.structured_report?.full as unknown as EnergyReportFull | undefined;

  // Previous month (immediately prior to `report.period_month`)
  const prev = useMemo(() => {
    const sorted = [...pastReports]
      .filter((r) => r.id !== report.id && r.period_month < report.period_month)
      .sort((a, b) => (a.period_month < b.period_month ? 1 : -1));
    return sorted[0] ?? null;
  }, [pastReports, report.id, report.period_month]);

  // 6-month trend (oldest → newest), inclusive of current.
  const trend: TrendPoint[] = useMemo(() => {
    const all = [...pastReports, report]
      .filter((r) => r.period_month <= report.period_month)
      .sort((a, b) => (a.period_month < b.period_month ? -1 : 1))
      .slice(-6);
    return all.map((r) => ({
      monthLabel: shortMonth(r.period_month),
      dollars: Number(r.dollars_saved) || 0,
      kwh: Number(r.bonus_tokens) || 0,
    }));
  }, [pastReports, report]);

  // CO₂: treat bonus_tokens as kWh (1:1 rule). Use grid-avg displacement.
  const co2Tons = (Number(report.bonus_tokens) * GRID_KG_PER_KWH) / 1000;

  const takeaway = report.narrative ?? preview?.executive_summary ?? null;

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-3.5">
      <MonthHero monthLabel={monthLabel} co2Tons={co2Tons} takeaway={takeaway} />

      <InsightTiles
        dollarsSaved={report.dollars_saved}
        bonusTokens={report.bonus_tokens}
        prevDollarsSaved={prev ? Number(prev.dollars_saved) : null}
        prevBonusTokens={prev ? Number(prev.bonus_tokens) : null}
      />

      <BillSavingsStrip dollarsSaved={report.dollars_saved} bonusTokens={report.bonus_tokens} />

      <WhatChanged
        preview={preview}
        full={full}
        prevDollarsSaved={prev ? Number(prev.dollars_saved) : null}
        currDollarsSaved={Number(report.dollars_saved)}
      />

      <TrendSparkline data={trend} />

      <div className="grid grid-cols-2 gap-2">
        <ShareMonthButton
          monthLabel={monthLabel}
          co2Tons={co2Tons}
          dollarsSaved={report.dollars_saved}
          bonusTokens={report.bonus_tokens}
        />
        {(preview || full) && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-border/60 bg-card py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? "Hide full report" : "View full report"}
          </button>
        )}
      </div>

      {expanded && preview && (
        <div className="pt-1">
          <EnergyReportCard preview={preview} full={full ?? null} entitled />
        </div>
      )}
    </div>
  );
}
