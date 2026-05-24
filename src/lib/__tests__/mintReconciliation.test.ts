/**
 * Mint-on-Proof golden fixtures.
 *
 * Contract: if any of these fail, the mint pipe is no longer "no proof, no mint."
 * Update fixtures only when you have also updated mem://features/proof-of-genesis-*.
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RECONCILIATION_TOLERANCE_PCT,
  diffPct,
  verifyBaselineLeLifetime,
  verifyMintProof,
  verifyNonNegativeAmounts,
  verifyThreeWayMatch,
} from '../mintReconciliation';

describe('Mint-on-Proof: non-negative amounts (M3)', () => {
  it('passes clean amounts', () => {
    expect(verifyNonNegativeAmounts({ tokensMinted: 100, kwhDelta: 10, milesDelta: 0 })).toEqual([]);
  });
  it('flags negative tokens', () => {
    const v = verifyNonNegativeAmounts({ tokensMinted: -1 });
    expect(v).toHaveLength(1);
    expect(v[0].code).toBe('negative_amount');
  });
  it('flags negative kwh and miles independently', () => {
    expect(verifyNonNegativeAmounts({ kwhDelta: -0.01 })[0].code).toBe('negative_amount');
    expect(verifyNonNegativeAmounts({ milesDelta: -5 })[0].code).toBe('negative_amount');
  });
});

describe('Mint-on-Proof: three-way reconciliation (M4)', () => {
  it('passes a perfect three-way match', () => {
    const r = verifyThreeWayMatch({ category: 'solar', headline: 100, rows: 100, onChain: 100 });
    expect(r.ok).toBe(true);
    expect(r.violations).toEqual([]);
  });

  it('passes within default 1% tolerance', () => {
    const r = verifyThreeWayMatch({ category: 'solar', headline: 100, rows: 99.5, onChain: 100.5 });
    expect(r.ok).toBe(true);
  });

  it('flags headline-rows mismatch beyond tolerance', () => {
    const r = verifyThreeWayMatch({ category: 'solar', headline: 100, rows: 80, onChain: 100 });
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.code === 'headline_rows_mismatch')).toBe(true);
  });

  it('flags on-chain inflation (most dangerous case)', () => {
    const r = verifyThreeWayMatch({ category: 'solar', headline: 100, rows: 100, onChain: 1000 });
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.code === 'onchain_headline_mismatch')).toBe(true);
  });

  it('uses absolute floor so tiny values do not produce false positives', () => {
    // Without the 0.5 floor, 0.1 vs 0.105 would be a 5% diff. With it, it's well under tolerance.
    const r = verifyThreeWayMatch({ category: 'solar', headline: 0.1, rows: 0.105, onChain: 0.1 });
    expect(r.ok).toBe(true);
  });

  it('tolerance is configurable', () => {
    const tight = verifyThreeWayMatch({ category: 'solar', headline: 100, rows: 102, onChain: 100, tolerancePct: 1 });
    const loose = verifyThreeWayMatch({ category: 'solar', headline: 100, rows: 102, onChain: 100, tolerancePct: 5 });
    expect(tight.ok).toBe(false);
    expect(loose.ok).toBe(true);
  });

  it('diffPct is symmetric in sign and bounded by absolute floor', () => {
    expect(diffPct(100, 100)).toBe(0);
    expect(Math.abs(diffPct(100, 90))).toBeCloseTo(10, 1);
    expect(diffPct(0, 0)).toBe(0);
  });
});

describe('Mint-on-Proof: baseline ≤ lifetime (M5)', () => {
  it('passes when baseline equals lifetime (just-minted state)', () => {
    expect(
      verifyBaselineLeLifetime(
        { solar_wh: 1000, odometer: 5000 },
        { solar_wh: 1000, odometer: 5000 },
      ),
    ).toEqual([]);
  });

  it('passes when lifetime grows past baseline', () => {
    expect(
      verifyBaselineLeLifetime(
        { solar_wh: 1000 },
        { solar_wh: 1500 },
      ),
    ).toEqual([]);
  });

  it('FLAGS when baseline somehow exceeds lifetime (counter rollover, sync glitch)', () => {
    const v = verifyBaselineLeLifetime(
      { solar_wh: 2000 },
      { solar_wh: 1500 },
    );
    expect(v).toHaveLength(1);
    expect(v[0].code).toBe('baseline_exceeds_lifetime');
  });

  it('ignores non-numeric metadata keys (captured_at, reset_at, etc.)', () => {
    expect(
      verifyBaselineLeLifetime(
        { solar_wh: 1000, captured_at: '2026-01-01T00:00:00Z' as unknown as number },
        { solar_wh: 1500, updated_at: '2026-05-24T00:00:00Z' as unknown as number },
      ),
    ).toEqual([]);
  });

  it('handles null inputs without throwing', () => {
    expect(verifyBaselineLeLifetime(null, null)).toEqual([]);
    expect(verifyBaselineLeLifetime(undefined, { solar_wh: 100 })).toEqual([]);
  });
});

describe('Mint-on-Proof: verifyMintProof end-to-end', () => {
  const ok = {
    category: 'solar',
    headline: 100,
    rows: 100,
    onChain: 100,
    tokensMinted: 75,
    kwhDelta: 100,
    milesDelta: 0,
    sourceBreakdown: { enphase: 100 },
    baseline: { solar_wh: 1000 },
    lifetime: { solar_wh: 1100 },
  };

  it('passes a clean mint proof', () => {
    const r = verifyMintProof(ok);
    expect(r.ok).toBe(true);
    expect(r.violations).toEqual([]);
  });

  it('blocks mint with empty source_breakdown (no forensic trail)', () => {
    const r = verifyMintProof({ ...ok, sourceBreakdown: {} });
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.code === 'empty_source_breakdown')).toBe(true);
  });

  it('blocks mint when on-chain inflated 10x', () => {
    const r = verifyMintProof({ ...ok, onChain: 1000 });
    expect(r.ok).toBe(false);
  });

  it('blocks mint when baseline > lifetime', () => {
    const r = verifyMintProof({
      ...ok,
      baseline: { solar_wh: 2000 },
      lifetime: { solar_wh: 1500 },
    });
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.code === 'baseline_exceeds_lifetime')).toBe(true);
  });

  it('blocks mint with negative tokens', () => {
    const r = verifyMintProof({ ...ok, tokensMinted: -1 });
    expect(r.ok).toBe(false);
  });
});

describe('Mint-on-Proof: 50-trial fuzz — no false approvals under random three-way drift', () => {
  it('any three-way drift > tolerance is always caught', () => {
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    for (let trial = 0; trial < 50; trial++) {
      const headline = rand(10, 10_000);
      // force a clearly-out-of-tolerance drift on one of the two diffs
      const driftPct = rand(2, 50); // > 1% tolerance
      const driftSide = Math.random() < 0.5 ? 'rows' : 'onChain';
      const drifted = headline * (1 + driftPct / 100);
      const rows = driftSide === 'rows' ? drifted : headline;
      const onChain = driftSide === 'onChain' ? drifted : headline;

      const r = verifyThreeWayMatch({
        category: `fuzz-${trial}`,
        headline,
        rows,
        onChain,
        tolerancePct: DEFAULT_RECONCILIATION_TOLERANCE_PCT,
      });
      expect(r.ok, `trial ${trial} drift=${driftPct}% side=${driftSide}`).toBe(false);
    }
  });
});
