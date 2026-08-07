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
// Vehicle / EVSE type sets intentionally removed: charging authority is no
// longer a device-level decision on the client.


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

  // CHARGING: no device-level rule. Charger authority is resolved per row by
  // the residual method in `_shared/issuanceAuthority.ts` — a charger earns on
  // the energy no connected vehicle accounts for. A charger is therefore
  // "Metered" in the cockpit even when a vehicle is present.

  return out;
}


export type DeviceClass = 'metered' | 'observer';

/**
 * What a device physically measures. Authority is resolved PER CAPABILITY, so
 * a device can be the source of record for one quantity and an observer for
 * another. A Powerwall next to a dedicated inverter is the clearest case: its
 * site CT clamps observe the same roof (solar → observer), but the pack's own
 * charge/discharge meter is unique on the account (battery → metered).
 */
const DEVICE_CAPABILITIES: Record<string, string[]> = {
  solar: ['solar'],
  solar_system: ['solar'],
  pv: ['solar'],
  powerwall: ['solar', 'battery'],
  battery: ['solar', 'battery'],
  vehicle: ['charging'],
  wall_connector: ['charging'],
  home_charger: ['charging'],
  ev_charger: ['charging'],
};

const CAPABILITY_LABEL: Record<string, string> = {
  solar: 'Solar',
  battery: 'Battery',
  charging: 'Charging',
};

export interface DeviceClassInfo {
  /** Observer only when EVERY capability the device measures is excluded. */
  deviceClass: DeviceClass;
  /** Capabilities this device reports. */
  capabilities: string[];
  /** Capabilities another device is the source of record for. */
  excludedTypes: string[];
  /** Capabilities this device is counted on. */
  meteredTypes: string[];
  reason?: string;
  authoritativeName?: string | null;
}

export function capabilityLabel(type: string): string {
  return CAPABILITY_LABEL[type] ?? type;
}

/** Derived at render — never stored. Class changes with what else is connected. */
export function classifyDevices(
  devices: AuthorityDevice[],
): Record<string, DeviceClassInfo> {
  const exclusions = resolveExclusions(devices);
  const out: Record<string, DeviceClassInfo> = {};
  for (const d of devices) {
    const capabilities = DEVICE_CAPABILITIES[d.device_type] ?? [];
    const mine = exclusions.filter((e) => e.device_id === d.device_id);
    const excludedTypes = mine.map((e) => e.data_type).filter((t) => capabilities.includes(t));
    const meteredTypes = capabilities.filter((c) => !excludedTypes.includes(c));
    const first = mine[0];
    out[d.device_id] = {
      deviceClass:
        capabilities.length > 0 && meteredTypes.length === 0 ? 'observer' : 'metered',
      capabilities,
      excludedTypes,
      meteredTypes,
      reason: first?.reason,
      authoritativeName: first?.authoritative_name ?? null,
    };
  }
  return out;
}

/** True when another device is the source of record for this quantity. */
export function isExcludedFor(
  info: DeviceClassInfo | undefined,
  dataType: string,
): boolean {
  return !!info?.excludedTypes.includes(dataType);
}
