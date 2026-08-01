/**
 * CLIENT MIRROR of `supabase/functions/_shared/issuanceAuthority.ts`.
 *
 * The rule is identical and must stay identical: a device is METERED for a
 * capability when it is the single purpose-built meter for that capability on
 * the account. Anything else reporting the same physical quantity is an
 * OBSERVER — shown in the cockpit, not counted in issuance.
 *
 * Authority is derived from measurement SCOPE, never from location, address
 * or device count. Two inverters each metering their own array are disjoint
 * and both stay authoritative; an inverter plus a site-level meter spanning it
 * overlap, and the site-level source is the observer.
 *
 * This is a DISPLAY mirror only. Nothing here reaches the mint path — the edge
 * function remains the sole authority for issuance.
 */

export interface AuthorityDevice {
  device_id: string;
  device_type: string;
  provider: string;
  device_name?: string | null;
}

export interface AuthorityExclusion {
  device_id: string;
  data_type: string;
  reason: string;
  /** The device that is the more precise meter for this quantity. */
  authoritative_device_id?: string;
  authoritative_name?: string | null;
}

const DEDICATED_SOLAR_PROVIDERS = new Set(['enphase', 'solaredge']);
const SOLAR_DEVICE_TYPES = new Set(['solar', 'solar_system', 'pv']);
const VEHICLE_TYPES = new Set(['vehicle', 'ev', 'tesla_vehicle']);
const EVSE_TYPES = new Set(['wall_connector', 'home_charger', 'ev_charger', 'wallbox']);

export function resolveExclusions(devices: AuthorityDevice[]): AuthorityExclusion[] {
  const out: AuthorityExclusion[] = [];

  const dedicatedInverter = devices.find(
    (d) => SOLAR_DEVICE_TYPES.has(d.device_type) && DEDICATED_SOLAR_PROVIDERS.has(d.provider),
  );
  if (dedicatedInverter) {
    for (const d of devices) {
      if (d.device_id === dedicatedInverter.device_id) continue;
      const measuresSolar =
        d.device_type === 'powerwall' ||
        d.device_type === 'battery' ||
        SOLAR_DEVICE_TYPES.has(d.device_type);
      if (!measuresSolar) continue;
      out.push({
        device_id: d.device_id,
        data_type: 'solar',
        reason: 'A dedicated inverter measures this roof more precisely.',
        authoritative_device_id: dedicatedInverter.device_id,
        authoritative_name: dedicatedInverter.device_name ?? null,
      });
    }
  }

  // Temporary over-block, mirrored from the edge module so the UI never claims
  // a charger is metered while the mint path treats it as an observer.
  const vehicle = devices.find((d) => VEHICLE_TYPES.has(d.device_type));
  if (vehicle) {
    for (const d of devices) {
      if (!EVSE_TYPES.has(d.device_type)) continue;
      out.push({
        device_id: d.device_id,
        data_type: 'ev_charging',
        reason: "Your vehicle's onboard meter measures this charging more precisely.",
        authoritative_device_id: vehicle.device_id,
        authoritative_name: vehicle.device_name ?? null,
      });
    }
  }

  return out;
}

export type DeviceClass = 'metered' | 'observer';

/** Derived at render — never stored. Class changes with what else is connected. */
export function classifyDevices(
  devices: AuthorityDevice[],
): Record<string, { deviceClass: DeviceClass; reason?: string; authoritativeName?: string | null }> {
  const exclusions = resolveExclusions(devices);
  const byId = new Map(exclusions.map((e) => [e.device_id, e]));
  const out: Record<string, { deviceClass: DeviceClass; reason?: string; authoritativeName?: string | null }> = {};
  for (const d of devices) {
    const e = byId.get(d.device_id);
    out[d.device_id] = e
      ? { deviceClass: 'observer', reason: e.reason, authoritativeName: e.authoritative_name }
      : { deviceClass: 'metered' };
  }
  return out;
}
