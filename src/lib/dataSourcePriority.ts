/**
 * Single Source of Truth (SSOT) — telemetry data source priority per KPI.
 *
 * Hard rule: every KPI pulls from EXACTLY ONE OEM API per user. Never sum or
 * merge the same metric across providers. This module is the canonical
 * priority resolver. All hooks/edge functions that read solar / battery /
 * charging / consumption telemetry MUST route their choice through
 * `pickSource()` or import the rule tables below.
 *
 * Priority rules (in order):
 *
 *   Solar production
 *     1. profiles.solar_installer === 'tesla'      → Tesla solar API
 *     2. profiles.solar_inverter_brand specified    → that brand
 *     3. legacy fallback (Enphase > SolarEdge > Tesla)
 *        — Powerwall site CTs are NEVER used as the solar source.
 *
 *   Battery (discharge/export)
 *     The hardware the user actually owns: Powerwall > Enphase IQ Battery >
 *     SolarEdge Home Battery. Never summed across brands.
 *
 *   Charging energy (home AC + Supercharger)
 *     1. Tesla vehicle connected → Tesla charge_state ONLY
 *        (skip home_charging_sessions to avoid double-count).
 *     2. Otherwise → user's home charger (Wallbox / ChargePoint / etc.).
 *
 *   Home consumption
 *     Follows whichever hardware owns the CTs: Powerwall site > Envoy >
 *     SolarEdge meter.
 *
 * Keep `supabase/functions/_shared/dataSourcePriority.ts` in lockstep.
 */

export type Capability = 'solar' | 'battery' | 'charging' | 'consumption' | 'fsd_miles';
export type Provider = 'tesla' | 'enphase' | 'solaredge' | 'wallbox' | 'chargepoint';

export interface DeviceLike {
  provider: string;
  device_type: string;
  device_id: string;
  device_name?: string | null;
}

export interface ProfileLike {
  solar_installer?: 'tesla' | 'other' | null;
  solar_inverter_brand?: 'enphase' | 'solaredge' | 'tesla' | 'other' | null;
  primary_charging_source?: 'tesla_vehicle' | 'home_charger' | 'none' | null;
}

export interface SourceChoice {
  provider: Provider;
  deviceId: string;
  deviceName?: string | null;
  /** Why this source won — surfaced in diagnostics + audit logs. */
  reason: string;
}

const SOLAR_DEVICE_TYPES = new Set(['solar', 'solar_system', 'pv']);
const BATTERY_DEVICE_TYPES = new Set(['powerwall', 'battery', 'iq_battery', 'encharge', 'home_battery']);
const VEHICLE_DEVICE_TYPES = new Set(['vehicle', 'tesla_vehicle', 'ev']);
const CHARGER_DEVICE_TYPES = new Set(['home_charger', 'ev_charger', 'wall_connector', 'wallbox']);

const SOLAR_FALLBACK: Provider[] = ['enphase', 'solaredge', 'tesla'];
const BATTERY_PRIORITY: Provider[] = ['tesla', 'enphase', 'solaredge'];

export function pickSource(
  capability: Capability,
  profile: ProfileLike | null | undefined,
  devices: DeviceLike[],
): SourceChoice | null {
  const p = profile ?? {};

  if (capability === 'solar') {
    if (p.solar_installer === 'tesla') {
      const d =
        devices.find((x) => SOLAR_DEVICE_TYPES.has(x.device_type) && x.provider === 'tesla') ??
        devices.find((x) => x.device_type === 'powerwall' && x.provider === 'tesla');
      if (d) return { provider: 'tesla', deviceId: d.device_id, deviceName: d.device_name, reason: 'solar_installer=tesla' };
    }
    if (p.solar_inverter_brand && p.solar_inverter_brand !== 'other') {
      const wanted = p.solar_inverter_brand as Provider;
      const d = devices.find((x) => SOLAR_DEVICE_TYPES.has(x.device_type) && x.provider === wanted);
      if (d) return { provider: wanted, deviceId: d.device_id, deviceName: d.device_name, reason: `solar_inverter_brand=${wanted}` };
    }
    for (const prov of SOLAR_FALLBACK) {
      const d = devices.find((x) => SOLAR_DEVICE_TYPES.has(x.device_type) && x.provider === prov);
      if (d) return { provider: prov, deviceId: d.device_id, deviceName: d.device_name, reason: `fallback:${prov}` };
    }
    return null;
  }

  if (capability === 'battery') {
    for (const prov of BATTERY_PRIORITY) {
      const d = devices.find((x) => BATTERY_DEVICE_TYPES.has(x.device_type) && x.provider === prov);
      if (d) return { provider: prov, deviceId: d.device_id, deviceName: d.device_name, reason: `battery:${prov}` };
    }
    return null;
  }

  if (capability === 'charging') {
    const teslaVehicle = devices.find((d) => VEHICLE_DEVICE_TYPES.has(d.device_type) && d.provider === 'tesla');
    if (teslaVehicle) {
      return { provider: 'tesla', deviceId: teslaVehicle.device_id, deviceName: teslaVehicle.device_name, reason: 'tesla_vehicle_present' };
    }
    const charger = devices.find((d) => CHARGER_DEVICE_TYPES.has(d.device_type));
    if (charger) {
      return {
        provider: charger.provider as Provider,
        deviceId: charger.device_id,
        deviceName: charger.device_name,
        reason: `home_charger:${charger.provider}`,
      };
    }
    return null;
  }

  // consumption
  for (const prov of BATTERY_PRIORITY) {
    const d = devices.find((x) => BATTERY_DEVICE_TYPES.has(x.device_type) && x.provider === prov);
    if (d) return { provider: prov, deviceId: d.device_id, deviceName: d.device_name, reason: `consumption:${prov}` };
  }
  return null;
}

/** Multiple potential solar sources — flagged for Deason troubleshooting. */
export function detectSolarConflict(devices: DeviceLike[]): { conflicting: boolean; providers: Provider[] } {
  const solarProviders = new Set<Provider>();
  for (const d of devices) {
    if (SOLAR_DEVICE_TYPES.has(d.device_type)) solarProviders.add(d.provider as Provider);
    if (d.device_type === 'powerwall' && d.provider === 'tesla') solarProviders.add('tesla');
  }
  return { conflicting: solarProviders.size > 1, providers: Array.from(solarProviders) };
}

export function detectChargingConflict(devices: DeviceLike[]): {
  conflicting: boolean;
  hasTeslaVehicle: boolean;
  hasHomeCharger: boolean;
} {
  const hasTeslaVehicle = devices.some((d) => VEHICLE_DEVICE_TYPES.has(d.device_type) && d.provider === 'tesla');
  const hasHomeCharger = devices.some((d) => CHARGER_DEVICE_TYPES.has(d.device_type));
  return { conflicting: hasTeslaVehicle && hasHomeCharger, hasTeslaVehicle, hasHomeCharger };
}
