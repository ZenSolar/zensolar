import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { BetaShell } from './BetaShell';
import { useBetaFlow, type BetaHomeSelections } from '@/hooks/useBetaFlow';
import { computeNextStep } from './betaRouting';

const OPTIONS: { key: keyof BetaHomeSelections; label: string; emoji: string }[] = [
  { key: 'vehicle', label: 'Tesla vehicle', emoji: '🚗' },
  { key: 'solar', label: 'Solar panels', emoji: '☀️' },
  { key: 'battery', label: 'Home battery', emoji: '🔋' },
  { key: 'charger', label: 'Home EV charger', emoji: '🔌' },
  { key: 'none', label: 'Not sure / none of these yet', emoji: '🤔' },
];

export default function BetaHome() {
  const navigate = useNavigate();
  const flow = useBetaFlow();
  const [sel, setSel] = useState<BetaHomeSelections>({});

  useEffect(() => { setSel(flow.selections ?? {}); }, [flow.selections]);

  const toggle = (k: keyof BetaHomeSelections) => {
    setSel((prev) => {
      if (k === 'none') return { none: !prev.none };
      const next = { ...prev, [k]: !prev[k] };
      delete next.none;
      return next;
    });
  };

  const hasAny = Object.values(sel).some(Boolean);

  const cont = async () => {
    await flow.setSelections(sel);
    if (sel.none) {
      await flow.setStep('summary');
      navigate('/beta/summary');
      return;
    }
    const next = computeNextStep(sel, flow.status);
    await flow.setStep(next);
    navigate(`/beta/${next}`);
  };

  return (
    <BetaShell eyebrow="Setup">
      <h1 className="text-3xl font-semibold tracking-tight mb-3">What's at your home?</h1>
      <p className="text-[15px] text-muted-foreground mb-6">
        Check everything that applies — we'll figure out the details.
      </p>
      <div className="space-y-2 mb-8">
        {OPTIONS.map((o) => (
          <label
            key={o.key}
            className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-card/40 cursor-pointer hover:border-amber-400/60 transition-all"
          >
            <Checkbox checked={!!sel[o.key]} onCheckedChange={() => toggle(o.key)} />
            <span className="text-lg">{o.emoji}</span>
            <span className="text-[15px] font-medium">{o.label}</span>
          </label>
        ))}
      </div>
      <Button size="lg" className="w-full" onClick={cont} disabled={!hasAny}>
        Continue
      </Button>
    </BetaShell>
  );
}
