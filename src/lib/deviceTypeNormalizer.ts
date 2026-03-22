/**
 * Device Type Normalizer
 * 
 * Ensures consistent device type naming across all providers:
 * - Tesla: vehicle, powerwall, solar, wall_connector
 * - Enphase: solar_system → solar
 * - SolarEdge: solar_system → solar
 * - Wallbox: charger → wall_connector
 * 
 * Canonical device types:
 * - "solar" - Solar panels/systems (any provider)
 * - "battery" - Battery/Powerwall storage
 * - "vehicle" - Electric vehicles
 * - "wall_connector" - Home EV chargers (Tesla Wall Connector, Wallbox, etc.)
 */

export type CanonicalDeviceType = 'solar' | 'battery' | 'vehicle' | 'wall_connector' | 'fsd_supervised_vehicle' | 'fsd_unsupervised_vehicle' | 'unknown';

// Helper type for any FSD mode
export type FsdDeviceType = 'fsd_supervised_vehicle' | 'fsd_unsupervised_vehicle';

const DEVICE_TYPE_MAP: Record<string, CanonicalDeviceType> = {
  // Solar types
  'solar': 'solar',
  'solar_system': 'solar',
  'pv_system': 'solar',
  'inverter': 'solar',
  
  // Battery types
  'battery': 'battery',
  'powerwall': 'battery',
  'energy_site': 'battery',
  'energy_storage': 'battery',
  'storage': 'battery',
  
  // Vehicle types
  'vehicle': 'vehicle',
  'ev': 'vehicle',
  'car': 'vehicle',
  
  // FSD/Autonomous vehicle types (future Tesla API)
  'fsd_vehicle': 'fsd_vehicle',
  'autopilot_vehicle': 'fsd_vehicle',
  'autonomous': 'fsd_vehicle',
  
  // Charger types
  'wall_connector': 'wall_connector',
  'charger': 'wall_connector',
  'home_charger': 'wall_connector',
  'evse': 'wall_connector',
};

/**
 * Normalize a device type to its canonical form
 */
export function normalizeDeviceType(deviceType: string): CanonicalDeviceType {
  const normalized = DEVICE_TYPE_MAP[deviceType.toLowerCase()];
  return normalized || 'unknown';
}

/**
 * Check if a device type is a solar device (handles all provider variations)
 */
export function isSolarDevice(deviceType: string): boolean {
  return normalizeDeviceType(deviceType) === 'solar';
}

/**
 * Check if a device type is a battery/powerwall device
 */
export function isBatteryDevice(deviceType: string): boolean {
  const normalized = normalizeDeviceType(deviceType);
  return normalized === 'battery';
}

/**
 * Check if a device type is a vehicle
 */
export function isVehicleDevice(deviceType: string): boolean {
  return normalizeDeviceType(deviceType) === 'vehicle';
}

/**
 * Check if a device type is a charger (wall connector, home charger, etc.)
 */
export function isChargerDevice(deviceType: string): boolean {
  return normalizeDeviceType(deviceType) === 'wall_connector';
}

/**
 * Check if a device can have solar production data
 * Note: Tesla Powerwalls can have integrated solar data
 */
export function canHaveSolarData(deviceType: string): boolean {
  const normalized = normalizeDeviceType(deviceType);
  return normalized === 'solar' || normalized === 'battery';
}

/**
 * Check if a device can have battery export data
 */
export function canHaveBatteryData(deviceType: string): boolean {
  return normalizeDeviceType(deviceType) === 'battery';
}

/**
 * Check if a device can have EV miles data
 */
export function canHaveEvMilesData(deviceType: string): boolean {
  const normalized = normalizeDeviceType(deviceType);
  return normalized === 'vehicle' || normalized === 'fsd_vehicle';
}

/**
 * Check if a device can have FSD (Full Self-Driving) miles data
 * Future-proofing for when Tesla exposes autonomous driving telemetry
 */
export function canHaveFsdMilesData(deviceType: string): boolean {
  return normalizeDeviceType(deviceType) === 'fsd_vehicle';
}

/**
 * Check if a device can have charging data
 */
export function canHaveChargingData(deviceType: string): boolean {
  const normalized = normalizeDeviceType(deviceType);
  return normalized === 'vehicle' || normalized === 'wall_connector' || normalized === 'fsd_vehicle';
}
