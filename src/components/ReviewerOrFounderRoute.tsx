import { Navigate } from 'react-router-dom';
import { BrandedSpinner } from '@/components/ui/BrandedSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useIsFounder } from '@/hooks/useIsFounder';
import { isPreviewMode } from '@/lib/previewMode';
import { isAuthorizedReviewer } from '@/lib/reviewerAccess';

interface Props {
  children: React.ReactNode;
}

/**
 * Allows access to founder/admin users (same as FounderRoute) OR to NDA-signed
 * reviewers on the allowlist (see src/lib/reviewerAccess.ts). Used for the two
 * pitch pages shared with external reviewers.
 */
export function ReviewerOrFounderRoute({ children }: Props) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isFounder, ready } = useIsFounder();

  if (isPreviewMode()) return <>{children}</>;

  // Reviewer path — no auth needed, just NDA + allowlist + demo access.
  if (isAuthorizedReviewer()) return <>{children}</>;

  if (authLoading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <BrandedSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!isFounder) return <Navigate to="/demo" replace />;
  return <>{children}</>;
}
