/**
 * CARD FRESHNESS — one badge per card, and it always states the age of the
 * WORST in-scope signal.
 *
 * A card that claims "UPDATED 0S AGO" in its header while a panel two
 * components below claims "STALE · 1 HR AGO" for the same household is not
 * two opinions, it is one broken instrument. So: the card's timestamp is the
 * OLDEST timestamp among all in-scope signals. Not an average, not the
 * newest, not per-component.
 *
 * In scope:
 *   - Solar meter, battery meter, grid CT: always.
 *   - Vehicle telemetry: only for vehicles that are claimed AND currently
 *     expected to report. An unclaimed or never-connected vehicle must not
 *     drag the badge down.
 */

export const CARD_STALE_AFTER_MS = 60 * 60 * 1000; // 1 hr
export const CARD_DEAD_AFTER_MS = 24 * 60 * 60 * 1000; // 1 day

export type CardFreshnessState = 'pending' | 'fresh' | 'stale' | 'dead';

export interface CardFreshnessSignal {
  /** Reading timestamp (sample_at preferred, cached_at as fallback). */
  iso: string | null | undefined;
  /** False when this signal is not currently expected to report. */
  inScope?: boolean;
}

export interface CardFreshness {
  /** Oldest in-scope timestamp — the one the badge speaks for. */
  iso: string | null;
  state: CardFreshnessState;
  /** Uppercase badge copy, e.g. "UPDATED 42S AGO" / "STALE · 3 HRS AGO". */
  label: string;
  /** Tailwind classes for the badge pill. */
  className: string;
  ageMs: number | null;
}

function ageLabel(ms: number): string {
  const secs = Math.max(0, Math.floor(ms / 1000));
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'}`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

export function computeCardFreshness(
  signals: CardFreshnessSignal[],
  now: number = Date.now(),
): CardFreshness {
  const times = signals
    .filter((s) => s.inScope !== false && !!s.iso)
    .map((s) => new Date(s.iso as string).getTime())
    .filter((t) => Number.isFinite(t));

  if (times.length === 0) {
    return {
      iso: null,
      state: 'pending',
      label: 'SYNC PENDING',
      className: 'bg-muted/40 text-muted-foreground ring-muted/50',
      ageMs: null,
    };
  }

  const oldest = Math.min(...times);
  const ageMs = Math.max(0, now - oldest);
  const iso = new Date(oldest).toISOString();

  if (ageMs > CARD_DEAD_AFTER_MS) {
    return {
      iso,
      state: 'dead',
      label: 'GONE DARK · RETRY NOW',
      className: 'bg-red-500/15 text-red-300 ring-red-500/35',
      ageMs,
    };
  }
  if (ageMs > CARD_STALE_AFTER_MS) {
    return {
      iso,
      state: 'stale',
      label: `STALE · ${ageLabel(ageMs).toUpperCase()} AGO`,
      className: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
      ageMs,
    };
  }
  return {
    iso,
    state: 'fresh',
    label: `UPDATED ${ageLabel(ageMs).toUpperCase()} AGO`,
    className: 'bg-primary/20 text-primary ring-primary/30',
    ageMs,
  };
}
