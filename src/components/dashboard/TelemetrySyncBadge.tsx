import { AlertTriangle, RefreshCw } from 'lucide-react';

interface TelemetrySyncBadgeProps {
  /** 'ok' → renders nothing. 'retrying' → soft amber. 'paused' → tap-to-retry. */
  syncState: 'ok' | 'retrying' | 'paused';
  onRetry?: () => void;
}

/**
 * Small non-blocking indicator surfaced next to the freshness pill on
 * Live Energy cards. Explains why a tile might be frozen so users don't
 * silently stare at stale numbers.
 *
 * - `retrying`: telemetry has failed 3+ times in a row, backoff still active
 * - `paused`: circuit breaker tripped (10+ failures); tap to reset & retry
 */
export function TelemetrySyncBadge({ syncState, onRetry }: TelemetrySyncBadgeProps) {
  if (syncState === 'ok') return null;

  if (syncState === 'retrying') {
    return (
      <span
        role="status"
        className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400 ring-1 ring-amber-500/25"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
        Having trouble syncing — retrying
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onRetry}
      className="inline-flex w-fit items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-destructive ring-1 ring-destructive/30 transition-colors hover:bg-destructive/20"
    >
      <AlertTriangle className="h-3 w-3" />
      Live data paused
      <span className="ml-0.5 inline-flex items-center gap-0.5 text-destructive/80">
        <RefreshCw className="h-3 w-3" /> Tap to retry
      </span>
    </button>
  );
}
