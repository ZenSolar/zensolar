import { useMemo } from 'react';
import { AlertTriangle, BatteryCharging, Sun } from 'lucide-react';
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
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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
  const chipTone = nearReserve
    ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
    : 'border-primary/30 bg-primary/10 text-primary';

  const maxBackupKw = Math.max(dischargeKw * 1.5, 5);
  const progressValue = Math.min(100, (Math.max(0, dischargeKw) / maxBackupKw) * 100);
  const solarActive = solarProducingKw > 0.1;

  return (
    <section
      aria-label="Grid outage active"
      data-testid="outage-mode-panel"
      className={[
        'overflow-hidden rounded-xl border border-primary/25',
        'bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_65%),hsl(var(--card)/0.6)]',
        'shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05),0_8px_30px_-8px_hsl(220_60%_4%/0.6)]',
        className ?? '',
      ].join(' ')}
    >
      {/* Banner */}
      <header className="flex items-center justify-between gap-3 border-b border-primary/15 bg-background/30 px-4 py-2.5">
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          Grid Outage Active
        </div>
        <div className="text-[11px] text-muted-foreground">
          Since {formatStartedAt(outageStartedAt)}
        </div>
      </header>

      {/* Hero estimate */}
      <div className="px-4 pt-5 pb-3 text-center">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Estimated backup remaining
        </div>
        <div className="mt-1 text-4xl font-bold tabular-nums text-foreground">
          {estimate.label}
        </div>
      </div>

      {/* Metric + SOC */}
      <div className="grid grid-cols-1 gap-2 px-4 sm:grid-cols-2">
        <div className="rounded-lg border border-primary/15 bg-background/45 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <BatteryCharging className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            From Battery
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {Math.max(0, dischargeKw).toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">kW</span>
          </div>
        </div>

        <div className="rounded-lg border border-primary/15 bg-background/45 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Battery State
          </div>
          <div className="mt-1">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${chipTone}`}
            >
              <BatteryCharging className="h-3 w-3" aria-hidden="true" />
              {Math.round(socPct)}% • Providing Backup Power
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span>Current load vs backup capacity</span>
          <span className="tabular-nums">{Math.round(progressValue)}%</span>
        </div>
        <Progress value={progressValue} className="mt-1.5 h-1.5" />
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-3">
        {solarActive ? (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sun className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Solar will recharge the battery when available.
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground">
            Your home is safely running on stored battery power.
          </div>
        )}
      </div>
    </section>
  );
}

export default OutageModePanel;
