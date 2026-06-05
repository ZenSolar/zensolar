import { Sparkles, X, Zap } from 'lucide-react';
import { useInvestorDemoMode, useInvestorOutageSim } from '@/hooks/useInvestorDemoMode';

/**
 * Floating "Investor Demo · Outage · Exit" pill — top-center on every /demo
 * page while investor demo mode is active. Sits just below the editor
 * PreviewBypassBar (top: safe-area + ~3rem) so the two never collide.
 */
export function InvestorDemoChip() {
  const { enabled, disable } = useInvestorDemoMode();
  const { enabled: outageOn, toggle: toggleOutage } = useInvestorOutageSim();
  if (!enabled) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[130] pointer-events-auto max-w-[calc(100vw-1.5rem)]"
      style={{ top: 'calc(env(safe-area-inset-top) + 3rem)' }}
      role="status"
      aria-live="polite"
    >
      <div
        className="group flex items-center gap-1.5 whitespace-nowrap rounded-full border border-primary/60 bg-gradient-to-r from-primary/25 via-primary/15 to-primary/25 pl-2.5 pr-1 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary shadow-[0_8px_28px_-8px_hsl(var(--primary)/0.75),0_0_0_1px_hsl(var(--primary)/0.25)] backdrop-blur-md ring-1 ring-primary/30"
      >
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-primary/70 opacity-80" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
        </span>
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="truncate hidden sm:inline">Investor Demo</span>
        <span className="truncate sm:hidden">Demo</span>
        <button
          type="button"
          onClick={toggleOutage}
          aria-label={outageOn ? 'Disable simulated grid outage' : 'Simulate grid outage'}
          aria-pressed={outageOn}
          title={outageOn ? 'Outage ON — tap to restore grid' : 'Simulate grid outage'}
          className={`inline-flex items-center gap-1 rounded-full h-7 min-w-7 px-2 text-[10px] font-bold tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
            outageOn
              ? 'bg-destructive/25 text-destructive hover:bg-destructive/35'
              : 'text-primary/85 hover:bg-primary/20 hover:text-primary'
          }`}
        >
          <Zap className="h-3 w-3" />
          <span className="hidden sm:inline">{outageOn ? 'Outage' : 'Sim'}</span>
        </button>
        <button
          type="button"
          onClick={disable}
          aria-label="Exit Investor Demo Mode"
          className="inline-flex items-center gap-1 rounded-full h-7 min-w-7 px-2 text-[10px] font-bold tracking-[0.14em] text-primary/85 transition-colors hover:bg-primary/20 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <X className="h-3 w-3" />
          <span className="hidden sm:inline">Exit</span>
        </button>
      </div>
    </div>
  );
}
