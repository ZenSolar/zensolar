/**
 * WRITER REGISTRY — the declared map from each LOCKED ACTIVITY TYPE to the
 * edge functions that can produce an issuable row for it.
 *
 * This exists because three separate "silent zero" defects shipped this week:
 * a category can earn nothing with no error, no log line and no failing test,
 * simply because its only writer was disabled, its `data_type` string stopped
 * matching the reader, or authority demoted every source. All three are
 * namespace or configuration faults, not logic faults, so only a declarative
 * registry checked against the real files can catch them.
 *
 * `src/test/coverageInvariant.test.ts` fails the build when any activity type
 * here has zero enabled, mapped, non-demoted writers. Adding a writer means
 * adding it here.
 */

export interface RegisteredWriter {
  /** Directory name under `supabase/functions/`. */
  fn: string;
  /** `energy_production.data_type` this writer stamps. */
  dataType: string;
  /** `energy_production.provider` this writer stamps. */
  provider: string;
  /**
   * `connected_devices.device_type` of the device this writer attributes its
   * rows to. REQUIRED for the reachability invariant: authority is resolved
   * per device, so a writer's row can only be tested for demotion if we know
   * which kind of device carries it.
   */
  deviceType: string;
  /**
   * True when this writer's coverage depends on per-account configuration
   * (e.g. Tesla fleet telemetry). A conditional writer alone does NOT satisfy
   * the coverage invariant for its activity type.
   */
  conditional?: boolean;
}

export const LOCKED_ACTIVITY_TYPES = [
  'solar',
  'battery_export',
  'ev_miles',
  'supercharging',
  'home_charging',
  'fsd_miles',
] as const;

export type LockedActivityType = (typeof LOCKED_ACTIVITY_TYPES)[number];

export const WRITER_REGISTRY: Record<LockedActivityType, RegisteredWriter[]> = {
  solar: [
    { fn: 'enphase-data', dataType: 'solar', provider: 'enphase', deviceType: 'solar_system' },
    { fn: 'solaredge-data', dataType: 'solar', provider: 'solaredge', deviceType: 'solar_system' },
    { fn: 'tesla-data', dataType: 'solar', provider: 'tesla', deviceType: 'solar' },
    { fn: 'enphase-historical', dataType: 'solar', provider: 'enphase', deviceType: 'solar_system' },
  ],
  battery_export: [
    { fn: 'tesla-data', dataType: 'battery_discharge', provider: 'tesla', deviceType: 'powerwall' },
    { fn: 'enphase-data', dataType: 'battery_discharge', provider: 'enphase', deviceType: 'battery' },
    { fn: 'solaredge-data', dataType: 'battery_discharge', provider: 'solaredge', deviceType: 'battery' },
  ],
  ev_miles: [
    { fn: 'tesla-data', dataType: 'ev_miles', provider: 'tesla', deviceType: 'vehicle' },
    { fn: 'tesla-odometer-cron', dataType: 'ev_miles', provider: 'tesla', deviceType: 'vehicle' },
  ],
  supercharging: [
    { fn: 'tesla-data', dataType: 'ev_charging', provider: 'tesla', deviceType: 'vehicle' },
  ],
  home_charging: [
    { fn: 'tesla-charge-monitor', dataType: 'ev_charging', provider: 'tesla_home_charging', deviceType: 'vehicle' },
    { fn: 'wallbox-data', dataType: 'ev_charging', provider: 'wallbox', deviceType: 'wallbox' },
  ],
  fsd_miles: [
    { fn: 'tesla-fsd-sampler', dataType: 'fsd_miles', provider: 'tesla', deviceType: 'vehicle' },
    { fn: 'tesla-telemetry-webhook', dataType: 'fsd_miles', provider: 'tesla', deviceType: 'vehicle', conditional: true },
  ],
};

