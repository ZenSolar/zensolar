/**
 * Capture / presentation mode.
 *
 * Presentation-only: hides development affordances (feedback FAB, floating
 * assistant bubble, destructive icon buttons, notification count badges) so a
 * screen capture shows the product surface and nothing else.
 *
 * It changes nothing about behaviour or data — only visibility.
 *
 * Enable with `?capture=1` on any route, or persist it with `?capture=on`.
 * Disable with `?capture=0` / `?capture=off`.
 *
 * Elements opt in by carrying `data-capture-hide`. The rule lives in
 * `src/index.css` under `[data-capture-mode='on']`.
 */

const STORAGE_KEY = 'zensolar:capture-mode';
const BODY_ATTR = 'data-capture-mode';

export function readCaptureModeFromLocation(search: string): boolean | null {
  const raw = new URLSearchParams(search).get('capture');
  if (raw == null) return null;
  const v = raw.toLowerCase();
  if (v === '1' || v === 'on' || v === 'true') return true;
  if (v === '0' || v === 'off' || v === 'false') return false;
  return null;
}

export function isCaptureMode(): boolean {
  if (typeof window === 'undefined') return false;
  const fromUrl = readCaptureModeFromLocation(window.location.search);
  if (fromUrl !== null) return fromUrl;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

/** Applies the body attribute and persists an explicit URL override. */
export function syncCaptureMode(search: string): boolean {
  if (typeof document === 'undefined') return false;
  const fromUrl = readCaptureModeFromLocation(search);
  if (fromUrl !== null) {
    try {
      window.localStorage.setItem(STORAGE_KEY, fromUrl ? 'on' : 'off');
    } catch {
      /* storage unavailable — URL flag still applies for this view */
    }
  }
  const on = isCaptureMode();
  document.body.setAttribute(BODY_ATTR, on ? 'on' : 'off');
  return on;
}
