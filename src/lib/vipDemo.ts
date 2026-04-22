/**
 * VIP demo helpers — codes that grant a personalized welcome screen + ★ VIP
 * badge on the demo dashboard. Some codes (mirror codes) historically also
 * unlocked a live-data mirror of the admin dashboard; that path is now unwired
 * but the helpers are kept for backward compatibility.
 */

const VIP_MIRROR_KEY = 'zen_vip_mirror_active';
const VIP_CODE_KEY = 'zen_vip_code_active';

/** Codes that historically unlocked the live-data mirror (now unwired). */
export const VIP_MIRROR_CODES = new Set<string>(['TODD-2026']);

/** All VIP codes — get the personalized welcome + ★ VIP badge on the dashboard. */
export const VIP_CODES = new Set<string>(['TODD-2026', 'JO-2026', 'LOBV-2026', 'MTNYOTAS-4L', 'FUCKYEAH-TAYTAY-2026']);

export function isVipMirrorCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return VIP_MIRROR_CODES.has(code.trim().toUpperCase());
}

export function isVipCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return VIP_CODES.has(code.trim().toUpperCase());
}

export function activateVipMirror(code: string) {
  try {
    localStorage.setItem(VIP_MIRROR_KEY, code.trim().toUpperCase());
  } catch {}
}

export function activateVipCode(code: string) {
  try {
    localStorage.setItem(VIP_CODE_KEY, code.trim().toUpperCase());
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

export function isVipActive(): boolean {
  try {
    const code = localStorage.getItem(VIP_CODE_KEY);
    if (code && VIP_CODES.has(code)) return true;
    // Backward compat: mirror activation also counts as VIP
    const mirror = localStorage.getItem(VIP_MIRROR_KEY);
    return !!mirror && VIP_CODES.has(mirror);
  } catch {
    return false;
  }
}

export function clearVipMirror() {
  try {
    localStorage.removeItem(VIP_MIRROR_KEY);
  } catch {}
}

export function clearVipCode() {
  try {
    localStorage.removeItem(VIP_CODE_KEY);
  } catch {}
}
