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

/**
 * Public marketing / pre-auth surfaces. These pages never touch wallets,
 * charts or any dashboard-only code, so the heavy Web3 stack must not be
 * pulled in for anonymous visitors landing here.
 */
const PUBLIC_PATH_PREFIXES = ['/home', '/invite', '/onboarding'];

export function isPublicMarketingPath(pathname?: string): boolean {
  if (typeof window === 'undefined') return false;
  const path = pathname ?? window.location.pathname;
  if (path === '/' && isMarketingHost()) return true;
  return PUBLIC_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export { MARKETING_HOSTS, APP_HOSTS };
