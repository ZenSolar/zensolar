import { lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const AppLayout = lazy(() => import('@/components/layout/AppLayout').then(m => ({ default: m.AppLayout })));
const Index = lazy(() => import('@/pages/Index'));
const Landing = lazy(() => import('@/pages/Landing'));
const ComingSoon = lazy(() => import('@/pages/ComingSoon'));

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

const BETA_HOSTS = ['beta.zen.solar'];

export function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <RouteLoader />;
  }

  if (!isAuthenticated) {
    const isComingSoon = !BETA_HOSTS.includes(window.location.hostname);
    return (
      <Suspense fallback={<RouteLoader />}>
        {isComingSoon ? <ComingSoon /> : <Landing />}
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<RouteLoader />}>
      <AppLayout>
        <Index />
      </AppLayout>
    </Suspense>
  );
}
