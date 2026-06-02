import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pickSource, type DeviceLike } from '@/lib/dataSourcePriority';

const repoRoot = path.resolve(__dirname, '../../../..');

describe('SSOT contract tripwires', () => {
  it('keeps the Tesla vehicle skip guard intact in useEnergyLog.ts', () => {
    const src = readFileSync(path.join(repoRoot, 'src/hooks/useEnergyLog.ts'), 'utf8');
    expect(src).toMatch(/Tesla vehicle skip guard/);
    // Guard body: early-returns an empty array when a Tesla vehicle row is found.
    expect(src).toMatch(/teslaVehicles[\s\S]{0,200}return \[\];/);
    expect(src).toMatch(/\.in\(\s*'device_type'\s*,\s*\[[^\]]*'tesla_vehicle'[^\]]*\]\s*\)/);
  });

  it('does not allow Powerwall as a solar fallback provider', () => {
    const src = readFileSync(path.join(repoRoot, 'src/lib/dataSourcePriority.ts'), 'utf8');
    const match = src.match(/SOLAR_FALLBACK[^\[]*\[([^\]]+)\]/);
    expect(match).not.toBeNull();
    expect(match![1]).not.toMatch(/powerwall/i);
  });

  it('pickSource("solar", …) never returns a Powerwall device', () => {
    const devices: DeviceLike[] = [
      { provider: 'tesla', device_type: 'powerwall', device_id: 'pw-1' },
    ];
    const choice = pickSource('solar', { solar_installer: 'other' }, devices);
    // Powerwall CTs must not satisfy the solar capability on their own.
    expect(choice).toBeNull();
  });
});
