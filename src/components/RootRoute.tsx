import { lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const AppLayout = lazy(() => import('@/components/layout/AppLayout').then(m => ({ default: m.AppLayout })));
const Index = lazy(() => import('@/pages/Index'));
const Landing = lazy(() => import('@/pages/Landing'));
const ComingSoon = lazy(() => import('@/pages/ComingSoon'));

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

const COMING_SOON_HOSTS = ['zensolar.com', 'www.zensolar.com'];

export function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <RouteLoader />;
  }

  if (!isAuthenticated) {
    const isComingSoon = COMING_SOON_HOSTS.includes(window.location.hostname);
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
