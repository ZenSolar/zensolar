/**
 * Pillar 2 · Source — Origin-Proof HMAC verification
 *
 * Every provider data ingest may carry an `origin_proof` envelope:
 *   { provider, key_id, algorithm, signed_at, payload, signature }
 *
 * `signature` = HMAC(secret, canonical(payload || signed_at || provider || key_id))
 *
 * This module is shared shape + canonicalizer + (browser) verifier.
 * The edge-function side performs the actual signed-secret HMAC against the
 * registry in `origin_proof_keys`. Keep canonicalization byte-identical
 * between this file and `supabase/functions/_shared/originProof.ts`.
 */

export const ORIGIN_PROOF_DEFAULT_ALGO = 'HMAC-SHA256' as const;
export const ORIGIN_PROOF_MAX_AGE_MS = 10 * 60 * 1000; // 10-minute replay window

export type OriginProofResult =
  | 'valid'
  | 'invalid_signature'
  | 'unknown_key'
  | 'revoked'
  | 'expired'
  | 'missing'
  | 'malformed';

export interface OriginProofEnvelope {
  provider: string;
  key_id: string;
  algorithm?: string;
  signed_at: string;   // ISO timestamp
  payload: unknown;    // canonicalized JSON
  signature: string;   // hex-encoded HMAC digest
}

/**
 * Deterministic JSON serialization: sorted object keys, no whitespace.
 * Arrays preserve order. Numbers preserved as-is.
 */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']';
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return '{' + keys
    .map((k) => JSON.stringify(k) + ':' + canonicalize((value as Record<string, unknown>)[k]))
    .join(',') + '}';
}

/**
 * Canonical message that the HMAC is computed over. Both sides must agree byte-for-byte.
 */
export function canonicalMessage(env: Pick<OriginProofEnvelope, 'provider' | 'key_id' | 'signed_at' | 'payload'>): string {
  return canonicalize({
    provider: env.provider,
    key_id: env.key_id,
    signed_at: env.signed_at,
    payload: env.payload,
  });
}

export function isWellFormedEnvelope(x: unknown): x is OriginProofEnvelope {
  if (!x || typeof x !== 'object') return false;
  const e = x as Record<string, unknown>;
  return (
    typeof e.provider === 'string' && e.provider.length > 0 &&
    typeof e.key_id === 'string' && e.key_id.length > 0 &&
    typeof e.signed_at === 'string' && !Number.isNaN(Date.parse(e.signed_at)) &&
    typeof e.signature === 'string' && /^[0-9a-f]+$/i.test(e.signature) &&
    'payload' in e
  );
}

export function isFresh(signedAt: string, now: number = Date.now(), maxAgeMs: number = ORIGIN_PROOF_MAX_AGE_MS): boolean {
  const t = Date.parse(signedAt);
  if (Number.isNaN(t)) return false;
  return Math.abs(now - t) <= maxAgeMs;
}

/**
 * Constant-time hex comparison. Length mismatch = false (not constant-time on length itself,
 * but signature length is public).
 */
export function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Browser-side HMAC-SHA256 verify. Used for local tests and UI demos.
 * Edge-function verify lives in supabase/functions/_shared/originProof.ts.
 */
export async function verifyHmacSha256(secret: string, message: string, expectedHex: string): Promise<boolean> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const sigHex = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return constantTimeEqualHex(sigHex, expectedHex.toLowerCase());
}
