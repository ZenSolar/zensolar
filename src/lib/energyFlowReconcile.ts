/**
 * ENERGY FLOW RECONCILIATION — one object, computed once per tick.
 *
 * The card used to have two code paths reading two different values for the
 * same field: the "site balance" banner read the RAW Powerwall CT
 * (`gridKwRaw`, +1.1 kW import) while the scene beside it drew the
 * RECONCILED figure (0.8 kW export). Two readers, one field, guaranteed
 * contradiction — a fabricated "SITE BALANCE UNRESOLVED +1.9 kW" on a site
 * whose meters actually agreed.
 *
 * The fix is not deleting the banner. The fix is that exactly ONE
 * `ReconciledFlow` object exists per tick and every downstream consumer —
 * corner tiles, vehicle chips, provenance legend, sources-over-sinks strip —
 * reads it. Nothing recomputes sources/loads independently.
 *
 * Grid is *conditionally* measured:
 *   gridSource === 'raw'        → the CT agreed with the rest of the site.
 *   gridSource === 'reconciled' → the CT disagreed by more than threshold,
 *                                 so the residual that closes the books is
 *                                 shown instead, with `overrideReason`.
 *
 * Home is *always* derived when there is no load meter behind it, and is
 * flagged as such with no exceptions (see `homeDerived`).
 */

export type GridSource = 'raw' | 'reconciled';

export interface ReconcileInput {
  solarKw: number;
  /** Measured house load, or null when no meter reading is available. */
  rawHomeKw: number | null;
  /** + charging the pack, - discharging. */
  batteryKw: number;
  /** + import, - export. Raw CT reading, or null when absent. */
  rawGridKw: number | null;
  /** Vehicle charging AT THIS SITE (proven presence only). */
  evHomeKw: number;
}

export interface ReconciledFlow {
  solarKw: number;
  batteryKw: number;
  evKw: number;
  homeKw: number;
  /** Home never has a meter behind it on most sites — true means computed. */
  homeDerived: boolean;
  gridKw: number;
  gridSource: GridSource;
  /** Null unless gridSource === 'reconciled'. */
  overrideReason: string | null;
  /** Raw CT value as read, for diagnostics only — never rendered as grid. */
  rawGridKw: number | null;
  /** sources - loads using the RAW grid value. */
  gapKw: number;
  thresholdKw: number;
  /** @deprecated alias kept for existing callers/tests. */
  gridCorrected: boolean;
}

export function reconcileEnergyFlow(input: ReconcileInput): ReconciledFlow {
  const solar = Math.max(0, input.solarKw);
  const battery = input.batteryKw;
  const evHome = Math.max(0, input.evHomeKw);
  const batteryLoad = Math.max(0, battery); // charging the pack = a load
  const batterySource = Math.max(0, -battery); // discharging = a source

  const hasUsableHome = input.rawHomeKw !== null && input.rawHomeKw > 0.05;
  const homeFromBalance =
    input.rawGridKw !== null
      ? solar +
        batterySource +
        Math.max(0, input.rawGridKw) -
        batteryLoad -
        Math.max(0, -input.rawGridKw) -
        evHome
      : null;
  const homeKw = hasUsableHome
    ? (input.rawHomeKw as number)
    : Math.max(0, homeFromBalance ?? input.rawHomeKw ?? 0);

  // Closure test, stated once, against the RAW CT.
  const sources = solar + Math.max(0, input.rawGridKw ?? 0) + batterySource;
  const loads =
    Math.max(0, homeKw) + Math.max(0, -(input.rawGridKw ?? 0)) + batteryLoad + evHome;
  const gapKw = sources - loads;
  const thresholdKw = Math.max(0.7, solar * 0.35);

  /** The residual that closes the books. */
  const balancedGrid = evHome + batteryLoad + homeKw - solar - batterySource;

  const missingCt = input.rawGridKw === null;
  const disagrees = !missingCt && Math.abs(gapKw) > thresholdKw;
  const overridden = missingCt || disagrees;

  const gridKw = overridden ? balancedGrid : (input.rawGridKw as number);

  const overrideReason = !overridden
    ? null
    : missingCt
      ? 'No grid CT reading this frame; grid is derived from the other meters.'
      : `raw CT read ${(input.rawGridKw as number).toFixed(1)} kW ${
          (input.rawGridKw as number) >= 0 ? 'import' : 'export'
        }; disagreed by ${Math.abs(gapKw).toFixed(1)} kW vs threshold ${thresholdKw.toFixed(2)} kW`;

  return {
    solarKw: solar,
    batteryKw: battery,
    evKw: evHome,
    homeKw,
    homeDerived: !hasUsableHome,
    gridKw,
    gridSource: overridden ? 'reconciled' : 'raw',
    overrideReason,
    rawGridKw: input.rawGridKw,
    gapKw,
    thresholdKw,
    gridCorrected: overridden,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// §7 — sources-over-sinks strip, built from the SAME object. No parallel math.
// ─────────────────────────────────────────────────────────────────────────────

export type FlowProvenance = 'measured' | 'derived' | 'unmeasured';

export interface FlowSegment {
  key: string;
  label: string;
  kw: number;
  provenance: FlowProvenance;
  /** Tailwind-ish token consumers map to a fill. */
  tone: 'solar' | 'battery' | 'grid' | 'home' | 'ev' | 'unknown';
}

export interface SourcesSinks {
  sources: FlowSegment[];
  sinks: FlowSegment[];
  sourcesKw: number;
  sinksKw: number;
  /** Grey segment: measured sinks exceeding everything we can account for. */
  unmeasuredKw: number;
}

export function buildSourcesSinks(f: ReconciledFlow): SourcesSinks {
  const gridProv: FlowProvenance = f.gridSource === 'raw' ? 'measured' : 'derived';

  const sources: FlowSegment[] = [];
  if (f.solarKw > 0.05)
    sources.push({ key: 'solar', label: 'Solar', kw: f.solarKw, provenance: 'measured', tone: 'solar' });
  if (f.batteryKw < -0.05)
    sources.push({
      key: 'battery',
      label: 'Battery',
      kw: -f.batteryKw,
      provenance: 'measured',
      tone: 'battery',
    });
  if (f.gridKw > 0.05)
    sources.push({ key: 'grid-in', label: 'Grid import', kw: f.gridKw, provenance: gridProv, tone: 'grid' });

  const sinks: FlowSegment[] = [];
  if (f.homeKw > 0.05)
    sinks.push({
      key: 'home',
      label: 'Home',
      kw: f.homeKw,
      provenance: f.homeDerived ? 'derived' : 'measured',
      tone: 'home',
    });
  if (f.evKw > 0.05)
    sinks.push({ key: 'ev', label: 'Vehicle', kw: f.evKw, provenance: 'measured', tone: 'ev' });
  if (f.batteryKw > 0.05)
    sinks.push({
      key: 'battery-charge',
      label: 'Battery charge',
      kw: f.batteryKw,
      provenance: 'measured',
      tone: 'battery',
    });
  if (f.gridKw < -0.05)
    sinks.push({ key: 'grid-out', label: 'Grid export', kw: -f.gridKw, provenance: gridProv, tone: 'grid' });

  const sourcesKw = sources.reduce((a, s) => a + s.kw, 0);
  const sinksKw = sinks.reduce((a, s) => a + s.kw, 0);

  // Genuine unknown: measured sinks outrun everything accounted for, even
  // after reconciliation. Surfaced, never silently absorbed.
  const unmeasuredKw = Math.max(0, sinksKw - sourcesKw);
  if (unmeasuredKw > 0.05) {
    sources.push({
      key: 'unmeasured',
      label: 'Unmeasured',
      kw: unmeasuredKw,
      provenance: 'unmeasured',
      tone: 'unknown',
    });
  }

  return { sources, sinks, sourcesKw: sourcesKw + unmeasuredKw, sinksKw, unmeasuredKw };
}
