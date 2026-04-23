// Tracks the last founder-area route the user visited, per-user, per-session.
// Used by VaultPinGate to default unlock destination + power "Jump to Chapter".

const PREFIX = "zen.vault-last-route:";

export const FOUNDER_ROUTE_PREFIXES = [
  "/founders",
  "/founder-pack",
] as const;

export function isFounderRoute(path: string): boolean {
  return FOUNDER_ROUTE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export function rememberFounderRoute(userId: string | undefined, path: string) {
  if (!userId || typeof window === "undefined") return;
  if (!isFounderRoute(path)) return;
  try {
    sessionStorage.setItem(`${PREFIX}${userId}`, path);
  } catch {
    /* ignore quota errors */
  }
}

export function getLastFounderRoute(userId: string | undefined): string | null {
  if (!userId || typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(`${PREFIX}${userId}`);
  } catch {
    return null;
  }
}
