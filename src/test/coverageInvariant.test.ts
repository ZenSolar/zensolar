import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  LOCKED_ACTIVITY_TYPES,
  WRITER_REGISTRY,
  type RegisteredWriter,
} from '../../supabase/functions/_shared/writerRegistry';
import { categoryForRow } from '../../supabase/functions/_shared/unmintedDeltas';
import { resolveExclusions } from '@/lib/deviceAuthority';

/**
 * COVERAGE INVARIANT — a locked activity type earning zero must fail the
 * build, not wait to be noticed in conversation.
 *
 * Three defects this week were all silent zeros: a disabled function, a
 * renamed `data_type` string, and an authority rule that demoted every source.
 * Each assertion below corresponds to one of those failure modes.
 */

const FN_ROOT = path.resolve(__dirname, '../../supabase/functions');

function source(fn: string): string {
  const p = path.join(FN_ROOT, fn, 'index.ts');
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

/** A writer is enabled unless it declares `ISSUANCE_WRITES_ENABLED = false`. */
function writerEnabled(fn: string): boolean {
  const s = source(fn);
  if (!s) return false;
  return !/ISSUANCE_WRITES_ENABLED\s*=\s*false/.test(s);
}

/** The writer must actually stamp the `data_type` the registry claims. */
function writerStampsDataType(w: RegisteredWriter): boolean {
  const s = source(w.fn);
  return s.includes(`"${w.dataType}"`) || s.includes(`'${w.dataType}'`);
}

/**
 * REACHABILITY — the only property worth asserting.
 *
 * "A writer exists and is enabled" was too weak: home charging sat at zero for
 * two rounds with all 22 assertions green. A row is REACHABLE only when every
 * gate between the writer and issuance is open:
 *
 *   a. the writer file exists and is not kill-switched, AND
 *   b. it stamps the `data_type` the registry declares, AND
 *   c. that (data_type, provider) maps to a category in `categoryForRow()`, AND
 *   d. a row on that writer's device is NOT demoted to observer by
 *      `resolveExclusions()` for a representative household.
 */

/** One device per distinct (provider, device_type) the registry can write to. */
function householdFromRegistry() {
  const seen = new Map<string, { device_id: string; device_type: string; provider: string }>();
  for (const activity of LOCKED_ACTIVITY_TYPES) {
    for (const w of WRITER_REGISTRY[activity]) {
      const key = `${w.provider}|${w.deviceType}`;
      if (!seen.has(key)) {
        seen.set(key, { device_id: `dev-${key}`, device_type: w.deviceType, provider: w.provider });
      }
    }
  }
  return seen;
}

function deviceFor(w: RegisteredWriter) {
  return { device_id: `dev-${w.provider}|${w.deviceType}`, device_type: w.deviceType, provider: w.provider };
}

function isDemoted(
  w: RegisteredWriter,
  devices: Array<{ device_id: string; device_type: string; provider: string }>,
): boolean {
  const me = deviceFor(w);
  return resolveExclusions(devices).some(
    (e) => e.device_id === me.device_id && e.data_type === w.dataType,
  );
}

function reachable(
  w: RegisteredWriter,
  devices: Array<{ device_id: string; device_type: string; provider: string }>,
): { ok: boolean; blockedAt: string | null } {
  if (!writerEnabled(w.fn)) return { ok: false, blockedAt: 'kill_switch_or_missing_file' };
  if (!writerStampsDataType(w)) return { ok: false, blockedAt: `does_not_stamp_${w.dataType}` };
  if (!categoryForRow(w.dataType, w.provider)) return { ok: false, blockedAt: 'unmapped_in_categoryForRow' };
  if (isDemoted(w, devices)) return { ok: false, blockedAt: 'demoted_to_observer_by_resolveExclusions' };
  return { ok: true, blockedAt: null };
}

describe('coverage invariant: every locked activity type has a live writer', () => {
  it.each(LOCKED_ACTIVITY_TYPES)('%s has at least one enabled writer file', (activity) => {
    const writers = WRITER_REGISTRY[activity].filter((w) => !w.conditional);
    const live = writers.filter((w) => writerEnabled(w.fn));
    expect(
      live.length,
      `${activity} has no ENABLED unconditional writer. Writers: ${writers
        .map((w) => `${w.fn}(${writerEnabled(w.fn) ? 'on' : 'off'})`)
        .join(', ')}`,
    ).toBeGreaterThan(0);
  });

  it.each(LOCKED_ACTIVITY_TYPES)('%s writers stamp the data_type they declare', (activity) => {
    for (const w of WRITER_REGISTRY[activity]) {
      expect(writerStampsDataType(w), `${w.fn} does not write data_type "${w.dataType}"`).toBe(true);
    }
  });

  it.each(LOCKED_ACTIVITY_TYPES)('%s data_type maps in categoryForRow()', (activity) => {
    for (const w of WRITER_REGISTRY[activity]) {
      const cat = categoryForRow(w.dataType, w.provider);
      expect(
        cat,
        `data_type "${w.dataType}" (provider "${w.provider}", writer ${w.fn}) maps to nothing in categoryForRow() — this row would silently earn zero`,
      ).toBeTruthy();
    }
  });
});

describe('coverage invariant: end-to-end reachability under a real household', () => {
  const devices = [...householdFromRegistry().values()];

  it.each(LOCKED_ACTIVITY_TYPES)(
    '%s has at least one writer whose row can actually reach issuance',
    (activity) => {
      const writers = WRITER_REGISTRY[activity].filter((w) => !w.conditional);
      const results = writers.map((w) => ({ w, r: reachable(w, devices) }));
      const live = results.filter((x) => x.r.ok);
      expect(
        live.length,
        `${activity} is UNREACHABLE — no writer can put a row into issuance. ` +
          results.map((x) => `${x.w.fn}: ${x.r.blockedAt}`).join('; '),
      ).toBeGreaterThan(0);
    },
  );

  /**
   * The specific household shape that broke: a Tesla with a wall charger. The
   * EVSE must not be demoted merely because a vehicle exists on the account —
   * that blanket rule forecloses every non-Tesla EV on that charger. Authority
   * may only subtract charging a vehicle actually accounts for.
   */
  it('an EVSE beside a vehicle is not demoted wholesale', () => {
    const evseWriters = WRITER_REGISTRY.home_charging.filter((w) => w.deviceType !== 'vehicle');
    for (const w of evseWriters) {
      const household = [
        { device_id: 'vin-1', device_type: 'vehicle', provider: 'tesla' },
        deviceFor(w),
      ];
      const r = reachable(w, household);
      expect(
        r.ok,
        `${w.fn} (${w.deviceType}) is blocked at "${r.blockedAt}" in a vehicle+EVSE household. ` +
          'A charger metering a car we cannot read must stay reachable; only the ' +
          'overlapping, vehicle-accounted portion may be subtracted.',
      ).toBe(true);
    }
  });
});


describe('coverage invariant: authority never demotes an entire activity type', () => {
  it('a lone dedicated inverter stays metered', () => {
    const excl = resolveExclusions([
      { device_id: 'inv-1', device_type: 'solar_system', provider: 'enphase' },
    ]);
    expect(excl.filter((e) => e.device_id === 'inv-1')).toHaveLength(0);
  });

  it('two disjoint inverters on one account both stay metered', () => {
    const excl = resolveExclusions([
      { device_id: 'inv-1', device_type: 'solar_system', provider: 'enphase' },
      { device_id: 'inv-2', device_type: 'solar_system', provider: 'enphase' },
    ]);
    // Scope-based rule only demotes a site-level meter spanning a dedicated
    // one. Two inverters each metering their own array are disjoint.
    expect(excl.some((e) => e.device_id === 'inv-1')).toBe(false);
  });

  it('battery export is never demoted by the solar authority rule', () => {
    const excl = resolveExclusions([
      { device_id: 'inv-1', device_type: 'solar_system', provider: 'enphase' },
      { device_id: 'pw-1', device_type: 'powerwall', provider: 'tesla' },
    ]);
    const pw = excl.filter((e) => e.device_id === 'pw-1');
    expect(pw.every((e) => e.data_type === 'solar')).toBe(true);
  });

  it('a vehicle is never demoted, so ev_miles and supercharging stay reachable', () => {
    const excl = resolveExclusions([
      { device_id: 'vin-1', device_type: 'vehicle', provider: 'tesla' },
      { device_id: 'wc-1', device_type: 'wall_connector', provider: 'tesla' },
    ]);
    expect(excl.some((e) => e.device_id === 'vin-1')).toBe(false);
  });
});
