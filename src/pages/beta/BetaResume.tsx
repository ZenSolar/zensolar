import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBetaFlow } from '@/hooks/useBetaFlow';
import { computeNextStep } from './betaRouting';
import { BetaShell } from './BetaShell';
import { supabase } from '@/integrations/supabase/client';

/**
 * `/onboarding` entry — resumes at last incomplete step.
 * Unauthed → signin. Existing users (already set up) → dashboard.
 * Otherwise resume saved step or compute next.
 */
export default function BetaResume() {
  const navigate = useNavigate();
  const flow = useBetaFlow();

  useEffect(() => {
    if (flow.loading) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/onboarding/signin', { replace: true }); return; }

      // Existing-user short circuit: if they have any real footprint, go
      // straight to the dashboard instead of forcing onboarding.
      const [{ data: profile }, { count: deviceCount }] = await Promise.all([
        supabase.from('profiles').select('wallet_address, beta_flow_step').eq('id', user.id).maybeSingle(),
        supabase.from('connected_devices').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      const savedStep = (profile?.beta_flow_step ?? flow.step) as string | null;
      const alreadySetUp =
        savedStep === 'done' ||
        !!profile?.wallet_address ||
        (typeof deviceCount === 'number' && deviceCount > 0);
      if (alreadySetUp) { navigate('/', { replace: true }); return; }

      const saved = flow.step;
      if (saved && saved !== 'done' && saved !== 'summary') {
        navigate(`/onboarding/${saved}`, { replace: true });
        return;
      }
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
