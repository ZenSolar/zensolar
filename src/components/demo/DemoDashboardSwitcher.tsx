import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const DemoDashboard = lazy(() =>
  import('@/components/demo/DemoDashboard').then(m => ({ default: m.DemoDashboard }))
);

/**
 * Routes the /demo index to the synthetic showcase DemoDashboard for everyone,
 * including VIP-mirror codes (TODD-2026, etc.). VIPs still get the personalized
 * VipWelcomeScreen before entering, plus a small "VIP" badge inside DemoDashboard.
 *
 * The LiveMirrorDashboard is intentionally left in the codebase (unwired) in
 * case we want to bring it back later.
 */
export function DemoDashboardSwitcher() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <DemoDashboard />
    </Suspense>
  );
}
