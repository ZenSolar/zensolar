/**
 * Guided tour state for the Investor Demo.
 * Steps are defined by data-tour="<id>" attributes on target elements.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const SEEN_KEY = 'zs:demo:tour:v1';

export interface TourStep {
  id: string;
  title: string;
  body: string;
}

export const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: 'energy',
    title: 'Live Energy Monitoring',
    body: 'First-of-its-kind multi-OEM view — Tesla, Enphase, SolarEdge, Wallbox in one cockpit.',
  },
  {
    id: 'kpi',
    title: 'KPI Cards',
    body: 'Real-time solar, battery, EV miles, and charging energy. Every kWh is mintable.',
  },
  {
    id: 'mint',
    title: 'Tap-to-Mint™',
    body: 'One tap turns verified clean energy into hard-capped $ZSOLAR currency.',
  },
  {
    id: 'wallet',
    title: 'Wallet Update',
    body: 'Your minted $ZSOLAR balance updates instantly — 1 kWh = 1 $ZSOLAR.',
  },
  {
    id: 'pog',
    title: 'Proof-of-Genesis™ Receipt',
    body: 'Every mint produces a cryptographic receipt anchored on Base. This is the moat.',
  },
];

export function hasSeenTour(): boolean {
  if (typeof window === 'undefined') return true;
  try { return window.localStorage.getItem(SEEN_KEY) === '1'; } catch { return true; }
}

function markSeen() {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(SEEN_KEY, '1'); } catch { /* noop */ }
}

export function useGuidedTour(steps: TourStep[] = DEFAULT_TOUR_STEPS) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = useCallback(() => {
    setStepIndex(0);
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    setActive(false);
    markSeen();
  }, []);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i + 1 >= steps.length) {
        clearTimer();
        setActive(false);
        markSeen();
        return i;
      }
      return i + 1;
    });
  }, [steps.length]);

  // Auto-scroll target into view + auto-advance.
  useEffect(() => {
    if (!active) return;
    const step = steps[stepIndex];
    if (!step) return;
    const target = document.querySelector<HTMLElement>(`[data-tour="${step.id}"]`);
    if (target) {
      try {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch { /* noop */ }
    }
    clearTimer();
    timerRef.current = window.setTimeout(() => next(), 12_000);
    return clearTimer;
  }, [active, stepIndex, steps, next]);

  return { active, stepIndex, step: steps[stepIndex], steps, start, stop, next };
}
