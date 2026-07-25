import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBetaFlow } from '@/hooks/useBetaFlow';
import { computeNextStep } from './betaRouting';
import { BetaShell } from './BetaShell';
import { supabase } from '@/integrations/supabase/client';

/**
 * `/onboarding` entry — resumes at last incomplete step.
 * Unauthed → signin. Authed with saved step → that step. Otherwise compute next.
 */
export default function BetaResume() {
  const navigate = useNavigate();
  const flow = useBetaFlow();

  useEffect(() => {
    if (flow.loading) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/onboarding/signin', { replace: true }); return; }
      const saved = flow.step;
      if (saved && saved !== 'done' && saved !== 'summary') {
        navigate(`/onboarding/${saved}`, { replace: true });
        return;
      }
      if (saved === 'done') { navigate('/', { replace: true }); return; }
      const next = computeNextStep(flow.selections, flow.status);
      navigate(`/onboarding/${next}`, { replace: true });
    })();
  }, [flow.loading, flow.step, flow.selections, flow.status, navigate]);

  return (
    <BetaShell>
      <p className="text-sm qc-muted">Picking up where you left off…</p>
    </BetaShell>
  );
}
