import { describe, it, expect } from 'vitest';
import {
  canonicalize,
  canonicalMessage,
  constantTimeEqualHex,
  isFresh,
  isWellFormedEnvelope,
  verifyHmacSha256,
} from '../originProof';

describe('originProof canonicalize', () => {
  it('sorts object keys deterministically', () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    expect(canonicalize({ a: 2, b: 1 })).toBe('{"a":2,"b":1}');
  });

  it('preserves array order', () => {
    expect(canonicalize([3, 1, 2])).toBe('[3,1,2]');
  });

  it('handles nested mixed structures identically regardless of input order', () => {
    const a = canonicalize({ z: { b: 1, a: [2, { y: 9, x: 8 }] } });
    const b = canonicalize({ z: { a: [2, { x: 8, y: 9 }], b: 1 } });
    expect(a).toBe(b);
  });
});

describe('canonicalMessage', () => {
  it('produces a stable string across key-order permutations of payload', () => {
    const m1 = canonicalMessage({
      provider: 'tesla', key_id: 'k1', signed_at: '2026-05-24T00:00:00Z',
      payload: { kwh: 12.5, vin: 'X' },
    });
    const m2 = canonicalMessage({
      provider: 'tesla', key_id: 'k1', signed_at: '2026-05-24T00:00:00Z',
      payload: { vin: 'X', kwh: 12.5 },
    });
    expect(m1).toBe(m2);
  });
});

describe('isWellFormedEnvelope', () => {
  const base = {
    provider: 'enphase', key_id: 'k1', signed_at: '2026-05-24T00:00:00Z',
    payload: {}, signature: 'deadbeef',
  };
  it('accepts a valid envelope', () => expect(isWellFormedEnvelope(base)).toBe(true));
  it('rejects missing fields', () => {
    expect(isWellFormedEnvelope({ ...base, signature: '' })).toBe(false);
    expect(isWellFormedEnvelope({ ...base, signed_at: 'not-a-date' })).toBe(false);
    expect(isWellFormedEnvelope({ ...base, provider: '' })).toBe(false);
  });
  it('rejects non-hex signature', () => {
    expect(isWellFormedEnvelope({ ...base, signature: 'zzz' })).toBe(false);
  });
});

describe('isFresh', () => {
  const now = Date.parse('2026-05-24T12:00:00Z');
  it('accepts recent timestamps', () => {
    expect(isFresh('2026-05-24T11:55:00Z', now)).toBe(true);
  });
  it('rejects old timestamps beyond the 10-min window', () => {
    expect(isFresh('2026-05-24T11:00:00Z', now)).toBe(false);
  });
  it('rejects future timestamps beyond the window (clock skew guard)', () => {
    expect(isFresh('2026-05-24T13:00:00Z', now)).toBe(false);
  });
});

describe('constantTimeEqualHex', () => {
  it('returns true for equal strings', () => expect(constantTimeEqualHex('abcd', 'abcd')).toBe(true));
  it('returns false on length mismatch', () => expect(constantTimeEqualHex('abc', 'abcd')).toBe(false));
  it('returns false on content mismatch', () => expect(constantTimeEqualHex('abcd', 'abce')).toBe(false));
});

describe('verifyHmacSha256', () => {
  it('round-trips: signature produced by Web Crypto verifies', async () => {
    const secret = 'super-secret';
    const message = canonicalMessage({
      provider: 'tesla', key_id: 'k1', signed_at: '2026-05-24T00:00:00Z',
      payload: { kwh: 5 },
    });
    // Compute reference signature via same primitive
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(message));
    const hex = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    expect(await verifyHmacSha256(secret, message, hex)).toBe(true);
    expect(await verifyHmacSha256('wrong', message, hex)).toBe(false);
  });
});
