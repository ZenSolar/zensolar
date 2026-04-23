import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BrandedSpinner } from '@/components/ui/BrandedSpinner';
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <BrandedSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
