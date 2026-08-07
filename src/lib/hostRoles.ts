/**
 * Host role routing.
 *
 * Marketing hosts (zensolar.com, zen.solar and their www variants) must ALWAYS
 * serve the public marketing page at "/", even for a signed-in user.
 * App hosts (beta.zensolar.com / beta.zen.solar) are the front door for people
 * logging into the product.
 * Everything else (previews, localhost, published lovable.app) behaves like an
 * app host so the team can work on the product surface.
 */
const MARKETING_HOSTS = new Set<string>([
  'zensolar.com',
  'www.zensolar.com',
  'zen.solar',
  'www.zen.solar',
]);

const APP_HOSTS = new Set<string>([
  'beta.zensolar.com',
  'www.beta.zensolar.com',
  'beta.zen.solar',
  'www.beta.zen.solar',
]);

export function isMarketingHost(): boolean {
  if (typeof window === 'undefined') return false;
  return MARKETING_HOSTS.has(window.location.hostname);
}

export function isAppHost(): boolean {
  if (typeof window === 'undefined') return true;
  return !MARKETING_HOSTS.has(window.location.hostname);
}

export { MARKETING_HOSTS, APP_HOSTS };
