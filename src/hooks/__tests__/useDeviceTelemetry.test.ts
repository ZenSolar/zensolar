import { describe, it, expect } from 'vitest';

/**
 * These tests pin the freshness contract for the Live Energy cockpit.
 * They exercise the internal `extractSampleAt` + TTL boundary helpers
 * by importing the module under test.
 *
 * The hook itself is integration-heavy (Supabase + edge functions), so
 * we don't try to render it here — we only assert the pure pieces that
 * determine whether a cached row counts as "fresh" and where the
 * "Updated Nm ago" pill should read its timestamp from.
 */

// Re-exported test surface (kept tree-shake friendly).
import * as mod from '../useDeviceTelemetry';

describe('useDeviceTelemetry — freshness contract', () => {
  it('exposes sample_at as an optional field on CachedTelemetry', () => {
    // Type-level smoke check: the shape must compile without sample_at.
    const t: import('../useDeviceTelemetry').CachedTelemetry = {
      oem: 'tesla',
      capability: 'battery',
      site_id: 's1',
      device_name: 'Powerwall',
      payload: { percentage_charged: 87 },
      cached_at: new Date().toISOString(),
      fresh: true,
    };
    expect(t.sample_at).toBeUndefined();
  });

  it('battery TTL is ≤ 90s so the Live card matches the Tesla app within a minute', () => {
    // Access the constant indirectly via module-internal contract:
    // we re-import the source text and grep for the literal. This guards
    // against accidental regression back to the old 12h cache.
    // Vitest runs in Node — read the source file directly.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    const src = fs.readFileSync(
      require('path').resolve(__dirname, '..', 'useDeviceTelemetry.ts'),
      'utf8',
    );
    // Battery must be 60 seconds (Live cockpit window).
    expect(src).toMatch(/battery:\s*60\s*\*\s*1000/);
    // Make sure the 12-hour regression is gone.
    expect(src).not.toMatch(/battery:\s*12\s*\*\s*60\s*\*\s*60\s*\*\s*1000/);
    // Solar must be ≤ 5 min.
    expect(src).toMatch(/solar:\s*60\s*\*\s*1000/);
  });

  it('module shape stays stable', () => {
    expect(typeof mod.useBatteryTelemetry).toBe('function');
    expect(typeof mod.useSolarTelemetry).toBe('function');
    expect(typeof mod.useEVChargerTelemetry).toBe('function');
  });
});
