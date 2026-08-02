import { describe, expect, it } from 'vitest';
import { computeCardFreshness } from '@/lib/cardFreshness';

const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();

describe('computeCardFreshness', () => {
  it('speaks for the OLDEST in-scope signal, not the newest', () => {
    const f = computeCardFreshness([
      { iso: iso(0) },
      { iso: iso(2 * 60 * 60 * 1000) },
    ]);
    expect(f.state).toBe('stale');
    expect(f.label).toMatch(/^STALE · 2 HRS AGO$/);
  });

  it('ignores signals that are out of scope (unclaimed vehicle)', () => {
    const f = computeCardFreshness([
      { iso: iso(10_000) },
      { iso: iso(5 * 24 * 60 * 60 * 1000), inScope: false },
    ]);
    expect(f.state).toBe('fresh');
  });

  it('reports dead past 24 hours', () => {
    expect(computeCardFreshness([{ iso: iso(25 * 60 * 60 * 1000) }]).state).toBe('dead');
  });

  it('reports pending with no signals', () => {
    expect(computeCardFreshness([]).state).toBe('pending');
  });
});
