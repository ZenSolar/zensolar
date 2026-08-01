/**
 * FreshnessNote — the single, consistent way a live readout states its own age.
 * Never render a telemetry-backed number on a live surface without one.
 */
import { freshnessLabel, isStaleReading } from '@/lib/telemetryFreshness';
import { cn } from '@/lib/utils';

export function FreshnessNote({
  iso,
  fresh,
  className,
}: {
  iso: string | null | undefined;
  fresh: boolean;
  className?: string;
}) {
  const label = freshnessLabel(iso, fresh);
  const muted = !fresh || isStaleReading(iso);
  return (
    <span
      className={cn(
        'text-[10px] leading-snug tabular-nums',
        muted ? 'text-muted-foreground/70' : 'text-primary/70',
        className,
      )}
      title={iso ? new Date(iso).toLocaleString() : undefined}
    >
      {label}
    </span>
  );
}
