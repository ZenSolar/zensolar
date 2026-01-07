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

export const CO2_KG_PER_KWH = 0.7;
export const KG_TO_POUNDS = 2.20462;

export function calculateCO2Offset(data: ActivityData): number {
  const totalKwh = data.solarEnergyProduced + data.batteryStorageDischarged + data.evCharging;
  const co2Kg = totalKwh * CO2_KG_PER_KWH;
  return co2Kg * KG_TO_POUNDS;
}
