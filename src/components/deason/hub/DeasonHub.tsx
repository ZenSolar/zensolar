import { useMemo, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useDeasonHub } from "@/hooks/useDeasonHub";
import { useEnergyReport } from "@/hooks/useEnergyReport";
import { EnergyDocSheet, type EnergyDocMeta } from "@/components/deason/EnergyDocSheet";
import { MonthlyRitualBanner } from "./MonthlyRitualBanner";
import { NextStepsCard } from "./NextStepsCard";
import { ProgressionCard } from "./ProgressionCard";
import { MonthlyReportCard } from "./MonthlyReportCard";
import { QuickInsightsFeed } from "./QuickInsightsFeed";
import { WeatherOutlookCard } from "./WeatherOutlookCard";
import { DocumentLibrary } from "./DocumentLibrary";
import { TexasContextCard } from "./TexasContextCard";
import { PastReportsTimeline } from "./PastReportsTimeline";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onStartChat: () => void;
}

/**
 * Deason hub. Composes monthly ritual banner / next-steps, progression,
 * latest monthly report, insights, weather, document library, TX context,
 * and a filterable past-reports timeline.
 */
export function DeasonHub({ onStartChat }: Props) {
  const {
    loading,
    latestReport,
    pastReports,
    progression,
    library,
    insights,
    weather,
    profileCtx,
    refresh,
    dismissInsight,
  } = useDeasonHub();
  const energy = useEnergyReport();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isMonthly, setIsMonthly] = useState(true);
  const { toast } = useToast();

  const currentPeriod = useMemo(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  }, []);
  const hasCurrentMonthReport = latestReport?.period_month === currentPeriod;

  const handleSubmit = async (docs: Parameters<typeof energy.generate>[0], meta?: EnergyDocMeta) => {
    try {
      await energy.generate(docs, null, { isMonthlyRitual: isMonthly, meta });
      setSheetOpen(false);
      toast({
        title: isMonthly ? "Monthly report ready" : "Analysis ready",
        description: "Your hub has been updated.",
      });
      await refresh();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Couldn't finish the analysis",
        description: e instanceof Error ? e.message : "Try again.",
      });
    }
  };

  const allReports = useMemo(
    () => (latestReport ? [latestReport, ...pastReports] : pastReports),
    [latestReport, pastReports],
  );

  return (
    <div className="mx-auto h-full w-full max-w-2xl overflow-y-auto px-4 py-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 ring-1 ring-amber-500/40">
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <h1 className="text-lg font-semibold">Deason · Clean Energy Optimization</h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Your personal AI clean tech advisor. Reads every word of your bills, contracts, and PPAs.
          </p>
        </div>
        <button
          type="button"
          onClick={onStartChat}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          New chat
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {hasCurrentMonthReport && latestReport ? (
            <NextStepsCard latest={latestReport} onAskDeason={onStartChat} />
          ) : (
            <MonthlyRitualBanner
              latest={latestReport}
              onStart={() => { setIsMonthly(true); setSheetOpen(true); }}
            />
          )}
          <ProgressionCard progression={progression} />
          <TexasContextCard ctx={profileCtx} onEdit={() => { setIsMonthly(false); setSheetOpen(true); }} />
          <MonthlyReportCard report={latestReport} />
          <QuickInsightsFeed insights={insights} onDismiss={dismissInsight} />
          <WeatherOutlookCard weather={weather} />
          <DocumentLibrary docs={library} onUpload={() => { setIsMonthly(false); setSheetOpen(true); }} />
          <PastReportsTimeline reports={allReports} library={library} />
        </div>
      )}

      <EnergyDocSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        loading={energy.loading}
        onSubmit={handleSubmit}
        defaultMeta={{
          esid: profileCtx.esid ?? undefined,
          state_code: profileCtx.state_code ?? undefined,
          utility_name: profileCtx.utility_name ?? undefined,
        }}
      />
    </div>
  );
}
