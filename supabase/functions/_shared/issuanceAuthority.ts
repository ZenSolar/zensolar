/**
 * ISSUANCE AUTHORITY — which device may mint a given activity, and which is
 * only an observer.
 *
 * Generalises the solar authority rule to every capability:
 *
 *   A device is AUTHORITATIVE for a capability when it is the single
 *   purpose-built meter for that capability on the account. Any other device
 *   reporting the same physical quantity is an OBSERVER: shown in the
 *   cockpit, never counted in issuance.
 *
 * Applied rules (2026-08-01):
 *
 *   SOLAR      A dedicated inverter (Enphase / SolarEdge) is authoritative
 *              whenever one is connected. A Tesla Powerwall's site CT clamps
 *              measure the SAME roof, so their `solar` rows become observer
 *              rows. The Powerwall's BATTERY export stays fully eligible —
 *              the pack is its own meter and nothing else measures it.
 *
 *   CHARGING   The vehicle's onboard meter is authoritative. A Wall Connector
 *              or any other EVSE is an observer whenever a vehicle is
 *              connected, because the same electrons are already counted by
 *              the car. (Today no EVSE writes issuance rows at all; this
 *              encodes the rule so that stays true by construction.)
 *
 * The mint path calls `filterIssuableRows()` AFTER reading unminted deltas and
 * BEFORE aggregating them. Excluded rows are NOT consumed and NOT credited —
 * they simply are not issuance material.
 */

export interface AuthorityDevice {
  device_id: string;
  device_type: string;
  provider: string;
}

export interface RowLike {
  id: string;
  data_type: string;
  provider: string;
  device_id: string;
}

export interface AuthorityExclusion {
  device_id: string;
  data_type: string;
  reason: string;
}

const DEDICATED_SOLAR_PROVIDERS = new Set(['enphase', 'solaredge']);
const SOLAR_DEVICE_TYPES = new Set(['solar', 'solar_system', 'pv']);
const VEHICLE_TYPES = new Set(['vehicle', 'ev', 'tesla_vehicle']);
const EVSE_TYPES = new Set(['wall_connector', 'home_charger', 'ev_charger', 'wallbox']);

/**
 * Returns the (device_id, data_type) pairs that are observer-only for this
 * account, with the reason each was demoted.
 */
export function resolveExclusions(devices: AuthorityDevice[]): AuthorityExclusion[] {
  const out: AuthorityExclusion[] = [];

  // ── SOLAR ────────────────────────────────────────────────────────────────
  const dedicatedInverter = devices.find(
    (d) => SOLAR_DEVICE_TYPES.has(d.device_type) && DEDICATED_SOLAR_PROVIDERS.has(d.provider),
  );
  if (dedicatedInverter) {
    for (const d of devices) {
      const isSameDevice = d.device_id === dedicatedInverter.device_id;
      if (isSameDevice) continue;
      const measuresSolar =
        d.device_type === 'powerwall' || d.device_type === 'battery' || SOLAR_DEVICE_TYPES.has(d.device_type);
      if (!measuresSolar) continue;
      out.push({
        device_id: d.device_id,
        data_type: 'solar',
        reason:
          `Observer: ${dedicatedInverter.provider} inverter ${dedicatedInverter.device_id} is the ` +
          `authoritative solar meter for this account. This device measures the same roof.`,
      });
    }
  }

  // ── CHARGING ─────────────────────────────────────────────────────────────
  // NO device-level rule. The blanket "any vehicle demotes every EVSE" block
  // that lived here was removed on 2026-08-01: it foreclosed the legitimate
  // case of a non-Tesla EV on a Wallbox, where nothing else meters the car.
  //
  // Charging authority is now resolved PER ROW by `applyChargingResidual()`
  // below — a charger is authoritative for exactly the energy no connected
  // vehicle accounts for.

  return out;
}

export interface FilterResult<T extends RowLike> {
  issuable: T[];
  excluded: T[];
  exclusions: AuthorityExclusion[];
}

export function filterIssuableRows<T extends RowLike>(
  rows: T[],
  devices: AuthorityDevice[],
): FilterResult<T> {
  const exclusions = resolveExclusions(devices);
  if (exclusions.length === 0) return { issuable: rows, excluded: [], exclusions };

  const keys = new Set(exclusions.map((e) => `${e.device_id}|${e.data_type}`));
  const issuable: T[] = [];
  const excluded: T[] = [];
  for (const r of rows) {
    if (keys.has(`${r.device_id}|${r.data_type}`)) excluded.push(r);
    else issuable.push(r);
  }
  return { issuable, excluded, exclusions };
}

// ─────────────────────────────────────────────────────────────────────────────
// RESIDUAL METHOD (E2) — charger authority, resolved per row.
//
//   A charger is authoritative only for energy that no connected vehicle
//   accounts for.
//
// Per calendar day (UTC), the vehicles' own onboard meters are authoritative
// for what they report. The EVSE's issuable energy is the remainder:
//
//   residual = max(0, evse_kwh - vehicle_reported_kwh)
//
// Rows are consumed whole, so the residual cannot be credited fractionally.
// We therefore drop whole EVSE rows, smallest first, until the dropped total
// covers the vehicle-reported total for that day. That is fail-closed: it can
// exclude slightly MORE than the overlap, never less, and it never
// double-counts an electron the car already reported.
// ─────────────────────────────────────────────────────────────────────────────

export interface ChargingRowLike extends RowLike {
  production_wh: number;
  recorded_at: string;
}

export interface ResidualNote {
  day: string;
  device_id: string;
  vehicle_reported_wh: number;
  evse_reported_wh: number;
  evse_excluded_wh: number;
  evse_issuable_wh: number;
}

export interface ResidualResult<T extends ChargingRowLike> {
  issuable: T[];
  excluded: T[];
  notes: ResidualNote[];
}

const CHARGING_DATA_TYPE = 'ev_charging';

export function applyChargingResidual<T extends ChargingRowLike>(
  rows: T[],
  devices: AuthorityDevice[],
): ResidualResult<T> {
  const evseIds = new Set(
    devices.filter((d) => EVSE_TYPES.has(d.device_type)).map((d) => d.device_id),
  );
  const vehicleIds = new Set(
    devices.filter((d) => VEHICLE_TYPES.has(d.device_type)).map((d) => d.device_id),
  );
  if (evseIds.size === 0 || vehicleIds.size === 0) {
    return { issuable: rows, excluded: [], notes: [] };
  }

  const day = (iso: string) => String(iso || '').slice(0, 10);

  // Vehicle-reported charging energy per day (all vehicles on the account).
  const vehicleWhByDay = new Map<string, number>();
  for (const r of rows) {
    if (r.data_type !== CHARGING_DATA_TYPE) continue;
    if (!vehicleIds.has(r.device_id)) continue;
    const d = day(r.recorded_at);
    vehicleWhByDay.set(d, (vehicleWhByDay.get(d) ?? 0) + (Number(r.production_wh) || 0));
  }

  // EVSE rows per day, per charger.
  const evseByKey = new Map<string, T[]>();
  for (const r of rows) {
    if (r.data_type !== CHARGING_DATA_TYPE) continue;
    if (!evseIds.has(r.device_id)) continue;
    const key = `${day(r.recorded_at)}|${r.device_id}`;
    (evseByKey.get(key) ?? evseByKey.set(key, []).get(key)!).push(r);
  }

  const excludedIds = new Set<string>();
  const notes: ResidualNote[] = [];

  for (const [key, group] of evseByKey) {
    const [d, deviceId] = key.split('|');
    const vehicleWh = vehicleWhByDay.get(d) ?? 0;
    const evseWh = group.reduce((s, r) => s + (Number(r.production_wh) || 0), 0);
    let droppedWh = 0;
    if (vehicleWh > 0) {
      const ordered = [...group].sort(
        (a, b) => (Number(a.production_wh) || 0) - (Number(b.production_wh) || 0),
      );
      for (const r of ordered) {
        if (droppedWh >= vehicleWh) break;
        excludedIds.add(r.id);
        droppedWh += Number(r.production_wh) || 0;
      }
    }
    notes.push({
      day: d,
      device_id: deviceId,
      vehicle_reported_wh: vehicleWh,
      evse_reported_wh: evseWh,
      evse_excluded_wh: droppedWh,
      evse_issuable_wh: Math.max(0, evseWh - droppedWh),
    });
  }

  const issuable: T[] = [];
  const excluded: T[] = [];
  for (const r of rows) (excludedIds.has(r.id) ? excluded : issuable).push(r);
  return { issuable, excluded, notes };
}

