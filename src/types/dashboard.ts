export interface DeviceLabels {
  vehicle?: string;       // e.g., "ZenX" for EV Miles Driven
  powerwall?: string;     // e.g., "ZenCasa" for Battery Storage Discharged
  wallConnector?: string; // e.g., "Tesla Wall Connector" or device name
  homeCharger?: string;   // e.g., "Wallbox Pulsar" for Home Charger kWh
  solar?: string;         // e.g., "PROJ-8098" for solar system name
}

/**
 * Per-device solar data for displaying multiple solar systems independently
 */
export interface SolarDeviceData {
  deviceId: string;
  deviceName: string;
  provider: 'tesla' | 'enphase' | 'solaredge';
  lifetimeKwh: number;
  pendingKwh: number;
}

/**
 * Per-device battery data for displaying multiple Powerwalls independently
 */
export interface BatteryDeviceData {
  deviceId: string;
  deviceName: string;
  provider: 'tesla' | 'enphase' | 'solaredge';
  lifetimeKwh: number;
  pendingKwh: number;
}

/**
 * Per-device EV data for displaying multiple vehicles independently
 */
export interface EVDeviceData {
  deviceId: string;
  deviceName: string;
  provider: 'tesla';
  lifetimeMiles: number;
  pendingMiles: number;
  lifetimeChargingKwh: number;
  pendingChargingKwh: number;
  lifetimeSuperchargerKwh: number;
  pendingSuperchargerKwh: number;
  // FSD Supervised (future Tesla API)
  lifetimeFsdSupervisedMiles?: number;
  pendingFsdSupervisedMiles?: number;
  // FSD Unsupervised / fully autonomous (future Tesla API)
  lifetimeFsdUnsupervisedMiles?: number;
  pendingFsdUnsupervisedMiles?: number;
}

/**
 * Per-device charger data for displaying multiple chargers independently
 */
export interface ChargerDeviceData {
  deviceId: string;
  deviceName: string;
  provider: 'tesla' | 'wallbox';
  lifetimeKwh: number;
  pendingKwh: number;
}

/**
 * IMPORTANT: Token Issuance Rules
 * 
 * Each unit of activity (kWh, mile) can ONLY generate tokens ONCE.
 * - "Lifetime" values track total cumulative activity (used for NFT milestones)
 * - "Pending" values track new activity since last mint (eligible for token rewards)
 * 
 * Flow:
 * 1. User connects device → baseline captured at current lifetime values
 * 2. User syncs → pending = current lifetime - baseline
 * 3. User mints → tokens issued for pending amount, baseline resets to current
 * 4. Next sync → pending starts from 0 again
 * 
 * This ensures no double-issuance of tokens for the same activity.
 */
export interface ActivityData {
  // Lifetime minted (from blockchain transactions)
  lifetimeMinted: number;
  // Lifetime totals (cumulative, used for NFT milestone progress)
  solarEnergyProduced: number;
  evMilesDriven: number;
  batteryStorageDischarged: number;
  teslaSuperchargerKwh: number;
  homeChargerKwh: number;
  fsdSupervisedMiles: number;    // FSD Supervised miles (future Tesla API)
  fsdUnsupervisedMiles: number;  // FSD Unsupervised/autonomous miles (future Tesla API)
  
  // Pending rewards (since last mint, eligible for token issuance)
  pendingSolarKwh: number;
  pendingEvMiles: number;
  pendingBatteryKwh: number;
  pendingChargingKwh: number;              // Combined total for minting (supercharger + home)
  pendingSuperchargerKwh: number;          // Tesla Supercharger kWh since last mint
  pendingHomeChargerKwh: number;           // Home Charger kWh since last mint
  pendingFsdSupervisedMiles: number;       // FSD Supervised miles since last mint (future)
  pendingFsdUnsupervisedMiles: number;     // FSD Unsupervised miles since last mint (future)
  
  // Reward totals
  tokensEarned: number;         // Total lifetime tokens earned
  pendingTokens: number;        // Tokens pending (not yet minted)
  referralTokens: number;
  nftsEarned: string[];
  co2OffsetPounds: number;
  deviceLabels?: DeviceLabels;
  
  // Per-device data for displaying multiple devices independently
  solarDevices?: SolarDeviceData[];
  batteryDevices?: BatteryDeviceData[];
  evDevices?: EVDeviceData[];
  chargerDevices?: ChargerDeviceData[];
}

export interface ConnectedAccount {
  service: 'tesla' | 'enphase' | 'solaredge' | 'wallbox';
  connected: boolean;
  label: string;
}

// EPA Greenhouse Gas Equivalencies Calculator references eGRID (U.S. national, year 2022)
// Electricity: 823.1 lbs CO2 / MWh generated, adjusted for 5.1% T&D losses
// => ~867.9 lbs CO2 / MWh delivered (~0.868 lbs CO2 per kWh consumed)
// Source: https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator-calculations-and-references
export const EPA_CO2_LBS_PER_KWH = 0.868;

// EPA: typical passenger vehicle emits ~404 grams CO2 per mile (tailpipe)
// 404 g = 0.891 lbs
// Source: https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle
export const CO2_LBS_PER_GAS_MILE = 0.891;

// Simple national-average EV efficiency assumption (kWh per mile)
export const EV_KWH_PER_MILE = 0.27;

export interface CO2Breakdown {
  solarLbs: number;
  batteryLbs: number;
  evLbs: number;
  totalLbs: number;
  /** Inputs preserved so drill-downs can show the underlying activity values. */
  inputs: {
    solarKwh: number;
    batteryKwh: number;
    evMiles: number;
    evKwhUsed: number;
    evGasBaselineLbs: number;
    evElectricityEmissionsLbs: number;
  };
}

export function calculateCO2Breakdown(data: ActivityData): CO2Breakdown {
  // 1) Solar: each kWh produced displaces 1 kWh of average grid electricity
  const solarLbs = data.solarEnergyProduced * EPA_CO2_LBS_PER_KWH;

  // 2) Battery storage exported: served load that would otherwise come from the grid
  const batteryLbs = data.batteryStorageDischarged * EPA_CO2_LBS_PER_KWH;

  // 3) EV driving: net CO2 avoided vs a typical gasoline vehicle
  const evKwhUsed = (data.teslaSuperchargerKwh + data.homeChargerKwh) > 0
    ? (data.teslaSuperchargerKwh + data.homeChargerKwh)
    : data.evMilesDriven * EV_KWH_PER_MILE;
  const evGasBaselineLbs = data.evMilesDriven * CO2_LBS_PER_GAS_MILE;
  const evElectricityEmissionsLbs = evKwhUsed * EPA_CO2_LBS_PER_KWH;
  const evLbs = Math.max(0, evGasBaselineLbs - evElectricityEmissionsLbs);

  return {
    solarLbs,
    batteryLbs,
    evLbs,
    totalLbs: solarLbs + batteryLbs + evLbs,
    inputs: {
      solarKwh: data.solarEnergyProduced,
      batteryKwh: data.batteryStorageDischarged,
      evMiles: data.evMilesDriven,
      evKwhUsed,
      evGasBaselineLbs,
      evElectricityEmissionsLbs,
    },
  };
}

export function calculateCO2Offset(data: ActivityData): number {
  return Math.round(calculateCO2Breakdown(data).totalLbs);
}
