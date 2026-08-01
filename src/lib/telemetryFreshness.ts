/**
 * Freshness labelling — one rule for every live readout.
 *
 * A premium instrument states when it was last read. Every telemetry-backed
 * number on a live surface must carry one of these labels; an unqualified
 * number is not allowed.
 *
 *   fresh  -> "as of 2 min ago"
 *   cached -> "cached · 2 min ago · live fetch failed"
 *   none   -> "no reading yet"
 */

export function formatRelativeAge(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const secs = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (secs < 45) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function freshnessLabel(iso: string | null | undefined, fresh: boolean): string {
  const age = formatRelativeAge(iso);
  if (!age) return 'no reading yet';
  return fresh ? `as of ${age}` : `cached · ${age} · live fetch failed`;
}

/** True once a reading is old enough that it should read as amber, not live. */
export function isStaleReading(iso: string | null | undefined, staleAfterMs = 15 * 60 * 1000): boolean {
  if (!iso) return true;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return true;
  return Date.now() - t > staleAfterMs;
}

/**
 * Exception-only freshness.
 *
 * A card whose readouts all come from one poll states its age ONCE, in the
 * card header. A per-row note is only meaningful when that row DIVERGES from
 * the card: no reading yet, a cached row served after a failed live fetch, or
 * a reading materially older than the card's own timestamp.
 * Returns null when the row agrees with the card — label exceptions, not everything.
 */
export function freshnessException(
  iso: string | null | undefined,
  fresh: boolean,
  cardIso: string | null | undefined,
  divergeAfterMs = 5 * 60 * 1000,
): { label: string; tone: 'pending' | 'cached' | 'stale' } | null {
  if (!iso) return { label: 'no reading yet', tone: 'pending' };
  if (!fresh) return { label: `cached · ${formatRelativeAge(iso)} · live fetch failed`, tone: 'cached' };
  if (isStaleReading(iso)) return { label: `stale · ${formatRelativeAge(iso)}`, tone: 'stale' };

  const t = new Date(iso).getTime();
  const c = cardIso ? new Date(cardIso).getTime() : NaN;
  if (Number.isFinite(t) && Number.isFinite(c) && c - t > divergeAfterMs) {
    return { label: `as of ${formatRelativeAge(iso)}`, tone: 'stale' };
  }
  return null;
}
