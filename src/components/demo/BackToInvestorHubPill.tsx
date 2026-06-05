import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useInvestorDemoMode } from '@/hooks/useInvestorDemoMode';

/**
 * Persistent "← Back to Investor Hub" pill shown on every /demo page while
 * investor demo mode is on. Positioned to avoid colliding with the top-center
 * InvestorDemoChip.
 */
export function BackToInvestorHubPill() {
  const { enabled } = useInvestorDemoMode();
  if (!enabled) return null;

  return (
    <Link
      to="/investor"
      className="md:hidden fixed z-[120] inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/70 backdrop-blur-md px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm transition-colors hover:bg-card hover:text-foreground hover:border-secondary/40
        left-3 top-[calc(env(safe-area-inset-top)+3rem)]"
      aria-label="Back to Investor Hub"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      <span>Hub</span>
    </Link>
  );
}
