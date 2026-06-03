/**
 * Sanitize a `?redirect=` query param so we only ever navigate to a same-origin,
 * single-leading-slash path. Anything else (absolute URL, protocol-relative,
 * empty, null) falls back to the safe default.
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  // Must start with a single "/" and not "//" (which would be protocol-relative).
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  // Disallow whitespace / control chars / backslash tricks.
  if (/[\s\\]/.test(raw)) return fallback;
  return raw;
}
