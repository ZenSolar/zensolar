import { lazy, Suspense } from 'react';
import { isVipMirrorActive } from '@/lib/vipDemo';
import { Loader2 } from 'lucide-react';

const DemoDashboard = lazy(() =>
  import('@/components/demo/DemoDashboard').then(m => ({ default: m.DemoDashboard }))
);
const LiveMirrorDashboard = lazy(() =>
  import('@/components/demo/LiveMirrorDashboard').then(m => ({ default: m.LiveMirrorDashboard }))
);

/**
 * Routes the /demo index to either:
 *  - LiveMirrorDashboard for VIP-mirror codes (TODD-2026, etc.) — shows admin's real data
 *  - DemoDashboard for everyone else — synthetic showcase data
 */
export function DemoDashboardSwitcher() {
  const useLiveMirror = isVipMirrorActive();

  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      {useLiveMirror ? <LiveMirrorDashboard /> : <DemoDashboard />}
    </Suspense>
  );
}
