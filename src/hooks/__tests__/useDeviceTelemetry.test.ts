import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Live cockpit freshness contract. The hook itself is integration-heavy
 * (Supabase + edge functions + localStorage), so these tests read the
 * source directly to guard the values that determine whether the
 * "Updated Nm ago" pill matches the Tesla / Enphase apps within a minute.
 */
const SRC = readFileSync(
  resolve(__dirname, '..', 'useDeviceTelemetry.ts'),
  'utf8',
);

describe('useDeviceTelemetry — freshness contract', () => {
  it('battery TTL is 60s (was 12h — regression guard)', () => {
    expect(SRC).toMatch(/battery:\s*60\s*\*\s*1000/);
    expect(SRC).not.toMatch(/battery:\s*12\s*\*\s*60\s*\*\s*60\s*\*\s*1000/);
  });

  it('solar TTL is 60s (was 1h — regression guard)', () => {
    expect(SRC).toMatch(/solar:\s*60\s*\*\s*1000/);
    expect(SRC).not.toMatch(/solar:\s*60\s*\*\s*60\s*\*\s*1000/);
  });

  it('exposes sample_at on CachedTelemetry so the pill can reflect OEM sample time', () => {
    expect(SRC).toMatch(/sample_at\?:\s*string\s*\|\s*null/);
    expect(SRC).toMatch(/extractSampleAt\s*\(/);
  });

  it('freshness check is tightened against TTL_MS, not only DB expires_at', () => {
    // Prevents long-lived rows written under the old 12h TTL from looking fresh.
    expect(SRC).toMatch(/withinTtl/);
  });
});
