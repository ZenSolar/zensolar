/**
 * Grid Outage utilities.
 *
 * Phase 1 (this file): backup-time estimator only.
 * Phase 2 (later): detection layer (`detectTeslaOutage`, `useGridOutage`).
 */

export interface BackupEstimateInput {
  socPct: number;
  usableCapacityKwh: number;
  /** Positive kW currently flowing out of the battery to the home. */
  currentDischargeKw: number;
  /** Backup reserve floor (default 20%). */
  reservePct?: number;
  /** Optional key to keep separate smoothing buffers per battery source. */
  smoothingKey?: string;
}

export interface BackupEstimate {
  hours: number;
  label: string;
}

const SMOOTHING_WINDOW = 5;
const smoothingBuffers = new Map<string, number[]>();

function smoothDischarge(key: string, sample: number): number {
  const buf = smoothingBuffers.get(key) ?? [];
  buf.push(sample);
  if (buf.length > SMOOTHING_WINDOW) buf.shift();
  smoothingBuffers.set(key, buf);
  // Exponential weighting — newer samples count more.
  let weightSum = 0;
  let valSum = 0;
  buf.forEach((v, i) => {
    const w = Math.pow(1.6, i);
    weightSum += w;
    valSum += v * w;
  });
  return weightSum > 0 ? valSum / weightSum : sample;
}

/** Reset the rolling discharge buffer (test helper). */
export function _resetBackupSmoothing(key?: string) {
  if (key) smoothingBuffers.delete(key);
  else smoothingBuffers.clear();
}

export function formatBackupLabel(hours: number): string {
  if (!Number.isFinite(hours)) return '>24 hours';
  if (hours <= 0) return 'Reserve reached';
  if (hours > 24) return '>24 hours';
  if (hours >= 1) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m >= 15 && m < 60) return `~${h}h ${m}m`;
    return `~${h}h`;
  }
  // Sub-hour — round to nearest 5 minutes, floor at 5.
  const mins = Math.max(5, Math.round((hours * 60) / 5) * 5);
  return `~${mins} min`;
}

export function estimateBackupTime(input: BackupEstimateInput): BackupEstimate {
  const {
    socPct,
    usableCapacityKwh,
    currentDischargeKw,
    reservePct = 20,
    smoothingKey = 'default',
  } = input;

  const safeSoc = Math.max(0, Math.min(100, socPct));
  const safeReserve = Math.max(0, Math.min(100, reservePct));

  if (safeSoc <= safeReserve) {
    return { hours: 0, label: 'Reserve reached' };
  }

  const smoothed = smoothDischarge(smoothingKey, Math.max(0, currentDischargeKw));

  // Idle or charging — backup time is effectively unbounded for display.
  if (smoothed < 0.05) {
    return { hours: Infinity, label: '>24 hours' };
  }

  const usableKwh = Math.max(0, usableCapacityKwh) * ((safeSoc - safeReserve) / 100);
  const hours = usableKwh / smoothed;

  return { hours, label: formatBackupLabel(hours) };
}
