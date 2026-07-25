import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BetaShell } from './BetaShell';
import { useBetaFlow } from '@/hooks/useBetaFlow';
import { useEnergyOAuth } from '@/hooks/useEnergyOAuth';
import { supabase } from '@/integrations/supabase/client';
import { computeNextStep } from './betaRouting';
import { toast } from 'sonner';

type Provider = 'enphase' | 'solaredge' | 'tesla' | 'not_sure';
type Phase = 'picker' | 'enphase_wait' | 'solaredge_form' | 'snapshot';

export default function BetaSolar() {
  const navigate = useNavigate();
  const flow = useBetaFlow();
  const { startEnphaseOAuth, connectSolarEdge } = useEnergyOAuth();
  const [phase, setPhase] = useState<Phase>('picker');
  const [provider, setProvider] = useState<Provider | null>(null);
  const [seApiKey, setSeApiKey] = useState('');
  const [seSiteId, setSeSiteId] = useState('');
  const [busy, setBusy] = useState(false);
  const [devices, setDevices] = useState<Array<{ type: string; name: string }>>([]);

  useEffect(() => {
    if (phase !== 'snapshot' && phase !== 'enphase_wait') return;
    let cancelled = false;
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !provider) return;
      const providerToLookup = provider === 'tesla' ? 'tesla' : provider;
      const { data } = await supabase
        .from('connected_devices')
        .select('device_type, device_name')
        .eq('user_id', user.id)
        .eq('provider', providerToLookup);
      if (cancelled || !data || data.length === 0) return;
      const mapped = data.map((d) => ({ type: d.device_type, name: d.device_name ?? d.device_type }));
      setDevices(mapped);
      const now = new Date().toISOString();
      const patch: import('@/hooks/useBetaFlow').BetaStatus = {};
      const hasSolar = mapped.some((d) => d.type.toLowerCase().includes('solar') || d.type.toLowerCase().includes('inverter'));
      const hasBattery = mapped.some((d) => d.type.toLowerCase().includes('battery') || d.type.toLowerCase().includes('powerwall'));
      if (hasSolar) patch.solar = { state: 'connected', last_telemetry_at: now };
      if (hasBattery) patch.battery = { state: 'connected_auto', last_telemetry_at: now };
      else if (flow.selections.battery && !flow.status.battery) patch.battery = { state: 'not_detected' };
      if (Object.keys(patch).length) await flow.setStatus(patch);
      setPhase('snapshot');
    };
    check();
    const iv = setInterval(check, 4000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [phase, provider, flow]);

  const pick = async (p: Provider) => {
    setProvider(p);
    localStorage.setItem('beta_energy_flow', 'true');
    if (p === 'enphase') { await startEnphaseOAuth(); setPhase('enphase_wait'); }
    else if (p === 'solaredge') setPhase('solaredge_form');
    else if (p === 'tesla') {
      // Redirect to Tesla module if not already run
      await flow.setStep('tesla');
      navigate('/beta/tesla');
    } else {
      toast.info('No problem — we\'ll show both options');
    }
  };

  const submitSE = async () => {
    if (!seApiKey || !seSiteId) return;
    setBusy(true);
    const ok = await connectSolarEdge(seApiKey, seSiteId);
    setBusy(false);
    if (ok) setPhase('snapshot');
  };

  const skip = async () => {
    const patch: import('@/hooks/useBetaFlow').BetaStatus = { solar: { state: 'skipped' } };
    if (flow.selections.battery && !flow.status.battery) patch.battery = { state: 'skipped' };
    await flow.setStatus(patch);
    const next = computeNextStep(flow.selections, { ...flow.status, ...patch });
    await flow.setStep(next);
    navigate(`/beta/${next}`);
  };

  const cont = async () => {
    const next = computeNextStep(flow.selections, flow.status);
    await flow.setStep(next);
    navigate(`/beta/${next}`);
  };

  if (phase === 'picker') {
    return (
      <BetaShell eyebrow="Solar" onBack={() => navigate('/beta/home')}>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">Which solar system do you have?</h1>
        {flow.selections.battery && (
          <p className="text-[13px] text-muted-foreground mb-4">
            If you also have a battery, it's usually part of this same account — we'll find it automatically.
          </p>
        )}
        <div className="space-y-2 mb-6">
          {([
            ['enphase', 'Enphase (Enlighten app)'],
            ['solaredge', 'SolarEdge'],
            ['tesla', 'Tesla Solar / Powerwall'],
            ['not_sure', 'Not sure'],
          ] as [Provider, string][]).map(([k, label]) => (
            <button
              key={k}
              onClick={() => pick(k)}
              className="w-full text-left p-4 rounded-2xl border border-white/10 bg-card/40 hover:border-amber-400/60 transition-all"
            >
              <span className="text-[15px] font-medium">{label}</span>
            </button>
          ))}
        </div>
        <button type="button" className="text-sm text-muted-foreground underline" onClick={skip}>
          Skip for now
        </button>
      </BetaShell>
    );
  }

  if (phase === 'solaredge_form') {
    return (
      <BetaShell eyebrow="SolarEdge" onBack={() => setPhase('picker')}>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">Connect SolarEdge</h1>
        <p className="text-[14px] text-muted-foreground mb-4">
          Paste your SolarEdge API key and Site ID from your monitoring portal.
        </p>
        <Input placeholder="API key" value={seApiKey} onChange={(e) => setSeApiKey(e.target.value)} className="mb-3 h-12" />
        <Input placeholder="Site ID" value={seSiteId} onChange={(e) => setSeSiteId(e.target.value)} className="mb-4 h-12" />
        <Button size="lg" className="w-full" onClick={submitSE} disabled={busy}>
          {busy ? 'Connecting…' : 'Connect'}
        </Button>
      </BetaShell>
    );
  }

  if (phase === 'enphase_wait') {
    return (
      <BetaShell eyebrow="Enphase">
        <h1 className="text-3xl font-semibold tracking-tight mb-3">Finish in the Enphase window</h1>
        <p className="text-[15px] text-muted-foreground mb-6">
          Approve access in the popup or new tab. We'll pick up your system automatically.
        </p>
        <Button size="lg" className="w-full mb-3" onClick={cont}>I'm done</Button>
        <button type="button" className="text-sm text-muted-foreground underline" onClick={skip}>
          Skip for now
        </button>
      </BetaShell>
    );
  }

  return (
    <BetaShell eyebrow="Solar · connected">
      <h1 className="text-3xl font-semibold tracking-tight mb-3">You're connected</h1>
      {devices.length === 0 ? (
        <p className="text-[15px] text-muted-foreground mb-6">
          Connected — first data may take a few minutes.
        </p>
      ) : (
        <ul className="space-y-2 mb-6">
          {devices.map((d, i) => (
            <li key={i} className="flex items-center gap-2 p-3 rounded-xl bg-card/40 border border-white/10 text-[14px]">
              <span className="text-emerald-400">●</span>
              <span className="font-medium">{d.name}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider ml-auto">{d.type}</span>
            </li>
          ))}
        </ul>
      )}
      <Button size="lg" className="w-full" onClick={cont}>Continue</Button>
    </BetaShell>
  );
}
