/**
 * Investor Demo Mode — single flag that flips the in-app /demo experience
 * from the standard seeded-user dataset into a richly-instrumented "best-case"
 * investor demo (full solar + Powerwall + Tesla EV plugged in + Wallbox).
 *
 * Storage: localStorage key `zs:investor-demo:v1` (boolean).
 * Entry points:
 *   - `?demo=investor` URL param (sticky, one-link share)
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

function readStored(): boolean {
  if (typeof window === 'undefined') return false;
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

  // Pick up `?demo=investor` URL param on mount and persist it.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const v = sp.get('demo');
      if (v === 'investor' && !readStored()) {
        writeStored(true);
        setEnabled(true);
      } else if (v === 'off' && readStored()) {
        writeStored(false);
        setEnabled(false);
      }
    } catch {
      /* noop */
    }
  }, []);

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
