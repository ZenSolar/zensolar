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
  /**
   * How this writer is invoked. `client_session` means it only runs while a
   * member has the app open — there is no unattended schedule.
   */
  invokedBy: 'cron' | 'client_session' | 'webhook';
  /**
   * An UPSTREAM PRECONDITION that must fire before this writer can produce a
   * single row, beyond being enabled and authorised. When set, the writer
   * cannot be relied on for coverage: the category can sit at zero with the
   * writer healthy, which is exactly the home-charging defect of 2026-08-02
   * (no `home_charging_sessions` row ever opened, so no ev_charging row was
   * ever staged). Null means the writer produces rows whenever it runs.
   */
  precondition?: string;
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
    { fn: 'enphase-data', dataType: 'solar', provider: 'enphase', deviceType: 'solar_system', invokedBy: 'client_session' },
    { fn: 'solaredge-data', dataType: 'solar', provider: 'solaredge', deviceType: 'solar_system', invokedBy: 'client_session' },
    { fn: 'tesla-data', dataType: 'solar', provider: 'tesla', deviceType: 'solar', invokedBy: 'client_session' },
    { fn: 'enphase-historical', dataType: 'solar', provider: 'enphase', deviceType: 'solar_system', invokedBy: 'client_session' },
  ],
  battery_export: [
    { fn: 'tesla-data', dataType: 'battery_discharge', provider: 'tesla', deviceType: 'powerwall', invokedBy: 'client_session' },
    { fn: 'enphase-data', dataType: 'battery_discharge', provider: 'enphase', deviceType: 'battery', invokedBy: 'client_session' },
    { fn: 'solaredge-data', dataType: 'battery_discharge', provider: 'solaredge', deviceType: 'battery', invokedBy: 'client_session' },
  ],
  ev_miles: [
    { fn: 'tesla-data', dataType: 'ev_miles', provider: 'tesla', deviceType: 'vehicle', invokedBy: 'client_session' },
    { fn: 'tesla-odometer-cron', dataType: 'ev_miles', provider: 'tesla', deviceType: 'vehicle', invokedBy: 'cron' },
  ],
  supercharging: [
    { fn: 'tesla-data', dataType: 'ev_charging', provider: 'tesla', deviceType: 'vehicle', invokedBy: 'client_session' },
  ],
  home_charging: [
    { fn: 'tesla-charge-monitor', dataType: 'ev_charging', provider: 'tesla_home_charging', deviceType: 'vehicle', invokedBy: 'client_session', precondition: 'an open home_charging_sessions row, which requires GPS within 0.5mi of the geocoded profile.home_address while charging_state === Charging and fast_charger_present === false' },
    { fn: 'wallbox-data', dataType: 'ev_charging', provider: 'wallbox', deviceType: 'wallbox', invokedBy: 'client_session', conditional: true },
  ],
  fsd_miles: [
    { fn: 'tesla-fsd-sampler', dataType: 'fsd_miles', provider: 'tesla', deviceType: 'vehicle', invokedBy: 'cron' },
    { fn: 'tesla-telemetry-webhook', dataType: 'fsd_miles', provider: 'tesla', deviceType: 'vehicle', conditional: true, invokedBy: 'webhook' },
  ],
};

