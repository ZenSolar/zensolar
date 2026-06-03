/**
 * Investor Demo Mode — single flag that flips the in-app /demo experience
 * from the standard seeded-user dataset into a richly-instrumented "best-case"
 * investor demo (full solar + Powerwall + Tesla EV plugged in + Wallbox).
 *
 * Storage: localStorage key `zs:investor-demo:v1` (boolean).
 * Entry points:
 *   - `?demo=investor` URL param (sticky, one-link share) — honored
 *     SYNCHRONOUSLY in readStored() so the very first render already sees
 *     enabled=true (no flash of the plain AnimatedEnergyFlow).
 *   - `<EnterInvestorDemoButton />` on /investor hub
 *   - `setInvestorDemoMode(true|false)` programmatic toggle
 *
 * Strictly client-side. NEVER writes to Supabase. NEVER affects real users'
 * device telemetry — only feeds richer fixtures into the demo dashboard so
 * an investor sees an impressive "fully connected home" out of the gate.
 */
import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'zs:investor-demo:v1';
const EVENT_NAME = 'zs:investor-demo:changed';

function readUrlParam(): 'on' | 'off' | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = new URLSearchParams(window.location.search).get('demo');
    if (v === 'investor') return 'on';
    if (v === 'off') return 'off';
    return null;
  } catch {
    return null;
  }
}

function readStored(): boolean {
  if (typeof window === 'undefined') return false;
  // Synchronously honor `?demo=investor` so the FIRST render of every
  // consumer already sees enabled=true. Persist as a side-effect so reloads
  // and other tabs stay in sync.
  const urlParam = readUrlParam();
  if (urlParam === 'on') {
    try { window.localStorage.setItem(STORAGE_KEY, '1'); } catch { /* noop */ }
    return true;
  }
  if (urlParam === 'off') {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    return false;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeStored(on: boolean) {
  if (typeof window === 'undefined') return;
  try {
    if (on) window.localStorage.setItem(STORAGE_KEY, '1');
    else window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { on } }));
  } catch {
    /* storage blocked */
  }
}

export function setInvestorDemoMode(on: boolean) {
  writeStored(on);
}

export function isInvestorDemoModeSync(): boolean {
  return readStored();
}

export function useInvestorDemoMode(): {
  enabled: boolean;
  enable: () => void;
  disable: () => void;
  toggle: () => void;
} {
  const [enabled, setEnabled] = useState<boolean>(() => readStored());

  // Cross-component + cross-tab sync.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onChange = () => setEnabled(readStored());
    window.addEventListener(EVENT_NAME, onChange as EventListener);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(EVENT_NAME, onChange as EventListener);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const enable = useCallback(() => writeStored(true), []);
  const disable = useCallback(() => writeStored(false), []);
  const toggle = useCallback(() => writeStored(!readStored()), []);

  return { enabled, enable, disable, toggle };
}
