/**
 * SITE BALANCE — the runtime assertion behind the cockpit's
 * "width carries magnitude" property.
 *
 * The diagram claims something falsifiable: stroke width is strictly
 * proportional to kW, so the trunk is exactly as wide as the sum of its
 * active branches. That claim only holds if the underlying telemetry itself
 * balances:
 *
 *     sources = solar + grid_import + battery_discharge
 *     loads   = home  + grid_export + battery_charge + ev
 *     residual = sources - loads      (should be ~0)
 *
 * When the residual is outside tolerance the site does NOT balance. That is a
 * data problem and it is surfaced as one. We do not silently redistribute the
 * difference into whichever channel makes the picture look tidy.
 *
 * EV vs HOME — the attribution rule, stated once:
 *   Tesla's Powerwall API exposes a single undifferentiated consumer sink
 *   (`load_power` / `consumer_energy_imported_from_*`). It contains no vehicle
 *   carve-out. Therefore, when a vehicle reports it is charging at this site,
 *   its own onboard charge rate (`charge_rate_kw`, the vehicle's meter) is
 *   SUBTRACTED from the site load to produce the HOME figure, and drawn as its
 *   own branch. HOME is a residual, not a measurement. The two branches always
 *   re-sum to the single measured sink, so nothing is invented — but the split
 *   between them is only as good as the vehicle's own reading, and when the
 *   vehicle reading is stale the split is not defensible and must not be drawn.
 */

/** kW -> stroke width, in overlay units (1 unit ~ 1% of card width). */
export const WIDTH_PER_KW = 0.3;
export const WIDTH_MIN = 0.3;
export const WIDTH_MAX = 3.0;

export function conductorWidth(kw: number): number {
  return Math.min(WIDTH_MAX, Math.max(WIDTH_MIN, Math.abs(kw) * WIDTH_PER_KW));
}

/** Unclamped width — the only form in which widths are additive. */
export function rawWidth(kw: number): number {
  return Math.abs(kw) * WIDTH_PER_KW;
}

export interface SiteBalanceInput {
  solarKw: number;
  /** + import from grid, - export to grid. */
  gridKw: number;
  /** + charging the pack, - discharging. */
  batteryKw: number;
  /** Measured house load, EXCLUDING the vehicle (see attribution rule above). */
  homeKw: number;
  /** Vehicle charging at this site, from the vehicle's own meter. */
  evKw: number;
}

export interface SiteBalance {
  sourcesKw: number;
  loadsKw: number;
  /** sources - loads. Positive means energy we cannot account for. */
  residualKw: number;
  toleranceKw: number;
  balanced: boolean;
  /** Sum of unclamped inflow widths (trunk side). */
  inflowWidth: number;
  /** Sum of unclamped outflow widths (branch side). */
  outflowWidth: number;
  widthDelta: number;
  /** True when at least one run is clamped, so widths cannot be compared. */
  clamped: boolean;
  reason: string;
}

/**
 * Tolerance: the larger of 0.3 kW (meter noise / rounding on a 0.1 kW display)
 * and 5% of the largest single flow.
 */
export function balanceTolerance(i: SiteBalanceInput): number {
  const largest = Math.max(
    Math.abs(i.solarKw),
    Math.abs(i.gridKw),
    Math.abs(i.batteryKw),
    Math.abs(i.homeKw),
    Math.abs(i.evKw),
  );
  return Math.max(0.3, largest * 0.05);
}

export function computeSiteBalance(i: SiteBalanceInput): SiteBalance {
  const gridImport = Math.max(0, i.gridKw);
  const gridExport = Math.max(0, -i.gridKw);
  const battCharge = Math.max(0, i.batteryKw);
  const battDischarge = Math.max(0, -i.batteryKw);

  const sourcesKw = Math.max(0, i.solarKw) + gridImport + battDischarge;
  const loadsKw = Math.max(0, i.homeKw) + gridExport + battCharge + Math.max(0, i.evKw);
  const residualKw = sourcesKw - loadsKw;
  const toleranceKw = balanceTolerance(i);
  const balanced = Math.abs(residualKw) <= toleranceKw;

  const flows = [i.solarKw, gridImport, battDischarge, i.homeKw, gridExport, battCharge, i.evKw];
  const clamped = flows.some(
    (kw) => Math.abs(kw) > 0.05 && (rawWidth(kw) < WIDTH_MIN || rawWidth(kw) > WIDTH_MAX),
  );

  return {
    sourcesKw,
    loadsKw,
    residualKw,
    toleranceKw,
    balanced,
    inflowWidth: rawWidth(sourcesKw),
    outflowWidth: rawWidth(loadsKw),
    widthDelta: rawWidth(sourcesKw) - rawWidth(loadsKw),
    clamped,
    reason: balanced
      ? 'Site balances within tolerance.'
      : residualKw > 0
        ? `${residualKw.toFixed(1)} kW of generation is unaccounted for by the measured loads.`
        : `${Math.abs(residualKw).toFixed(1)} kW of load has no measured source.`,
  };
}

/** Short label for the surfaced chip. Null when there is nothing to report. */
export function balanceNotice(b: SiteBalance): string | null {
  if (b.balanced) return null;
  return `Site balance unresolved · ${b.residualKw > 0 ? '+' : '−'}${Math.abs(b.residualKw).toFixed(1)} kW`;
}
