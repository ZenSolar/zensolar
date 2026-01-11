export interface ActivityData {
  solarEnergyProduced: number;
  evMilesDriven: number;
  batteryStorageDischarged: number;
  teslaSuperchargerKwh: number;
  homeChargerKwh: number;
  tokensEarned: number;
  referralTokens: number;
  nftsEarned: number[];
  co2OffsetPounds: number;
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

export function calculateCO2Offset(data: ActivityData): number {
  // 1) Solar: each kWh produced is assumed to displace 1 kWh of average grid electricity
  const solarOffsetLbs = data.solarEnergyProduced * EPA_CO2_LBS_PER_KWH;

  // 2) Battery discharge: assume discharged kWh served load that would otherwise come from the grid
  // (If your solar metric already includes all self-consumed energy, this can double-count. Keeping it
  // in because the UI tracks battery discharge as its own metric.)
  const batteryOffsetLbs = data.batteryStorageDischarged * EPA_CO2_LBS_PER_KWH;

  // 3) EV driving: net CO2 avoided vs a typical gasoline vehicle
  // avoided_gas = miles * (gas lbs/mile)
  // emitted_electricity = kWh_charged * (grid lbs/kWh)
  // net_avoided = max(0, avoided_gas - emitted_electricity)
  const evKwhUsed = (data.teslaSuperchargerKwh + data.homeChargerKwh) > 0 
    ? (data.teslaSuperchargerKwh + data.homeChargerKwh) 
    : data.evMilesDriven * EV_KWH_PER_MILE;
  const evGasBaselineLbs = data.evMilesDriven * CO2_LBS_PER_GAS_MILE;
  const evElectricityEmissionsLbs = evKwhUsed * EPA_CO2_LBS_PER_KWH;
  const evNetOffsetLbs = Math.max(0, evGasBaselineLbs - evElectricityEmissionsLbs);

  return Math.round(solarOffsetLbs + batteryOffsetLbs + evNetOffsetLbs);
}

