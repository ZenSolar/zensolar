import { describe, expect, it } from 'vitest';
import { snapshotDelta } from '../../supabase/functions/_shared/proofDelta';
import { classifyGrantFailure } from '../../supabase/functions/_shared/grantHealth';

/**
 * THE RECONNECT WRITE — the highest-risk write in the system.
 *
 * When a dead grant is restored after weeks, the first poll returns a much
 * larger cumulative reading than the last one we stored. Two things must hold:
 *
 *  1. `snapshotDelta()` treats the whole gap as ONE legitimate delta. The
 *     energy was really produced; it was our measurement that stopped, not the
 *     device. Clamping or discarding it would under-issue silently.
 *  2. The write-time trigger `trg_reject_cumulative_as_delta` must NOT reject
 *     it. That trigger fires only when `production_wh` EQUALS the cumulative
 *     reading while `prev_value` is non-zero. A gap delta is strictly smaller
 *     than the cumulative reading, so it passes. `rejectsCumulativeAsDelta`
 *     below mirrors the trigger predicate exactly.
 */

/** Mirror of public.reject_cumulative_as_delta()'s predicate. */
function rejectsCumulativeAsDelta(productionWh: number, value: number, prevValue: number): boolean {
  if (!Number.isFinite(value) || !Number.isFinite(prevValue)) return false;
  if (prevValue === 0) return false; // first reading is exempt
  return productionWh === value;
}

describe('reconnect after a dead grant', () => {
  // Neil Golson's account (0c31aacc) stopped refreshing 2026-06-09.
  // Milagro's lifetime solar keeps climbing while we are blind to it.
  const lastSeen = 5_356_000; // Wh recorded before the grant died
  const onReconnect = 6_930_000; // Wh reported by the first poll after 7 weeks

  it('stages the whole gap as one delta', () => {
    const delta = snapshotDelta(onReconnect, lastSeen);
    expect(delta).toBe(1_574_000);
  });

  it('does not stage the cumulative reading as the delta', () => {
    const delta = snapshotDelta(onReconnect, lastSeen);
    expect(delta).not.toBe(onReconnect);
    expect(delta).toBeLessThan(onReconnect);
  });

  it('passes the write-time cumulative-as-delta trigger', () => {
    const delta = snapshotDelta(onReconnect, lastSeen);
    expect(rejectsCumulativeAsDelta(delta, onReconnect, lastSeen)).toBe(false);
  });

  it('still rejects a writer that mistakes the reading for the delta', () => {
    expect(rejectsCumulativeAsDelta(onReconnect, onReconnect, lastSeen)).toBe(true);
  });

  it('never produces a negative delta if the meter is replaced or reset', () => {
    // A swapped inverter reports a smaller lifetime figure. The correct
    // behaviour is zero, not a negative that would corrupt the running sum.
    expect(snapshotDelta(120, 5_356_000)).toBe(0);
  });

  it('a genuinely new device is exempt from the trigger', () => {
    const first = snapshotDelta(4_200, 0);
    expect(first).toBe(4_200);
    expect(rejectsCumulativeAsDelta(first, 4_200, 0)).toBe(false);
  });
});

describe('grant failure classification separates churn from breakage', () => {
  it('treats a withdrawn consent as user_revoked', () => {
    expect(classifyGrantFailure(400, '{"error":"login_required"}')).toBe('user_revoked');
    expect(classifyGrantFailure(403, '{"error":"access_denied"}')).toBe('user_revoked');
    expect(classifyGrantFailure(400, 'token has been revoked')).toBe('user_revoked');
  });

  it('treats a bare invalid_grant as our defect, not churn', () => {
    expect(classifyGrantFailure(400, '{"error":"invalid_grant"}')).toBe('technically_invalid');
    expect(classifyGrantFailure(401, 'unauthorized')).toBe('technically_invalid');
    expect(classifyGrantFailure(503, '')).toBe('technically_invalid');
  });
});
