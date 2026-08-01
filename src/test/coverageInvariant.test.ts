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
