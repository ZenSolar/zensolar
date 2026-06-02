import { Clock3, RefreshCw, Sparkles } from 'lucide-react';

interface LiveCardHeaderProps {
  subtitle: string;
  ageLabel: string;
  freshnessClassName: string;
  onRefresh: () => void;
  refreshing: boolean;
}

/**
 * Shared header for every ZenEnergy Monitoring view (rich cockpit,
 * SolarPlusCard, ChargerOnlyLiveCard). Keeps the title + freshness pill +
 * manual refresh button visually identical across device combinations.
 */
export function LiveCardHeader({
  subtitle,
  ageLabel,
  freshnessClassName,
  onRefresh,
  refreshing,
}: LiveCardHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            ZenEnergy Monitoring · Live
          </h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1 ${freshnessClassName}`}
        >
          <Clock3 className="h-3 w-3" />
          {ageLabel}
        </span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh live telemetry"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/25 bg-background/40 text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}
