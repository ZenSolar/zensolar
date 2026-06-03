import { Link } from 'react-router-dom';
import { ChevronRight, Sun } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export interface OutageFooterProps {
  socPct: number;
  usableCapacityKwh: number;
  /** Positive kW flowing from battery to home. */
  dischargeKw: number;
  /** kW solar is currently producing (drives the "recharging now" footer). */
  solarProducingKw?: number;
  reservePct?: number;
}

/**
 * Slim, single-row outage footer that lives inside the unified live-energy
 * card during a grid outage. The house diagram above already carries the
 * hero stats (backup time, kW from battery, SOC) via integrated overlays —
 * this footer adds the contextual load/capacity bar + history link without
 * stacking another big panel on the screen.
 */
export function OutageFooter({
  socPct,
  usableCapacityKwh,
  dischargeKw,
  solarProducingKw = 0,
  reservePct = 20,
}: OutageFooterProps) {
  const nearReserve = socPct - reservePct <= 10;
  const maxBackupKw = Math.max(5, dischargeKw * 1.5, usableCapacityKwh * 0.4);
  const progressValue = Math.min(100, (Math.max(0, dischargeKw) / maxBackupKw) * 100);
  const solarActive = solarProducingKw > 0.1;

  return (
    <div className="space-y-2 border-t border-amber-400/25 bg-gradient-to-r from-amber-500/[0.04] via-transparent to-amber-500/[0.04] px-4 py-3">
      <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <span>Load vs backup capacity</span>
        <span className="tabular-nums text-amber-200/90">
          {Math.max(0, dischargeKw).toFixed(1)} / {maxBackupKw.toFixed(1)} kW
        </span>
      </div>
      <Progress value={progressValue} className="h-1.5" />
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {solarActive ? (
            <>
              <Sun className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
              Solar is recharging the battery now.
            </>
          ) : nearReserve ? (
            <span className="font-medium text-amber-300/90">
              Approaching reserve — non-essential loads will reduce automatically.
            </span>
          ) : (
            <>Solar will recharge the battery when sunlight returns.</>
          )}
        </div>
        <Link
          to="/outage-history"
          className="inline-flex items-center gap-1 font-medium text-amber-200/80 transition-colors hover:text-amber-100"
        >
          Outage history
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export default OutageFooter;
