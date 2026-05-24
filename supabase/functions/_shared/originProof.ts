/**
 * Pillar 2 · Source — edge-side HMAC verification for `origin_proof` envelopes.
 *
 * Canonicalization MUST match src/lib/originProof.ts byte-for-byte.
 * Registry of provider secrets lives in `public.origin_proof_keys`.
 *
 * Operator note: the registry only stores SHA-256 fingerprints of the shared
 * secret. The actual secret material is provided to this edge function via
 * environment variable `ORIGIN_PROOF_SECRETS` as a JSON map of
 *   { "<provider>:<key_id>": "<raw-secret>" }
 * If the env var is missing or the lookup fails, the verifier returns
 * `unknown_key` and the caller decides whether to soft-warn or hard-fail.
 */

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
  signed_at: string;
  payload: unknown;
  signature: string;
}

export interface OriginProofVerifyOutcome {
  result: OriginProofResult;
  provider: string | null;
  key_id: string | null;
  payload_hash: string | null;
  details: Record<string, unknown>;
}

const MAX_AGE_MS = 10 * 60 * 1000;

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']';
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return '{' + keys
    .map((k) => JSON.stringify(k) + ':' + canonicalize((value as Record<string, unknown>)[k]))
    .join(',') + '}';
}

function canonicalMessage(env: OriginProofEnvelope): string {
  return canonicalize({
    provider: env.provider,
    key_id: env.key_id,
    signed_at: env.signed_at,
    payload: env.payload,
  });
}

function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return toHex(buf);
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return toHex(sig);
}

function isWellFormedEnvelope(x: unknown): x is OriginProofEnvelope {
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

function loadSecretMap(): Record<string, string> {
  const raw = Deno.env.get('ORIGIN_PROOF_SECRETS');
  if (!raw) return {};
  try { return JSON.parse(raw) as Record<string, string>; }
  catch { return {}; }
}

/**
 * Verify an envelope. `supabase` is a service-role client used to consult the
 * registry (revocation + algorithm). Returns an outcome the caller should also
 * persist to `origin_proof_verifications` for audit.
 */
export async function verifyOriginProof(
  supabase: { from: (t: string) => any },
  envelope: unknown,
): Promise<OriginProofVerifyOutcome> {
  if (envelope === null || envelope === undefined) {
    return { result: 'missing', provider: null, key_id: null, payload_hash: null, details: {} };
  }
  if (!isWellFormedEnvelope(envelope)) {
    return { result: 'malformed', provider: null, key_id: null, payload_hash: null, details: {} };
  }

  const env = envelope as OriginProofEnvelope;
  const message = canonicalMessage(env);
  const payload_hash = await sha256Hex(canonicalize(env.payload));

  // Freshness
  const ts = Date.parse(env.signed_at);
  if (Math.abs(Date.now() - ts) > MAX_AGE_MS) {
    return { result: 'expired', provider: env.provider, key_id: env.key_id, payload_hash,
      details: { signed_at: env.signed_at } };
  }

  // Registry lookup
  const { data: keyRow, error } = await supabase
    .from('origin_proof_keys')
    .select('provider, key_id, algorithm, revoked_at')
    .eq('provider', env.provider)
    .eq('key_id', env.key_id)
    .maybeSingle();

  if (error || !keyRow) {
    return { result: 'unknown_key', provider: env.provider, key_id: env.key_id, payload_hash, details: {} };
  }
  if (keyRow.revoked_at) {
    return { result: 'revoked', provider: env.provider, key_id: env.key_id, payload_hash,
      details: { revoked_at: keyRow.revoked_at } };
  }

  const algo = (env.algorithm || keyRow.algorithm || 'HMAC-SHA256').toUpperCase();
  if (algo !== 'HMAC-SHA256') {
    return { result: 'malformed', provider: env.provider, key_id: env.key_id, payload_hash,
      details: { reason: 'unsupported_algorithm', algorithm: algo } };
  }

  const secrets = loadSecretMap();
  const secret = secrets[`${env.provider}:${env.key_id}`];
  if (!secret) {
    return { result: 'unknown_key', provider: env.provider, key_id: env.key_id, payload_hash,
      details: { reason: 'secret_not_provisioned' } };
  }

  const expected = await hmacHex(secret, message);
  if (!constantTimeEqualHex(expected, env.signature.toLowerCase())) {
    return { result: 'invalid_signature', provider: env.provider, key_id: env.key_id, payload_hash, details: {} };
  }

  return { result: 'valid', provider: env.provider, key_id: env.key_id, payload_hash, details: {} };
}

/**
 * Log a verification outcome. Best-effort: failures here must not block ingestion.
 */
export async function logOriginProofVerification(
  supabase: { from: (t: string) => any },
  userId: string | null,
  action: string,
  outcome: OriginProofVerifyOutcome,
): Promise<void> {
  try {
    await supabase.from('origin_proof_verifications').insert({
      user_id: userId,
      provider: outcome.provider ?? 'unknown',
      key_id: outcome.key_id,
      action,
      result: outcome.result,
      payload_hash: outcome.payload_hash,
      details: outcome.details ?? {},
    });
  } catch (_e) { /* swallow */ }
}
