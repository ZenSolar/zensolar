import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isPreviewMode } from '@/lib/previewMode';

const AppLayout = lazy(() => import('@/components/layout/AppLayout').then(m => ({ default: m.AppLayout })));
const Index = lazy(() => import('@/pages/Index'));

// Eagerly preload dashboard chunks for returning PWA users.
// This starts fetching the JS in parallel with auth resolution so the chunks
// are already cached by the time isAuthenticated resolves to true.
import('@/components/layout/AppLayout').catch(() => {});
import('@/pages/Index').catch(() => {});

/**
 * Loader for the cold-boot path.
 *
 * We render `null` rather than a <BrandSplash /> here because the inline
 * `#pwa-splash` in index.html is already on-screen and stays visible until
 * `window.hideSplashScreen()` fires from main.tsx. Rendering a second
 * brand splash on top caused the "logo → spinner → logo again" flash.
 */
function RouteLoader() {
  return null;
}

export function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();

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

