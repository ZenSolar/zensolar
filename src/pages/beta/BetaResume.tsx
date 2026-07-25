import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBetaFlow } from '@/hooks/useBetaFlow';
import { computeNextStep } from './betaRouting';
import { BetaShell } from './BetaShell';
import { supabase } from '@/integrations/supabase/client';

/**
 * `/beta` entry — resumes the user at their last incomplete step.
 * Unauthed → signin. Authed → last saved step, or the next incomplete
 * module derived from their selections + status.
 */
export default function BetaResume() {
  const navigate = useNavigate();
  const flow = useBetaFlow();

  useEffect(() => {
    if (flow.loading) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/beta/signin', { replace: true }); return; }
      const saved = flow.step;
      if (saved && saved !== 'done') { navigate(`/beta/${saved}`, { replace: true }); return; }
      if (saved === 'done') { navigate('/', { replace: true }); return; }
      const next = computeNextStep(flow.selections, flow.status);
      navigate(`/beta/${next}`, { replace: true });
    })();
  }, [flow.loading, flow.step, flow.selections, flow.status, navigate]);

  return (
    <BetaShell>
      <p className="text-sm text-muted-foreground">Picking up where you left off…</p>
    </BetaShell>
  );
}
