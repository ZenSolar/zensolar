import { Sparkles, X } from 'lucide-react';
import { useInvestorDemoMode } from '@/hooks/useInvestorDemoMode';

/**
 * Floating "Investor Demo · Exit" pill — top-center on every /demo page while
 * investor demo mode is active. Sits just below the editor PreviewBypassBar
 * (top: safe-area + ~3rem) so the two never collide. Bumped z-index above
 * the bypass bar so it always wins if they overlap in odd viewports.
 */
export function InvestorDemoChip() {
  const { enabled, disable } = useInvestorDemoMode();
  if (!enabled) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[130] pointer-events-auto max-w-[calc(100vw-1.5rem)]"
      style={{ top: 'calc(env(safe-area-inset-top) + 3rem)' }}
      role="status"
      aria-live="polite"
    >
      <div
        className="group flex items-center gap-1.5 whitespace-nowrap rounded-full border border-primary/60 bg-gradient-to-r from-primary/25 via-primary/15 to-primary/25 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary shadow-[0_8px_28px_-8px_hsl(var(--primary)/0.75),0_0_0_1px_hsl(var(--primary)/0.25)] backdrop-blur-md ring-1 ring-primary/30"
      >
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-primary/70 opacity-80" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
        </span>
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="truncate">Investor Demo</span>
        <button
          type="button"
          onClick={disable}
          aria-label="Exit Investor Demo Mode"
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-[0.14em] text-primary/85 transition-colors hover:bg-primary/20 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <X className="h-3 w-3" />
          Exit
        </button>
      </div>
    </div>
  );
}
