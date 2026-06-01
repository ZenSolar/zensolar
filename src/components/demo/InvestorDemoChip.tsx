import { Sparkles, X } from 'lucide-react';
import { useInvestorDemoMode } from '@/hooks/useInvestorDemoMode';

/**
 * Floating "Investor Demo" chip — visible top-center on every page inside
 * /demo while investor demo mode is active. One-tap exit returns the demo
 * to its standard seeded dataset (no page reload needed).
 */
export function InvestorDemoChip() {
  const { enabled, disable } = useInvestorDemoMode();
  if (!enabled) return null;

  return (
    <div
      className="fixed left-1/2 top-2 z-[60] -translate-x-1/2 pointer-events-auto"
      role="status"
      aria-live="polite"
    >
      <div
        className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-background/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary shadow-[0_4px_18px_-6px_hsl(var(--primary)/0.55)] backdrop-blur-sm"
      >
        <Sparkles className="h-3 w-3" aria-hidden="true" />
        <span>Investor Demo Mode</span>
        <button
          type="button"
          onClick={disable}
          aria-label="Exit Investor Demo Mode"
          className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-primary/70 transition-colors hover:bg-primary/15 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
