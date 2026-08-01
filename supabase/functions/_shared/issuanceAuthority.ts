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
  const hasVehicle = devices.some((d) => VEHICLE_TYPES.has(d.device_type));
  if (hasVehicle) {
    for (const d of devices) {
      if (!EVSE_TYPES.has(d.device_type)) continue;
      out.push({
        device_id: d.device_id,
        data_type: 'ev_charging',
        reason:
          'Observer: a connected vehicle reports its own charging energy from its onboard meter, ' +
          'which is authoritative. EVSE energy would double-count the same electrons.',
      });
    }
  }

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
