export interface ActivityData {
  solarEnergyProduced: number;
  evMilesDriven: number;
  batteryStorageDischarged: number;
  evCharging: number;
  tokensEarned: number;
  nftsEarned: number[];
  co2OffsetPounds: number;
}

export interface ConnectedAccount {
  service: 'tesla' | 'enphase' | 'solaredge';
  connected: boolean;
  label: string;
}

// EPA eGRID 2024 US average emissions factor: 0.855 lbs CO2 per kWh
// Source: https://www.epa.gov/egrid
export const EPA_CO2_LBS_PER_KWH = 0.855;

// For EV miles: EPA average of 0.27 kWh per mile for EVs
// Each EV mile replaces ~0.89 lbs CO2 from a gas car (assuming 25 MPG and 19.6 lbs CO2/gallon)
export const CO2_LBS_PER_EV_MILE = 0.89;

export function calculateCO2Offset(data: ActivityData): number {
  // Solar production directly offsets grid electricity
  const solarOffsetLbs = data.solarEnergyProduced * EPA_CO2_LBS_PER_KWH;
  
  // Battery discharge enables solar self-consumption (already counted in solar, so don't double count)
  // Only count if it's shifting load from grid
  
  // EV charging with solar/clean energy offsets gas car emissions
  // But EV charging kWh is consumption, not offset - the offset is from driving EV instead of gas
  const evMilesOffsetLbs = data.evMilesDriven * CO2_LBS_PER_EV_MILE;
  
  return Math.round(solarOffsetLbs + evMilesOffsetLbs);
}
