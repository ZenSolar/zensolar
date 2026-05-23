/**
 * Recover from a stale-chunk / "Importing a module script failed" error.
 *
 * After a fresh publish, an installed PWA (or a tab that has been open across
 * a deploy) holds an `index.html` that references JS chunks whose hashes
 * no longer exist on the server. Any dynamic import then fails and the app
 * crashes. A plain `location.reload()` is not enough because the browser/SW
 * may serve the same stale HTML again — we need to drop caches, unregister
 * service workers, and force a network revalidation.
 *
 * Rate-limited via sessionStorage so we don't loop forever if the failure
 * is something else.
 */
export async function recoverFromStaleChunk(reason: string): Promise<void> {
  const RELOAD_KEY = "chunk_error_reload_at";
  const COOLDOWN_MS = 30_000;

  try {
    const lastReload = sessionStorage.getItem(RELOAD_KEY);
    if (lastReload && Date.now() - Number(lastReload) < COOLDOWN_MS) {
      // Already tried very recently — let the ErrorBoundary UI show so the
      // user can manually retry instead of us looping.
      console.warn("[recoverFromStaleChunk] Within cooldown, not auto-reloading:", reason);
      return;
    }
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // sessionStorage may be unavailable (private mode) — proceed anyway.
  }

  console.warn("[recoverFromStaleChunk] Clearing caches & reloading. Reason:", reason);

  // 1. Drop all Cache Storage entries (covers any SW-cached HTML/JS).
  try {
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
  } catch (e) {
    console.warn("[recoverFromStaleChunk] caches.delete failed:", e);
  }

  // 2. Unregister all service workers so the next load goes to network.
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch (e) {
    console.warn("[recoverFromStaleChunk] SW unregister failed:", e);
  }

  // 3. Hard reload with a cache-busting query so even an aggressive HTTP
  //    cache layer revalidates `index.html`.
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("_r", String(Date.now()));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}

const STALE_CHUNK_PATTERNS = [
  "Importing a module script failed",
  "Failed to fetch dynamically imported module",
  "error loading dynamically imported module",
  "Loading chunk",
  "Loading CSS chunk",
  "ChunkLoadError",
];

export function isStaleChunkError(err: unknown): boolean {
  const msg =
    (err as { message?: string } | null)?.message ??
    (typeof err === "string" ? err : "");
  if (!msg) return false;
  return STALE_CHUNK_PATTERNS.some((p) => msg.includes(p));
}

/**
 * Install global listeners that catch chunk-load failures happening
 * outside the React tree (e.g. during route navigation / dynamic import)
 * and trigger recovery before the ErrorBoundary even mounts.
 */
export function installStaleChunkRecovery(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    if (isStaleChunkError(event.error) || isStaleChunkError(event.message)) {
      void recoverFromStaleChunk(`window.error: ${event.message}`);
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (isStaleChunkError(event.reason)) {
      void recoverFromStaleChunk(
        `unhandledrejection: ${(event.reason as { message?: string })?.message ?? event.reason}`,
      );
    }
  });
}
