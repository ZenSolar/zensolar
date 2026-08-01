/**
 * Investor Demo Mode — rich seeded EnergyFlowData for the ZenEnergy
 * Monitoring live flow diagram.
 *
 * THIS FILE IS A FIXTURE. Nothing here is telemetry. It may only ever be
 * rendered on a surface that is unmistakably labelled a prototype, and it must
 * never be composited with live readings on the same surface.
 *
 * Story we're telling on screen — the state members see most often, and the
 * one that was previously never captured: an 11 kW-class charging session
 * against a mid-size array, so the GRID IMPORT branch is the dominant flow.
 *
 *   - Solar producing 5.4 kW
 *   - Grid importing 7.3 kW (dominant — wider than the solar trunk)
 *   - Powerwall at 87% SOC, charging at +2.1 kW
 *   - Tesla plugged in at home, charging at 7.2 kW
 *   - Home load 3.4 kW
 *
 * THE SITE EQUATION CLOSES, and the fixture is chosen so it must:
 *   sources 5.4 solar + 7.3 import       = 12.7 kW
 *   loads   3.4 home + 2.1 battery + 7.2 EV = 12.7 kW
 * Branch widths therefore sum to the trunk, which is the property the diagram
 * claims. `computeSiteBalance()` asserts it at runtime.
 */
import type { EnergyFlowData } from '@/components/dashboard/AnimatedEnergyFlow';

export const INVESTOR_DEMO_FLOW: EnergyFlowData = {
  solarPower: 5.4,        // kW producing
  homePower: 3.4,         // kW house load, excluding the vehicle
  batteryPower: 2.1,      // + = charging into pack
  batteryPercent: 87,
  batteryCapacityKwh: 13.5,
  batteryReserveKwh: 11.7,
  gridPower: 7.3,         // + = importing. Dominant flow during home charging.
  evPower: 7.2,           // active home charging session
  tesla: {
    kW: 7.2,
    soc: 64,
    rangeMi: 247,
    isCharging: true,
    source: 'home',
  },
};

/**
 * Tesla telemetry payload shaped like the Tesla Fleet API so the
 * EnergyFlowScene's vehicle resolver picks a Model Y · Pearl White asset
 * and the LiveEnergyMonitoringCard reads charging-state correctly.
 */
export const INVESTOR_DEMO_TESLA_PAYLOAD = {
  display_name: 'Model Y',
  device_name: 'Model Y',
  vehicle_config: {
    car_type: 'modely',
    exterior_color: 'PearlWhite',
  },
  charging_state: 'Charging',
  battery_level: 64,
  usable_battery_level: 64,
  battery_range: 247,
  charge_rate_kw: 7.2,
  charger_power: 7.2,
  charger_actual_current: 32,
  charger_voltage: 240,
  charger_phases: 1,
  fast_charger_type: 'Wall Connector',
  charge_energy_added: 18.4,
  time_to_full_charge: 2.1,
  metadata: {
    device_name: 'Model Y',
    vin: '7SAYGDEE1RA000DEMO',
  },
};

/**
 * Connected source chips to show under the diagram — reinforces the
 * multi-OEM moat in every investor framing.
 */
export const INVESTOR_DEMO_SOURCES = [
  { id: 'tesla', label: 'Tesla', detail: 'Model Y' },
  { id: 'enphase', label: 'Enphase', detail: 'IQ8M · 16 panels' },
  { id: 'powerwall', label: 'Powerwall', detail: '13.5 kWh' },
  { id: 'wallbox', label: 'Wallbox', detail: 'Pulsar Plus' },
] as const;

export const INVESTOR_DEMO_HEADLINE = {
  producing: 5.4,
  using: 9.3,           // 3.4 home + 2.1 PW charge + 7.2 EV charge (excl. solar)
  batteryDeltaKw: 2.1,
  evChargingKw: 7.2,
  gridKw: 7.3,
};

/**
 * Outage simulation fixture — drives the on-demand "Simulate Grid Outage"
 * toggle on the Investor Demo card. Grid dead, solar idle, Powerwall
 * discharging ~0.9 kW to keep essentials online, SOC 78%, Tesla parked
 * but not charging.
 */
export const INVESTOR_DEMO_OUTAGE_FLOW: EnergyFlowData = {
  solarPower: 0.0,
  homePower: 0.9,
  batteryPower: -0.9,     // negative = discharging out of the pack
  batteryPercent: 78,
  batteryCapacityKwh: 13.5,
  batteryReserveKwh: 2.7,
  gridPower: 0.0,
  evPower: 0.0,
  tesla: {
    kW: 0,
    soc: 64,
    rangeMi: 247,
    isCharging: false,
    source: 'home',
  },
};

export const INVESTOR_DEMO_OUTAGE_TESLA_PAYLOAD = {
  ...INVESTOR_DEMO_TESLA_PAYLOAD,
  charging_state: 'Stopped',
  charge_rate_kw: 0,
  charger_power: 0,
  charger_actual_current: 0,
};
