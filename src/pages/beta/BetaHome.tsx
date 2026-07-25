import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BetaShell } from './BetaShell';
import { useBetaFlow, type BetaHomeSelections } from '@/hooks/useBetaFlow';
import { computeNextStep } from './betaRouting';
import { QCButton, QCSelectCard, type QCGlyphName } from '@/components/onboarding/quiet/QuietCurrent';

const OPTIONS: { key: keyof BetaHomeSelections; label: string; sub: string; glyph?: QCGlyphName }[] = [
  { key: 'vehicle', label: 'Tesla\u00a0', sub: 'S / 3 / X / Y / Cybertruck', glyph: 'vehicle' },
  { key: 'solar', label: 'Solar system', sub: 'Panels, inverter, or microinverters', glyph: 'solar' },
  { key: 'battery', label: 'Home battery', sub: 'Powerwall, IQ Battery, and more', glyph: 'battery' },
  { key: 'charger', label: 'Home EV charger', sub: 'Wall Connector, IQ, Home EV Charger, Pulsar', glyph: 'charger' },
  { key: 'none', label: 'None of these yet', sub: 'Explore first, connect later', glyph: 'home' },
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
  const count = Object.entries(sel).filter(([k, v]) => v && k !== 'none').length;

  const cont = async () => {
    await flow.setSelections(sel);
    if (sel.none) {
      await flow.setStep('account');
      navigate('/onboarding/account');
      return;
    }
    const next = computeNextStep(sel, flow.status);
    await flow.setStep(next);
    navigate(`/onboarding/${next}`);
  };

  return (
    <BetaShell stage="home" eyebrow="Setup · 1 of 4">
      <h1 className="text-[28px] leading-tight font-semibold qc-text mb-2 tracking-tight">
        What's at your home?
      </h1>
      <p className="text-[14px] qc-muted mb-7">
        Select everything you have. We'll connect each one next.
      </p>
      <div className="space-y-2 mb-8">
        {OPTIONS.map((o) => (
          <QCSelectCard
            key={o.key}
            selected={!!sel[o.key]}
            glyph={o.glyph}
            label={o.label}
            sub={o.sub}
            onClick={() => toggle(o.key)}
          />
        ))}
      </div>
      <QCButton onClick={cont} disabled={!hasAny}>
        {sel.none ? 'Continue' : count > 0 ? `Continue with ${count} selected` : 'Continue'}
      </QCButton>
    </BetaShell>
  );
}
