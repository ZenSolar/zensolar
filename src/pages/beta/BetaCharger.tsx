import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BetaShell } from './BetaShell';
import { useBetaFlow } from '@/hooks/useBetaFlow';
import { computeNextStep } from './betaRouting';

type Phase = 'picker' | 'wallbox_notice' | 'done';

/**
 * Charger routing. If Tesla Wall Connector was already detected by the Tesla
 * module, we skip this screen entirely via computeNextStep. Wallbox ships as
 * a "coming soon / skip" stub so it never blocks the rest of onboarding.
 */
export default function BetaCharger() {
  const navigate = useNavigate();
  const flow = useBetaFlow();
  const [phase, setPhase] = useState<Phase>('picker');

  // If charger already resolved by Tesla, jump forward automatically.
  useEffect(() => {
    if (flow.status.charger?.state === 'connected_tesla_wc') {
      (async () => {
        const next = computeNextStep(flow.selections, flow.status);
        await flow.setStep(next);
        navigate(`/beta/${next}`, { replace: true });
      })();
    }
  }, [flow, navigate]);

  const skip = async () => {
    await flow.setStatus({ charger: { state: 'skipped' } });
    const next = computeNextStep(flow.selections, { ...flow.status, charger: { state: 'skipped' } });
    await flow.setStep(next);
    navigate(`/beta/${next}`);
  };

  if (phase === 'wallbox_notice') {
    return (
      <BetaShell eyebrow="Wallbox" onBack={() => setPhase('picker')}>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">Wallbox connect is coming soon</h1>
        <p className="text-[15px] text-muted-foreground mb-6">
          We're finalizing our Wallbox integration. You can skip this for now — we'll email you when it's ready.
        </p>
        <Button size="lg" className="w-full" onClick={skip}>OK, skip for now</Button>
      </BetaShell>
    );
  }

  return (
    <BetaShell eyebrow="Charger" onBack={() => navigate('/beta/home')}>
      <h1 className="text-3xl font-semibold tracking-tight mb-3">Which charger do you have?</h1>
      <p className="text-[13px] text-muted-foreground mb-4">
        Check the app you use to manage your charger — the name usually matches.
      </p>
      <div className="space-y-2 mb-6">
        <button
          onClick={() => navigate('/beta/tesla')}
          className="w-full text-left p-4 rounded-2xl border border-white/10 bg-card/40 hover:border-amber-400/60 transition-all"
        >
          <span className="text-[15px] font-medium">Tesla Wall Connector</span>
          <p className="text-xs text-muted-foreground mt-1">Connect through your Tesla account.</p>
        </button>
        <button
          onClick={() => setPhase('wallbox_notice')}
          className="w-full text-left p-4 rounded-2xl border border-white/10 bg-card/40 hover:border-amber-400/60 transition-all"
        >
          <span className="text-[15px] font-medium">Wallbox</span>
          <p className="text-xs text-muted-foreground mt-1">Coming soon.</p>
        </button>
        <button
          onClick={skip}
          className="w-full text-left p-4 rounded-2xl border border-white/10 bg-card/40 hover:border-amber-400/60 transition-all"
        >
          <span className="text-[15px] font-medium">Not sure</span>
          <p className="text-xs text-muted-foreground mt-1">Skip for now.</p>
        </button>
      </div>
    </BetaShell>
  );
}
