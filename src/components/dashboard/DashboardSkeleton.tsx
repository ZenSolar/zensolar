import { Skeleton } from '@/components/ui/skeleton';
import { DashboardHexBackground } from './DashboardHexBackground';

/**
 * Layout-matching skeleton for the post-auth dashboard.
 *
 * Replaces the full-screen `BrandedSpinner` flash so the perceived load
 * feels instant — same hex background, same card rhythm, same vertical
 * spacing as the real `ZenSolarDashboard`. Shimmer is handled by the
 * base `Skeleton` primitive (animate-pulse + muted token).
 */
export function DashboardSkeleton() {
  return (
    <div className="bg-background min-h-full w-full relative overflow-x-hidden">
      <DashboardHexBackground />
      <div className="relative z-10 w-full max-w-lg min-w-0 mx-auto px-3 sm:px-4 py-6 space-y-6 box-border md:my-6 md:rounded-3xl md:border md:border-border/40 md:bg-background/40 md:backdrop-blur-sm md:px-6 md:py-8">
        {/* Header — greeting + tagline */}
        <div className="flex flex-col items-center gap-3 pb-2 text-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Token price card */}
        <Skeleton className="h-32 w-full rounded-xl" />

        {/* Energy Command Center hero */}
        <Skeleton className="h-72 w-full rounded-xl" />

        {/* CO2 card */}
        <Skeleton className="h-24 w-full rounded-xl" />

        {/* Reward progress */}
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
