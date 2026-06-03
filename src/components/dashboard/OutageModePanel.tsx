import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BatteryCharging, ChevronRight, Sun, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { estimateBackupTime } from '@/lib/gridOutage';

export interface OutageModePanelProps {
  socPct: number;
  usableCapacityKwh: number;
  /** Positive kW flowing from battery to home. */
  dischargeKw: number;
  reservePct?: number;
  outageStartedAt: Date | string;
  /** Solar production in kW; > 0.1 shows recharge footer. */
  solarProducingKw?: number;
  className?: string;
  /** Optional smoothing key passed to estimator. */
  smoothingKey?: string;
}

function formatStartedAt(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const clock = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const elapsedMs = Date.now() - d.getTime();
  if (elapsedMs >= 0 && elapsedMs < 60 * 60_000) {
    const mins = Math.max(1, Math.round(elapsedMs / 60_000));
    return `${clock} · ${mins} min ago`;
  }
  return clock;
}

export function OutageModePanel({
  socPct,
  usableCapacityKwh,
  dischargeKw,
  reservePct = 20,
  outageStartedAt,
  solarProducingKw = 0,
  className,
  smoothingKey,
}: OutageModePanelProps) {
  const estimate = useMemo(
    () =>
      estimateBackupTime({
        socPct,
        usableCapacityKwh,
        currentDischargeKw: dischargeKw,
        reservePct,
        smoothingKey,
      }),
    [socPct, usableCapacityKwh, dischargeKw, reservePct, smoothingKey]
  );

  const nearReserve = socPct - reservePct <= 10;

  // Cap reflects realistic household backup capacity, not just the current draw.
  const maxBackupKw = Math.max(5, dischargeKw * 1.5, usableCapacityKwh * 0.4);
  const progressValue = Math.min(100, (Math.max(0, dischargeKw) / maxBackupKw) * 100);
  const solarActive = solarProducingKw > 0.1;

  // SOC bar: fills relative to total range; tinted by proximity to reserve.
  const socBarValue = Math.max(0, Math.min(100, socPct));
  const socTone = nearReserve
    ? 'from-red-500 to-amber-400'
    : socPct < 50
      ? 'from-amber-400 to-amber-300'
      : 'from-amber-300 to-amber-200';

  return (
    <section
      aria-label="Grid outage active"
      data-testid="outage-mode-panel"
      className={[
        'relative overflow-hidden rounded-xl border-2 border-amber-400/40',
        'bg-[radial-gradient(ellipse_at_top,hsl(38_95%_55%/0.10),transparent_60%),radial-gradient(circle_at_50%_120%,hsl(38_95%_55%/0.08),transparent_55%),hsl(var(--card)/0.75)]',
        'shadow-[inset_0_1px_0_hsl(38_95%_70%/0.15),0_0_0_1px_hsl(38_95%_55%/0.12),0_12px_40px_-12px_hsl(38_95%_30%/0.45)]',
        className ?? '',
      ].join(' ')}
    >
      {/* Banner — full-width amber gradient with pulsing icon */}
      <header className="flex items-center justify-between gap-3 border-b border-amber-400/30 bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 px-4 py-3">
        <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-amber-200">
          <AlertTriangle
            className="h-4 w-4 animate-pulse text-amber-300 motion-reduce:animate-none"
            aria-hidden="true"
          />
          Grid Outage Active
        </div>
        <div className="text-[11px] font-medium text-amber-200/70">
          Since {formatStartedAt(outageStartedAt)}
        </div>
      </header>

      {/* Hero estimate */}
      <div className="px-4 pt-6 pb-4 text-center">
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/70">
          Estimated backup remaining
        </div>
        <div className="mt-1.5 text-5xl font-bold tabular-nums tracking-tight text-foreground drop-shadow-[0_0_24px_hsl(38_95%_55%/0.35)]">
          {estimate.label}
        </div>
        <div className="mt-1 text-[11px] font-medium text-muted-foreground">
          Your home is running on stored battery power
        </div>
      </div>

      {/* "From Battery" — promoted full-width hero metric */}
      <div className="mx-4 mb-3 rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-3.5">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/80">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-amber-400/80 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
          </span>
          <Zap className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
          Powering your home now
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tabular-nums text-amber-100">
            {Math.max(0, dischargeKw).toFixed(1)}
          </span>
          <span className="text-sm font-medium text-amber-200/70">kW from battery</span>
        </div>
      </div>

      {/* Battery state with SOC bar */}
      <div className="px-4 pb-1">
        <div className="rounded-lg border border-amber-400/20 bg-background/40 p-3">
          <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BatteryCharging className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
              Battery
            </span>
            <span className="tabular-nums text-amber-200">
              {Math.round(socPct)}% · Providing Backup Power
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-background/70">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${socTone} transition-all duration-500`}
              style={{ width: `${socBarValue}%` }}
            />
          </div>
        </div>
      </div>

      {/* Progress: load vs capacity */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span>Current load vs backup capacity</span>
          <span className="tabular-nums">{Math.max(0, dischargeKw).toFixed(1)} / {maxBackupKw.toFixed(1)} kW</span>
        </div>
        <Progress value={progressValue} className="mt-1.5 h-2" />
      </div>

      {/* Footer */}
      <div className="space-y-2 px-4 pb-4 pt-3">
        {solarActive ? (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sun className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
            Solar is recharging the battery now.
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground">
            Solar will recharge the battery when sunlight returns.
          </div>
        )}
        {nearReserve && (
          <div className="text-[11px] font-medium text-amber-300/90">
            Approaching reserve — non-essential loads will reduce automatically.
          </div>
        )}
        <Link
          to="/outage-history"
          className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-amber-200/80 hover:text-amber-100 transition-colors"
        >
          View outage history
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export default OutageModePanel;
