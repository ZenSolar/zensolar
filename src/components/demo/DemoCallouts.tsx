import { useEffect, useState } from 'react';
import { useInvestorDemoMode } from '@/hooks/useInvestorDemoMode';

const SEEN_KEY = 'zs:demo:callouts:seen:v1';
const FADE_MS = 8000;

interface Spot { top: number; left: number; width: number; height: number; }

const TARGETS: Array<{ id: string; num: number; label: string }> = [
  { id: 'kpi', num: 1, label: 'Live kWh' },
  { id: 'mint', num: 2, label: 'MINT' },
  { id: 'wallet', num: 3, label: 'Wallet' },
];

/**
 * Subtle numbered callouts that explain the three core areas of the demo.
 * Auto-fades after ~8 seconds OR on first tap anywhere. One-shot per visitor.
 */
export function DemoCallouts() {
  const { enabled } = useInvestorDemoMode();
  const [visible, setVisible] = useState(false);
  const [spots, setSpots] = useState<Record<string, Spot | null>>({});

  useEffect(() => {
    if (!enabled) return;
    try { if (window.localStorage.getItem(SEEN_KEY) === '1') return; } catch { /* noop */ }
    // Defer until after any initial guided-tour invite settles.
    const t = window.setTimeout(() => {
      // Skip if the guided tour overlay is currently mounted.
      if (document.querySelector('[data-guided-tour="active"]')) return;
      setVisible(true);
    }, 1800);
    return () => window.clearTimeout(t);
  }, [enabled]);

  useEffect(() => {
    if (!visible) return;
    const dismiss = () => {
      setVisible(false);
      try { window.localStorage.setItem(SEEN_KEY, '1'); } catch { /* noop */ }
    };
    const measure = () => {
      const next: Record<string, Spot | null> = {};
      for (const t of TARGETS) {
        const el = document.querySelector<HTMLElement>(`[data-tour="${t.id}"]`);
        if (!el) { next[t.id] = null; continue; }
        const r = el.getBoundingClientRect();
        next[t.id] = { top: r.top, left: r.left, width: r.width, height: r.height };
      }
      setSpots(next);
    };
    measure();
    const measureTimer = window.setInterval(measure, 250);
    const fadeTimer = window.setTimeout(dismiss, FADE_MS);
    const onTap = () => dismiss();
    window.addEventListener('pointerdown', onTap, { once: true });
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.clearInterval(measureTimer);
      window.clearTimeout(fadeTimer);
      window.removeEventListener('pointerdown', onTap);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [visible]);

  if (!enabled || !visible) return null;

  return (
    <div className="fixed inset-0 z-[110] pointer-events-none">
      {TARGETS.map((t) => {
        const s = spots[t.id];
        if (!s) return null;
        // Anchor chip at top-right of element, slightly inset.
        const top = Math.max(8, s.top + 8);
        const left = Math.max(8, s.left + s.width - 96);
        return (
          <div
            key={t.id}
            className="absolute flex items-center gap-1.5 rounded-full border border-secondary/60 bg-card/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary shadow-lg animate-fade-in"
            style={{ top, left }}
          >
            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold">
              {t.num}
            </span>
            {t.label}
          </div>
        );
      })}
    </div>
  );
}
