import { AlertTriangle, MoonStar, RefreshCw } from 'lucide-react';
import { darkLabel, isDarkReading } from '@/lib/telemetryFreshness';

interface TelemetrySyncBadgeProps {
  /** 'ok' → renders nothing (unless the reading has gone dark). 'retrying' → soft amber. 'paused' → tap-to-retry. */
  syncState: 'ok' | 'retrying' | 'paused';
  onRetry?: () => void;
  /**
   * Timestamp of the newest reading behind this card. When it is older than
   * 24h the badge renders a "gone dark" state with a retry affordance even if
   * `syncState` is 'ok' — a latched pause stops polling, so the failure
   * counter freezes and the card would otherwise look healthy while showing a
   * five-day-old number.
   */
  latestIso?: string | null;
}

/**
 * Small non-blocking indicator surfaced next to the freshness pill on
 * Live Energy cards. Explains why a tile might be frozen so users don't
 * silently stare at stale numbers.
 *
 * - `retrying`: telemetry has failed 3+ times in a row, backoff still active
 * - `paused`: circuit breaker tripped (10+ failures); tap to reset & retry
 * - dark: newest reading older than 24h; tap to reset & retry
 */
export function TelemetrySyncBadge({ syncState, onRetry, latestIso }: TelemetrySyncBadgeProps) {
  const dark = isDarkReading(latestIso);

  if (syncState === 'ok' && !dark) return null;

  if (syncState === 'paused' || dark) {
    const paused = syncState === 'paused';
    return (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex w-fit items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-destructive ring-1 ring-destructive/30 transition-colors hover:bg-destructive/20"
      >
        {paused ? <AlertTriangle className="h-3 w-3" /> : <MoonStar className="h-3 w-3" />}
        {paused ? 'Live data paused' : darkLabel(latestIso)}
        <span className="ml-0.5 inline-flex items-center gap-0.5 text-destructive/80">
          <RefreshCw className="h-3 w-3" /> Retry now
        </span>
      </button>
    );
  }

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
