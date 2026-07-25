import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Gates a protected onboarding sub-route.
 * Unauthenticated visitors are bounced to /onboarding/signin.
 * Renders nothing until the session check resolves to avoid flashing.
 */
export function RequireBetaAuth({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'authed' | 'anon'>('checking');
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setState(data.user ? 'authed' : 'anon');
    });
    return () => { alive = false; };
  }, [location.pathname]);

  if (state === 'checking') return null;
  if (state === 'anon') return <Navigate to="/onboarding/signin" replace />;
  return <>{children}</>;
}
