/**
 * Pillar 4 — Anti-Double-Count: cross-source overlap detection.
 *
 * The DB enforces (user_id, event_fingerprint) uniqueness per table. This
 * helper detects the *cross-table* case the DB can't: the same physical
 * charging session reported by two different hardware paths (e.g. Tesla
 * onboard logger vs. Wallbox meter) within a tolerance window.
 *
 * Pure + deterministic so it runs identically in client, edge function, and
 * unit tests. Mirrors and extends src/lib/originVerification.ts.
 *
 * If you change the windows or fields here, update the PoG page rules and
 * src/lib/__tests__/crossSourceOverlap.test.ts.
 */

export interface ChargingEvent {
  /** Unique row id from whatever source table this came from. */
  id: string;
  /** Source table identifier — used to tell which row to drop. */
  source: 'home_charging_sessions' | 'charging_sessions' | 'energy_production';
  /** Provider (tesla, wallbox, ...) — preferred source wins ties. */
  provider: string;
  /** ISO start time of the session. */
  startedAt: string;
  /** kWh delivered in this session. */
  energyKwh: number;
}

export interface OverlapPair {
  keep: ChargingEvent;
  drop: ChargingEvent;
  reason: 'time_window_collision';
  deltaMinutes: number;
  energyDiffPct: number;
}

export interface OverlapOptions {
  /** Max minutes between start times to count as the same plug-in. */
  windowMinutes?: number;
  /** Max relative kWh difference (0..1) to count as the same event. */
  maxEnergyDiffPct?: number;
  /**
   * Provider preference. Earlier = preferred (kept). Default: dedicated
   * hardware (wallbox) wins over vehicle-reported (tesla) because the meter
   * is purpose-built for billing-grade measurement.
   */
  providerPreference?: string[];
}

const DEFAULTS: Required<OverlapOptions> = {
  windowMinutes: 15,
  maxEnergyDiffPct: 0.1, // 10% — accounts for AC↔DC + meter calibration
  providerPreference: ['wallbox', 'enphase', 'solaredge', 'tesla'],
};

/**
 * Returns the pairs of events that look like the same physical session
 * reported by two different sources. Caller decides whether to drop, merge,
 * or flag.
 */
export function verifyNoCrossSourceOverlap(
  events: ChargingEvent[],
  opts: OverlapOptions = {},
): OverlapPair[] {
  const cfg = { ...DEFAULTS, ...opts };
  const sorted = [...events].sort(
    (a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt),
  );
  const pairs: OverlapPair[] = [];
  const consumed = new Set<string>();
  const rank = (p: string) => {
    const i = cfg.providerPreference.indexOf(p.toLowerCase());
    return i === -1 ? cfg.providerPreference.length : i;
  };

  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    if (consumed.has(a.id)) continue;
    for (let j = i + 1; j < sorted.length; j++) {
      const b = sorted[j];
      if (consumed.has(b.id)) continue;
      const dtMin = (Date.parse(b.startedAt) - Date.parse(a.startedAt)) / 60_000;
      if (dtMin > cfg.windowMinutes) break;
      if (a.provider.toLowerCase() === b.provider.toLowerCase()) continue;

      const big = Math.max(Math.abs(a.energyKwh), Math.abs(b.energyKwh), 0.0001);
      const diffPct = Math.abs(a.energyKwh - b.energyKwh) / big;
      if (diffPct > cfg.maxEnergyDiffPct) continue;

      const aWins = rank(a.provider) <= rank(b.provider);
      const keep = aWins ? a : b;
      const drop = aWins ? b : a;
      pairs.push({
        keep,
        drop,
        reason: 'time_window_collision',
        deltaMinutes: Math.round(dtMin * 10) / 10,
        energyDiffPct: Math.round(diffPct * 1000) / 1000,
      });
      consumed.add(drop.id);
      if (drop.id === a.id) break;
    }
  }
  return pairs;
}
