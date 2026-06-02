/**
 * Investor Pass — single source of truth for "this visitor already cleared
 * the /investor PIN gate AND signed the NDA on that page."
 *
 * Written by `/investor` on successful NDA signature. Consumed by
 * `DemoAccessGate` (which wraps `/demo/*`) to skip its own PIN/NDA steps and
 * send the investor straight to the demo dashboard.
 *
 * Storage: localStorage only. Long-lived (no TTL) — the visitor explicitly
 * signed an NDA on /investor; we honor that until they clear browser storage.
 */

export const INVESTOR_PASS_KEY = 'zs_investor_pass';

export interface InvestorPass {
  email: string;
  fullName: string;
  ndaVersion: string;
  signedAt: string;
}

function safeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function writeInvestorPass(pass: InvestorPass): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem(INVESTOR_PASS_KEY, JSON.stringify(pass));
  } catch {
    /* storage blocked */
  }
}

export function readInvestorPass(): InvestorPass | null {
  const storage = safeStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(INVESTOR_PASS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<InvestorPass>;
    if (
      typeof parsed?.email === 'string' &&
      parsed.email.length > 0 &&
      typeof parsed?.fullName === 'string' &&
      parsed.fullName.length > 0
    ) {
      return {
        email: parsed.email,
        fullName: parsed.fullName,
        ndaVersion: parsed.ndaVersion ?? '1.0',
        signedAt: parsed.signedAt ?? '',
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function hasInvestorPass(): boolean {
  return readInvestorPass() !== null;
}

export function clearInvestorPass(): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.removeItem(INVESTOR_PASS_KEY);
  } catch {
    /* ignore */
  }
}
