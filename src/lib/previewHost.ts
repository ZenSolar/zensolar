/**
 * True when the app is running on a Lovable preview host (id-preview, *.lovable.app,
 * *.lovable.dev) or on localhost. Used to bypass investor gates (PIN + NDA) so
 * reviewers can walk the full pitch surface without signing anything in preview.
 *
 * Production hosts (zensolar.com, zen.solar, beta.zen.solar, the published
 * zensolar.lovable.app vanity domain) MUST still enforce the gates.
 */
export function isPreviewHost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  // Anything except prod domains is treated as preview.
  const PROD = [
    'zensolar.com',
    'www.zensolar.com',
    'zen.solar',
    'www.zen.solar',
    'beta.zen.solar',
    'zensolar.lovable.app', // published vanity domain
  ];
  if (PROD.includes(h)) return false;
  if (h === 'localhost' || h === '127.0.0.1' || h === 'lovable.dev') return true;
  if (h.endsWith('.lovable.app') || h.endsWith('.lovable.dev')) return true;
  return false;
}
