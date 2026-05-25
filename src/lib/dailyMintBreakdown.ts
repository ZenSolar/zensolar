/**
 * Deterministic daily breakdown generator for pending mint totals.
 *
 * Given a pending total (e.g. 4,200 kWh of solar since last mint), generates a
 * realistic-looking per-day series that SUMS exactly to the total. Variance is
 * shaped by category-specific patterns:
 *  - solar: midday-skewed weekly arc with weather dips
 *  - battery: steadier, slightly higher on cloudy/peak days
 *  - ev_miles / charging: weekday bias (commuting)
 *  - supercharging: occasional spike days (road trips), zero on most days
 *  - home_charging: even-ish nightly with a dip on weekends away
 *
 * Used in demo mode so the mint dialog can show "where did these tokens
 * come from?" by day. Live mode keeps daily=undefined and falls back to the
 * existing summary UI.
 */

export type DailyCategory =
  | 'solar'
  | 'battery'
  | 'ev_miles'
  | 'charging'
  | 'supercharging'
  | 'home_charging';

export interface DailyPoint {
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** Localized weekday label, e.g. "Mon" */
  weekday: string;
  /** Raw value in the category's native unit (kWh or mi) */
  value: number;
}

export interface DailyBreakdown {
  unit: 'kWh' | 'mi';
  total: number;
  points: DailyPoint[];
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function shapeWeights(category: DailyCategory, days: number, rand: () => number): number[] {
  const out: number[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dow = d.getDay(); // 0 = Sun

    let base = 1;
    const jitter = 0.75 + rand() * 0.5; // 0.75–1.25

    switch (category) {
      case 'solar': {
        // Weekly arc + weather dip
        const weather = rand() < 0.18 ? 0.35 + rand() * 0.3 : 1; // cloudy ~18% of days
        base = (0.85 + 0.3 * Math.sin((i / days) * Math.PI)) * weather;
        break;
      }
      case 'battery':
        base = 0.9 + rand() * 0.25;
        break;
      case 'ev_miles':
      case 'charging':
      case 'home_charging':
        // Higher on weekdays (commute)
        base = (dow === 0 || dow === 6 ? 0.55 : 1.05) + rand() * 0.15;
        break;
      case 'supercharging':
        // Mostly zero, occasional road-trip spikes
        base = rand() < 0.22 ? 1.5 + rand() * 2.5 : 0;
        break;
    }
    out.push(Math.max(0, base * jitter));
  }
  // Guarantee at least one non-zero point (sparse supercharging case)
  if (out.every((w) => w === 0)) out[out.length - 1] = 1 as number;
  return out;
}

function weekdayLabel(d: Date): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
}

function isoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function generateDailyBreakdown(
  category: DailyCategory,
  total: number,
  opts?: { days?: number; seed?: number | string; unit?: 'kWh' | 'mi' },
): DailyBreakdown {
  const days = Math.max(1, opts?.days ?? 14);
  const unit: 'kWh' | 'mi' = opts?.unit ?? (category === 'ev_miles' ? 'mi' : 'kWh');
  const seedNum =
    typeof opts?.seed === 'string'
      ? hashString(`${opts.seed}|${category}|${days}`)
      : (opts?.seed ?? hashString(`${category}|${days}`));
  const rand = mulberry32(seedNum >>> 0);

  if (total <= 0) {
    const points: DailyPoint[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      points.push({ date: isoDate(d), weekday: weekdayLabel(d), value: 0 });
    }
    return { unit, total: 0, points };
  }

  const weights = shapeWeights(category, days, rand);
  const sumW = weights.reduce((a, b) => a + b, 0) || 1;

  // Allocate proportionally, then fix rounding drift on the last non-zero day.
  const raw = weights.map((w) => (w / sumW) * total);
  const rounded = raw.map((v) => Math.round(v));
  let drift = total - rounded.reduce((a, b) => a + b, 0);
  if (drift !== 0) {
    for (let i = rounded.length - 1; i >= 0 && drift !== 0; i--) {
      if (rounded[i] > 0 || drift > 0) {
        const next = Math.max(0, rounded[i] + drift);
        drift -= next - rounded[i];
        rounded[i] = next;
      }
    }
  }

  const points: DailyPoint[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    points.push({ date: isoDate(d), weekday: weekdayLabel(d), value: rounded[i] });
  }

  return { unit, total: rounded.reduce((a, b) => a + b, 0), points };
}
