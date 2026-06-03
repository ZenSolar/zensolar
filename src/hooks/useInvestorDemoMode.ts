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

// ─────────────────────────────────────────────────────────────────────────────
// Investor Demo · Grid Outage Simulation
//
// Companion flag to `useInvestorDemoMode` — lets founders flip the demo
// dashboard into a full simulated grid-outage state on demand, so the
// Outage Mode UI + Deason outage context can be tested without waiting for
// a real outage. Purely client-side; never writes to Supabase.
// ─────────────────────────────────────────────────────────────────────────────
const OUTAGE_STORAGE_KEY = 'zs:investor-demo:outage:v1';
const OUTAGE_EVENT_NAME = 'zs:investor-demo:outage:changed';
const OUTAGE_STARTED_AT_KEY = 'zs:investor-demo:outage:started-at:v1';

function readOutageStored(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(OUTAGE_STORAGE_KEY) === '1';
  } catch { return false; }
}

function writeOutageStored(on: boolean) {
  if (typeof window === 'undefined') return;
  try {
    if (on) {
      window.localStorage.setItem(OUTAGE_STORAGE_KEY, '1');
      if (!window.localStorage.getItem(OUTAGE_STARTED_AT_KEY)) {
        window.localStorage.setItem(OUTAGE_STARTED_AT_KEY, new Date().toISOString());
      }
    } else {
      window.localStorage.removeItem(OUTAGE_STORAGE_KEY);
      window.localStorage.removeItem(OUTAGE_STARTED_AT_KEY);
    }
    window.dispatchEvent(new CustomEvent(OUTAGE_EVENT_NAME, { detail: { on } }));
  } catch { /* storage blocked */ }
}

export function isInvestorOutageSimSync(): boolean {
  return readOutageStored();
}

export function useInvestorOutageSim(): {
  active: boolean;
  startedAt: Date | null;
  enable: () => void;
  disable: () => void;
  toggle: () => void;
} {
  const [active, setActive] = useState<boolean>(() => readOutageStored());
  const [startedAt, setStartedAt] = useState<Date | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(OUTAGE_STARTED_AT_KEY);
    return raw ? new Date(raw) : null;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onChange = () => {
      setActive(readOutageStored());
      const raw = window.localStorage.getItem(OUTAGE_STARTED_AT_KEY);
      setStartedAt(raw ? new Date(raw) : null);
    };
    window.addEventListener(OUTAGE_EVENT_NAME, onChange as EventListener);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(OUTAGE_EVENT_NAME, onChange as EventListener);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const enable = useCallback(() => writeOutageStored(true), []);
  const disable = useCallback(() => writeOutageStored(false), []);
  const toggle = useCallback(() => writeOutageStored(!readOutageStored()), []);

  return { active, startedAt, enable, disable, toggle };
}

