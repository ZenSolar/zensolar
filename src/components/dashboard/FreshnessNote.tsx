/**
 * FreshnessNote — the single, consistent way a live readout states its own age.
 *
 * Two modes:
 *  - Standalone (default): the full "as of …" label. Use where a surface polls
 *    on its own cadence (e.g. the vehicle strip).
 *  - Exception mode (`cardIso` provided): renders NOTHING when the reading
 *    agrees with the card's own timestamp, and a short badge only when it
 *    diverges — pending, cached, or stale. A timestamp repeated identically on
 *    every row conveys nothing; one marked row conveys precisely what matters.
 */
import { freshnessException, freshnessLabel, isStaleReading } from '@/lib/telemetryFreshness';
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

const EXCEPTION_TONE = {
  pending: 'bg-muted/40 text-muted-foreground ring-muted/50',
  cached: 'bg-muted/40 text-muted-foreground ring-muted/50',
  stale: 'bg-amber-500/12 text-amber-300/90 ring-amber-400/25',
} as const;

/** Renders only when this readout diverges from the card's shared freshness. */
export function FreshnessException({
  iso,
  fresh,
  cardIso,
  className,
}: {
  iso: string | null | undefined;
  fresh: boolean;
  cardIso: string | null | undefined;
  className?: string;
}) {
  const ex = freshnessException(iso, fresh, cardIso);
  if (!ex) return null;
  return (
    <span
      className={cn(
        'mt-1.5 inline-flex w-fit items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider tabular-nums ring-1',
        EXCEPTION_TONE[ex.tone],
        className,
      )}
      title={iso ? new Date(iso).toLocaleString() : undefined}
    >
      {ex.label}
    </span>
  );
}
