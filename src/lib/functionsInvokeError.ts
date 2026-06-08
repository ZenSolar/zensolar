/**
 * Normalize the `error` returned from `supabase.functions.invoke()`.
 *
 * `supabase-js` surfaces non-2xx responses as `FunctionsHttpError` with a
 * generic `message: "Edge Function returned a non-2xx status code"`. The
 * actual JSON body (where edge functions put `{ error, needsReauth }`) lives
 * on `context.response`. This helper extracts that body so callers can react
 * to `needsReauth: true` reliably instead of string-matching the message.
 */

export type NormalizedInvokeError = {
  /** HTTP status code if available */
  status: number | null;
  /** Parsed JSON body of the response, if any */
  body: any;
  /** True when the edge function asked the client to re-authenticate the OEM */
  needsReauth: boolean;
  /** True for 429 / "rate limit" responses */
  rateLimited: boolean;
  /** Raw error for logging */
  raw: unknown;
};

const EMPTY: NormalizedInvokeError = {
  status: null,
  body: null,
  needsReauth: false,
  rateLimited: false,
  raw: null,
};

export async function parseFunctionInvokeError(err: unknown): Promise<NormalizedInvokeError> {
  if (!err) return EMPTY;

  const anyErr = err as any;
  const response: Response | undefined = anyErr?.context?.response ?? anyErr?.response;
  let status: number | null = response?.status ?? null;
  let body: any = null;

  if (response && typeof response.clone === 'function') {
    try {
      const clone = response.clone();
      const text = await clone.text();
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }
    } catch {
      /* swallow — body unreadable */
    }
  }

  // Fallback: some errors expose a raw string in `.message` that already
  // contains the JSON body (e.g. Functions v2 returning the body inline).
  if (!body && typeof anyErr?.message === 'string') {
    const m = anyErr.message;
    const jsonStart = m.indexOf('{');
    if (jsonStart >= 0) {
      try {
        body = JSON.parse(m.slice(jsonStart));
      } catch {
        /* ignore */
      }
    }
  }

  const msg = (
    (typeof body === 'object' && body
      ? `${body.error ?? ''} ${body.message ?? ''} ${body.code ?? ''}`
      : String(body ?? '')) +
    ' ' +
    String(anyErr?.message ?? '')
  ).toLowerCase();

  const needsReauth =
    Boolean(body?.needsReauth) ||
    status === 401 ||
    msg.includes('needsreauth') ||
    msg.includes('token expired') ||
    msg.includes('login_required') ||
    msg.includes('invalid_grant');

  const rateLimited =
    status === 429 ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('usage limit exceeded');

  return { status, body, needsReauth, rateLimited, raw: err };
}

const warned = new Set<string>();
/** Console-warn once per provider per session. */
export function warnReauthOnce(provider: string, status: number | null) {
  if (warned.has(provider)) return;
  warned.add(provider);
  // eslint-disable-next-line no-console
  console.warn('[oem-reauth]', { provider, status });
}
