import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BetaShell } from './BetaShell';
import { useBetaFlow } from '@/hooks/useBetaFlow';

export default function BetaExtras() {
  const navigate = useNavigate();
  const flow = useBetaFlow();

  const go = async (path: string) => {
    // Re-enter existing module
    navigate(path);
  };

  const done = async () => {
    await flow.setStep('summary');
    navigate('/beta/summary');
  };

  return (
    <BetaShell eyebrow="Almost done" onBack={() => navigate('/beta/summary')}>
      <h1 className="text-3xl font-semibold tracking-tight mb-3">Anything else we can connect?</h1>
      <p className="text-[15px] text-muted-foreground mb-6">
        If you have a battery or charger that wasn't picked up automatically, add it here — or skip and do it later.
      </p>
      <div className="space-y-2 mb-6">
        <button onClick={() => go('/beta/solar')} className="w-full text-left p-4 rounded-2xl border border-white/10 bg-card/40 hover:border-amber-400/60">
          <span className="text-[15px] font-medium">Add a battery</span>
          <p className="text-xs text-muted-foreground mt-1">Connect via Enphase, SolarEdge, or Tesla.</p>
        </button>
        <button onClick={() => go('/beta/charger')} className="w-full text-left p-4 rounded-2xl border border-white/10 bg-card/40 hover:border-amber-400/60">
          <span className="text-[15px] font-medium">Add a charger</span>
        </button>
      </div>
      <Button size="lg" className="w-full" onClick={done}>Nothing else, I'm done</Button>
    </BetaShell>
  );
}
