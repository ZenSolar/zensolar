// Deno-compatible mirror of src/lib/dataSourcePriority.ts. Keep in lockstep.
// See that file for full rules documentation.

export type Capability = 'solar' | 'battery' | 'charging' | 'consumption';
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
      return { provider: charger.provider as Provider, deviceId: charger.device_id, deviceName: charger.device_name, reason: `home_charger:${charger.provider}` };
    }
    return null;
  }
  for (const prov of BATTERY_PRIORITY) {
    const d = devices.find((x) => BATTERY_DEVICE_TYPES.has(x.device_type) && x.provider === prov);
    if (d) return { provider: prov, deviceId: d.device_id, deviceName: d.device_name, reason: `consumption:${prov}` };
  }
  return null;
}
