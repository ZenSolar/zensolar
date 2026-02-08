import { lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const AppLayout = lazy(() => import('@/components/layout/AppLayout').then(m => ({ default: m.AppLayout })));
const Index = lazy(() => import('@/pages/Index'));
const Landing = lazy(() => import('@/pages/Landing'));

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <RouteLoader />;
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<RouteLoader />}>
        <Landing />
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
