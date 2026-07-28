import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';

// PublicHome is the new marketing surface for the production hosts
// (zensolar.com / www.zensolar.com) and every preview host. The legacy
// marketing sections that used to live here are no longer reachable at `/`.
const PublicHome = lazy(() => import('./PublicHome'));

// Beta hosts get their own minimal Quiet Current front door that routes
// into the passwordless /onboarding flow.
const BETA_HOSTS = new Set([
  'beta.zensolar.com',
  'www.beta.zensolar.com',
  // Legacy hosts kept during DNS transition
  'beta.zen.solar',
  'www.beta.zen.solar',
]);

export default function Home() {
  if (typeof window !== 'undefined' && BETA_HOSTS.has(window.location.hostname)) {
    return <Navigate to="/beta-welcome" replace />;
  }
  return (
    <Suspense fallback={null}>
      <PublicHome />
    </Suspense>
  );
}
