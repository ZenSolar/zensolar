import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isPreviewMode } from '@/lib/previewMode';
import { isMarketingHost } from '@/lib/hostRoles';

const AppLayout = lazy(() => import('@/components/layout/AppLayout').then(m => ({ default: m.AppLayout })));
const Index = lazy(() => import('@/pages/Index'));

// Eagerly preload dashboard chunks for returning PWA users.
// This starts fetching the JS in parallel with auth resolution so the chunks
// are already cached by the time isAuthenticated resolves to true.
// Skipped entirely on public marketing surfaces — anonymous visitors would
// otherwise download the whole app shell (framer-motion, charts, layout) for
// a static landing page.
if (!isPublicMarketingPath()) {
  import('@/components/layout/AppLayout').catch(() => {});
  import('@/pages/Index').catch(() => {});
}


/**
 * Loader for the cold-boot path.
 *
 * We render `null` here so the first route paints as soon as React is ready
 * without any intermediate splash or spinner.
 */
function RouteLoader() {
  return null;
}

export function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // zensolar.com (and zen.solar) are marketing hosts: "/" is always the public
  // homepage, even when the visitor has an active session. The app lives on
  // beta.zensolar.com.
  if (isMarketingHost()) {
    return <Navigate to="/home" replace />;
  }

  // Preview-mode bypass: skip auth & demo gate so any path resolves directly.
  if (!isPreviewMode()) {
    if (isLoading) {
      return <RouteLoader />;
    }

    if (!isAuthenticated) {
      return <Navigate to="/home" replace />;
    }
  }


  return (
    <Suspense fallback={<RouteLoader />}>
      <AppLayout>
        <Index />
      </AppLayout>
    </Suspense>
  );
}

