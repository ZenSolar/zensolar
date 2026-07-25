import { useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBetaFlow } from '@/hooks/useBetaFlow';
import { supabase } from '@/integrations/supabase/client';
import { BrandedSpinner } from '@/components/ui/BrandedSpinner';

/**
 * Auth + resume guard for /beta/* routes.
 * - No session → send to /beta/signin
 * - Session but user has an in-progress step → send them to that step,
 *   unless the URL already matches or query has ?resume=0.
 */
export function BetaGuard({ children }: { children: ReactNode }) {
  const flow = useBetaFlow();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      // Signin/verify/invite are always accessible.
      const path = location.pathname;
      const publicPaths = ['/beta/signin', '/beta/verify'];
      if (publicPaths.includes(path) || path.startsWith('/beta/i/')) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/beta/signin', { replace: true }); return; }

      if (flow.loading) return;
      const step = flow.step ?? 'home';
      const target = `/beta/${step}`;
      const params = new URLSearchParams(location.search);
      if (params.get('resume') === '0') return;
      if (path !== target && step !== 'done') {
        // Only auto-redirect when landing on /beta with no step; otherwise trust
        // the user's explicit navigation.
        if (path === '/beta' || path === '/beta/') {
          navigate(target, { replace: true });
        }
      }
    })();
  }, [flow.loading, flow.step, location.pathname, location.search, navigate]);

  if (flow.loading && !['/beta/signin', '/beta/verify'].includes(location.pathname) && !location.pathname.startsWith('/beta/i/')) {
    return <div className="min-h-screen flex items-center justify-center"><BrandedSpinner /></div>;
  }
  return <>{children}</>;
}
