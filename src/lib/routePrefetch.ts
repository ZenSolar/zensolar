/**
 * Pass A · #16 — Per-route hover prefetch.
 *
 * Lightweight registry mapping top-traffic route URLs (or URL prefixes) to
 * their lazy-loaded chunk imports. Calling the import function pulls the
 * chunk over the wire without rendering it, so by the time the user clicks
 * the route is already parsed and ready.
 *
 * - Only registers routes that are realistically clicked from the sidebar.
 * - Idempotent: each chunk is fetched at most once per session.
 * - Fails silently — prefetch is best-effort.
 */

type Importer = () => Promise<unknown>;

const prefetched = new Set<string>();

// Top-traffic routes only. Admin and rarely-visited pages omitted on purpose —
// we don't want to flood the network on hover of a 60-item sidebar.
const REGISTRY: Array<[string, Importer]> = [
  ["/", () => import("@/components/ZenSolarDashboard")],
  ["/profile", () => import("@/pages/Profile")],
  ["/settings", () => import("@/pages/Settings")],
  ["/wallet", () => import("@/pages/Wallet")],
  ["/energy-log", () => import("@/pages/EnergyLog")],
  ["/mint-history", () => import("@/pages/MintHistory")],
  ["/nft-collection", () => import("@/pages/NftCollection")],
  ["/store", () => import("@/pages/Store")],
  ["/referrals", () => import("@/pages/Referrals")],
  ["/learn", () => import("@/pages/Learn")],
  ["/onboarding", () => import("@/pages/Onboarding")],
];

export function prefetchRoute(url: string | undefined | null) {
  if (!url) return;
  if (prefetched.has(url)) return;
  const entry = REGISTRY.find(([u]) => u === url);
  if (!entry) return;
  prefetched.add(url);
  // Best-effort — never throw on a hover handler.
  entry[1]().catch(() => prefetched.delete(url));
}
