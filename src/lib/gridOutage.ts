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
 * Decision order:
 *   1. Explicit "Active" / "OnGrid" status → always false (never override
 *      a positive on-grid signal — homes self-consume from the Powerwall
 *      all the time while still grid-connected).
 *   2. Explicit off-grid / backup status (`OffGrid`, `Islanded`, `Inactive`,
 *      `Backup`, `BackupReady`, `island_status=off_grid|islanded`) → true.
 *   3. Behavior fallback when status is missing/unknown: grid ≈ 0 kW AND
 *      battery clearly discharging AND home actually drawing real load.
 *
 * Dev tracing: emits a single `console.debug('[gridOutage] ...')` per call
 * so the decision path is visible in the field. Gated by `import.meta.env.DEV`.
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

  // 3. Behavior fallback — infer from power flows when status is missing.
  const gridPowerRaw = pickField(payload, ['grid_power']);
  const batteryPowerRaw = pickField(payload, ['battery_power']);
  const loadPowerRaw = pickField(payload, ['load_power']);
  const gridPower = typeof gridPowerRaw === 'number' ? gridPowerRaw : null;
  const batteryPower = typeof batteryPowerRaw === 'number' ? batteryPowerRaw : null;
  const loadPower = typeof loadPowerRaw === 'number' ? loadPowerRaw : null;
  if (gridPower === null || batteryPower === null || loadPower === null) {
    if (import.meta.env.DEV) {
      console.debug('[gridOutage] decision=false reason=insufficient-data', {
        gs, is, gridPower, batteryPower, loadPower,
      });
    }
    return false;
  }

  // Normalize watts → kW.
  const normLoad = Math.abs(loadPower) > 100 ? loadPower / 1000 : loadPower;
  const normGrid = Math.abs(gridPower) > 100 ? gridPower / 1000 : gridPower;
  const normBatt = Math.abs(batteryPower) > 100 ? batteryPower / 1000 : batteryPower;

  // Tuned to fire on the user's real scenario (Powerwall ~0.6 kW out,
  // grid ~0 kW, home ~0.6 kW) without false-triggering on idle drift.
  const gridZero = Math.abs(normGrid) <= 0.10;
  const battDischarging = normBatt >= 0.20;
  const homeDrawing = normLoad >= 0.10;
  const decision = gridZero && battDischarging && homeDrawing;

  if (import.meta.env.DEV) {
    console.debug('[gridOutage] decision=' + decision + ' reason=heuristic', {
      gs, is, gridKw: normGrid, battKw: normBatt, loadKw: normLoad,
      gridZero, battDischarging, homeDrawing,
    });
  }
  return decision;
}

/** OR-combine multiple per-OEM detectors. */
export function combineOutageSignals(...signals: OutageSignal[]): OutageSignal {
  const hit = signals.find((s) => s.isOutage);
  if (hit) return hit;
  return { isOutage: false, source: 'unknown' };
}

