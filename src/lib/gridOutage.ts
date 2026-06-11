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

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3 — Detection
// ─────────────────────────────────────────────────────────────────────────────

export type OutageSource = 'tesla' | 'enphase' | 'solaredge' | 'unknown';

export interface OutageSignal {
  isOutage: boolean;
  source: OutageSource;
}

function getPath(obj: unknown, key: string): unknown {
  if (obj == null || typeof obj !== 'object') return undefined;
  return (obj as Record<string, unknown>)[key];
}

function pickField(payload: unknown, keys: string[]): unknown {
  if (payload == null) return undefined;
  for (const k of keys) {
    const v = getPath(payload, k);
    if (v != null) return v;
    const resp = getPath(payload, 'response');
    const fromResp = getPath(resp, k);
    if (fromResp != null) return fromResp;
    const data = getPath(payload, 'data');
    const fromData = getPath(data, k);
    if (fromData != null) return fromData;
  }
  return undefined;
}

/**
 * Tesla off-grid detector.
 *
 * NOTE: We removed the old grid≈0 + battery-discharge heuristic because it
 * falsely triggered during normal self-consumption (Powerwall covering home
 * load while the grid is connected — `grid_power` is genuinely ~0 by design).
 * Only an explicit `grid_status = "OffGrid" / "Islanded" / "Inactive" /
 * "Backup" / "BackupReady"` (or `island_status = off_grid|islanded`) now
 * triggers outage mode. If Tesla's `grid_status` signal ever becomes
 * unreliable, we can re-enable the heuristic behind a dev flag.
 *
 * Decision order:
 *   1. Explicit "Active" / "OnGrid" status → always false.
 *   2. Explicit off-grid / backup status → true.
 *   3. Otherwise → false. (No behavior fallback.)
 */
export function detectTeslaOutage(payload: unknown): boolean {
  if (!payload) return false;

  const gridStatusRaw = pickField(payload, ['grid_status', 'energy_sites.0.grid_status']);
  const islandRaw = pickField(payload, ['island_status']);
  const gs = typeof gridStatusRaw === 'string' ? gridStatusRaw.trim().toLowerCase() : '';
  const is = typeof islandRaw === 'string' ? islandRaw.trim().toLowerCase() : '';

  // 1. Positive on-grid status always wins.
  if (gs === 'active' || gs === 'ongrid' || gs === 'on_grid' || is === 'on_grid') {
    if (import.meta.env.DEV) {
      console.debug('[gridOutage] decision=false reason=explicit-active', { gs, is });
    }
    return false;
  }

  // 2. Explicit off-grid / backup status.
  const OFF_STATES = new Set([
    'offgrid', 'off_grid', 'islanded', 'inactive', 'backup', 'backupready', 'backup_ready',
  ]);
  if (OFF_STATES.has(gs) || is === 'off_grid' || is === 'islanded') {
    if (import.meta.env.DEV) {
      console.debug('[gridOutage] decision=true reason=explicit-off', { gs, is });
    }
    return true;
  }

  // 3. No explicit signal → assume on-grid. Self-consumption is
  // indistinguishable from outage without a real `grid_status` flag.
  if (import.meta.env.DEV) {
    console.debug('[gridOutage] decision=false reason=no-explicit-off-status', { gs, is });
  }
  return false;
}

/**
 * Strict variant: same rules as `detectTeslaOutage` — explicit off-grid
 * status only. Used by `useGridOutage` to flip Outage Mode after a shorter
 * (~8s) debounce when the signal is clear.
 */
export function isUnambiguousTeslaOutage(payload: unknown): boolean {
  if (!payload) return false;
  const gridStatusRaw = pickField(payload, ['grid_status', 'energy_sites.0.grid_status']);
  const islandRaw = pickField(payload, ['island_status']);
  const gs = typeof gridStatusRaw === 'string' ? gridStatusRaw.trim().toLowerCase() : '';
  const is = typeof islandRaw === 'string' ? islandRaw.trim().toLowerCase() : '';

  if (gs === 'active' || gs === 'ongrid' || gs === 'on_grid' || is === 'on_grid') return false;

  const OFF_STATES = new Set([
    'offgrid', 'off_grid', 'islanded', 'inactive', 'backup', 'backupready', 'backup_ready',
  ]);
  return OFF_STATES.has(gs) || is === 'off_grid' || is === 'islanded';
}


/** OR-combine multiple per-OEM detectors. */
export function combineOutageSignals(...signals: OutageSignal[]): OutageSignal {
  const hit = signals.find((s) => s.isOutage);
  if (hit) return hit;
  return { isOutage: false, source: 'unknown' };
}


