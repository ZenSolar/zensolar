import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BrandSplash } from '@/components/ui/BrandSplash';
import { isPreviewMode } from '@/lib/previewMode';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Preview-mode bypass: skip auth gate so Joseph can deep-link to any
  // protected route (e.g. /founders/seed-ask) without going through /auth.
  // The demo gate has its own separate code-based check and is unaffected.
  if (isPreviewMode()) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <BrandSplash />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
