import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { isPreviewMode } from '@/lib/previewMode';

const AppLayout = lazy(() => import('@/components/layout/AppLayout').then(m => ({ default: m.AppLayout })));
const Index = lazy(() => import('@/pages/Index'));

// Eagerly preload dashboard chunks for returning PWA users.
// This starts fetching the JS in parallel with auth resolution so the chunks
// are already cached by the time isAuthenticated resolves to true.
import('@/components/layout/AppLayout').catch(() => {});
import('@/pages/Index').catch(() => {});

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // Preview-mode bypass: skip auth & demo gate so any path resolves directly.
  if (!isPreviewMode()) {
    if (isLoading) {
      return <RouteLoader />;
    }

    if (!isAuthenticated) {
      return <Navigate to="/demo" replace />;
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
