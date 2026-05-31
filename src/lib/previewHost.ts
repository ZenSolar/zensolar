/**
 * True when the app is running on a Lovable preview host (id-preview, *.lovable.app,
 * *.lovable.dev, *.lovableproject.com), localhost, OR any unknown non-production
 * host (e.g. when Lovable serves the preview through a wrapper / regional host).
 *
 * Used to bypass investor gates (PIN + NDA) so reviewers can walk the full
 * pitch surface without signing anything in preview.
 *
 * Production hosts (zensolar.com, zen.solar, beta.zen.solar, the published
 * zensolar.lovable.app vanity domain) MUST still enforce the gates.
 */
const PROD_HOSTS = new Set<string>([
  'zensolar.com',
  'www.zensolar.com',
  'zen.solar',
  'www.zen.solar',
  'beta.zen.solar',
  'zensolar.lovable.app', // published vanity domain
]);

export function isPreviewHost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  if (PROD_HOSTS.has(h)) return false;
  // Everything else (lovable.app, lovable.dev, lovableproject.com, localhost,
  // IPs, ngrok tunnels, unknown wrapper hosts) is treated as preview.
  return true;
}
