/**
 * Returns true when the app is running in a non-production preview context:
 * - Vite dev server (`npm run dev`)
 * - Lovable in-editor preview (`*.lovable.app` / `*.lovableproject.com`)
 * - localhost
 *
 * Returns false on the live published / custom domains so unfinished features
 * stay hidden until we explicitly launch them.
 */
export function isPreviewMode(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com")
  );
}
