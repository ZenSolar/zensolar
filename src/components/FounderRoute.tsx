import { Navigate } from "react-router-dom";
import { BrandedSpinner } from "@/components/ui/BrandedSpinner";
import { useAuth } from "@/hooks/useAuth";
import { useIsFounder } from "@/hooks/useIsFounder";
import { isPreviewMode } from "@/lib/previewMode";

interface FounderRouteProps {
  children: React.ReactNode;
}

/**
 * Gates a route to founders/admins only.
 *
 * - Preview mode (Lovable editor / localhost): bypassed so deep-links work.
 * - Unauthenticated → /auth
 * - Authenticated but not founder/admin → /
 * - Founder/admin → renders children
 */
export function FounderRoute({ children }: FounderRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isFounder, ready } = useIsFounder();

  if (isPreviewMode()) {
    return <>{children}</>;
  }

  if (authLoading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <BrandedSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!isFounder) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
