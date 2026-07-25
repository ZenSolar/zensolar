import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BetaShell } from './BetaShell';
import { useBetaFlow, type BetaCategory, type BetaStatusState } from '@/hooks/useBetaFlow';

function label(cat: BetaCategory, state?: BetaStatusState): string {
  if (cat === 'battery') {
    if (state === 'connected_auto') return 'Connected (auto-detected)';
    if (state === 'connected_manual' || state === 'connected') return 'Connected';
    if (state === 'not_detected') return 'Not detected';
    if (state === 'skipped') return 'Skipped';
    return 'Not connected';
  }
  if (cat === 'charger') {
    if (state === 'connected_tesla_wc') return 'Connected (Tesla Wall Connector)';
    if (state === 'connected_wallbox') return 'Connected (Wallbox)';
    if (state === 'skipped') return 'Skipped';
    return 'Not connected';
  }
  if (state === 'connected' || state === 'connected_auto') return 'Connected';
  if (state === 'pending') return 'Pending';
  if (state === 'skipped') return 'Skipped';
  return 'Not connected';
}

function retryPath(cat: BetaCategory): string {
  if (cat === 'vehicle') return '/beta/tesla';
  if (cat === 'solar') return '/beta/solar';
  if (cat === 'battery') return '/beta/solar';
  return '/beta/charger';
}

export default function BetaSummary() {
  const navigate = useNavigate();
  const flow = useBetaFlow();
  const rows: BetaCategory[] = ['vehicle', 'solar', 'battery', 'charger'];

  const finish = async () => {
    await flow.setStep('done');
    navigate('/');
  };

  return (
    <BetaShell eyebrow="All set">
      <h1 className="text-3xl font-semibold tracking-tight mb-3">You're all set</h1>
      <p className="text-[15px] text-muted-foreground mb-6">Here's what's connected:</p>
      <ul className="space-y-2 mb-8">
        {rows.map((c) => {
          const state = flow.status[c]?.state;
          const connected = state && state.startsWith('connected');
          const notDetected = state === 'not_detected';
          return (
            <li key={c} className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-card/40">
              <div>
                <div className="text-[15px] font-medium capitalize">{c}</div>
                <div className={`text-sm ${connected ? 'text-emerald-400' : notDetected ? 'text-amber-300/80' : 'text-muted-foreground'}`}>
                  {label(c, state)}
                </div>
              </div>
              {!connected && (
                <Button size="sm" variant="secondary" onClick={() => navigate(retryPath(c))}>
                  {state === 'not_detected' ? 'Add' : 'Try'}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <Button size="lg" className="w-full" onClick={finish}>Done</Button>
      <p className="text-xs text-muted-foreground mt-4 text-center">
        Thanks for helping us test ZenSolar. You can disconnect anything anytime from your account settings.
      </p>
    </BetaShell>
  );
}
