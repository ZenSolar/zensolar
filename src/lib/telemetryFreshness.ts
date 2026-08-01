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
