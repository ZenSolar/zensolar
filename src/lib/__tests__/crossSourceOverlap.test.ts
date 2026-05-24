import { describe, it, expect } from 'vitest';
import { verifyNoCrossSourceOverlap, type ChargingEvent } from '../crossSourceOverlap';

const ev = (over: Partial<ChargingEvent>): ChargingEvent => ({
  id: 'x',
  source: 'home_charging_sessions',
  provider: 'tesla',
  startedAt: '2026-05-01T10:00:00Z',
  energyKwh: 10,
  ...over,
});

describe('verifyNoCrossSourceOverlap', () => {
  it('flags same session reported by Tesla + Wallbox within window', () => {
    const out = verifyNoCrossSourceOverlap([
      ev({ id: 'a', provider: 'tesla', startedAt: '2026-05-01T10:00:00Z', energyKwh: 10 }),
      ev({ id: 'b', provider: 'wallbox', startedAt: '2026-05-01T10:05:00Z', energyKwh: 10.5 }),
    ]);
    expect(out).toHaveLength(1);
    // wallbox preferred over tesla -> keep b, drop a
    expect(out[0].keep.id).toBe('b');
    expect(out[0].drop.id).toBe('a');
  });

  it('does not flag same-provider rows (DB unique index handles those)', () => {
    const out = verifyNoCrossSourceOverlap([
      ev({ id: 'a', provider: 'tesla', startedAt: '2026-05-01T10:00:00Z' }),
      ev({ id: 'b', provider: 'tesla', startedAt: '2026-05-01T10:05:00Z' }),
    ]);
    expect(out).toEqual([]);
  });

  it('does not flag events outside window', () => {
    const out = verifyNoCrossSourceOverlap([
      ev({ id: 'a', provider: 'tesla', startedAt: '2026-05-01T10:00:00Z' }),
      ev({ id: 'b', provider: 'wallbox', startedAt: '2026-05-01T11:00:00Z' }),
    ]);
    expect(out).toEqual([]);
  });

  it('does not flag events with large kWh difference', () => {
    const out = verifyNoCrossSourceOverlap([
      ev({ id: 'a', provider: 'tesla', startedAt: '2026-05-01T10:00:00Z', energyKwh: 10 }),
      ev({ id: 'b', provider: 'wallbox', startedAt: '2026-05-01T10:05:00Z', energyKwh: 30 }),
    ]);
    expect(out).toEqual([]);
  });

  it('only drops each event once even with multiple potential matches', () => {
    const out = verifyNoCrossSourceOverlap([
      ev({ id: 'a', provider: 'tesla', startedAt: '2026-05-01T10:00:00Z', energyKwh: 10 }),
      ev({ id: 'b', provider: 'wallbox', startedAt: '2026-05-01T10:03:00Z', energyKwh: 10 }),
      ev({ id: 'c', provider: 'enphase', startedAt: '2026-05-01T10:06:00Z', energyKwh: 10 }),
    ]);
    const dropped = new Set(out.map((p) => p.drop.id));
    expect(dropped.size).toBe(out.length);
  });
});
