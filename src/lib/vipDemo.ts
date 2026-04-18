/**
 * VIP demo helpers — codes that mirror the admin's live data instead of synthetic demo data.
 *
 * Flow:
 *  1. User enters TODD-2026 (or any registered VIP-mirror code) on /demo
 *  2. After NDA + VIP welcome screen, we set `VIP_MIRROR_KEY` in localStorage
 *  3. /demo route reads that key and renders the live mirror dashboard
 */

const VIP_MIRROR_KEY = 'zen_vip_mirror_active';

/** Codes that grant a live-data mirror of the admin dashboard. */
export const VIP_MIRROR_CODES = new Set<string>(['TODD-2026']);

export function isVipMirrorCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return VIP_MIRROR_CODES.has(code.trim().toUpperCase());
}

export function activateVipMirror(code: string) {
  try {
    localStorage.setItem(VIP_MIRROR_KEY, code.trim().toUpperCase());
  } catch {}
}

export function isVipMirrorActive(): boolean {
  try {
    const code = localStorage.getItem(VIP_MIRROR_KEY);
    return !!code && VIP_MIRROR_CODES.has(code);
  } catch {
    return false;
  }
}

export function clearVipMirror() {
  try {
    localStorage.removeItem(VIP_MIRROR_KEY);
  } catch {}
}
