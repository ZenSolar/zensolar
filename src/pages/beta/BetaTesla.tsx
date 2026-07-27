import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

import { BetaShell } from './BetaShell';
import { useBetaFlow } from '@/hooks/useBetaFlow';
import { useEnergyOAuth } from '@/hooks/useEnergyOAuth';
import { supabase } from '@/integrations/supabase/client';
import { computeNextStep } from './betaRouting';

type Phase = 'consent' | 'pairing' | 'snapshot';

export default function BetaTesla() {
  const navigate = useNavigate();
  const flow = useBetaFlow();
  const { startTeslaOAuth } = useEnergyOAuth();
  const [phase, setPhase] = useState<Phase>('consent');
  const [devices, setDevices] = useState<Array<{ type: string; name: string; extra?: string }>>([]);
  const [pairingElapsed, setPairingElapsed] = useState(0);

  // Poll for connected Tesla devices while on pairing/snapshot phase
  useEffect(() => {
    if (phase === 'consent') return;
    let cancelled = false;
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('connected_devices')
        .select('device_type, device_name, last_known_state')
        .eq('user_id', user.id)
        .eq('provider', 'tesla');
      if (cancelled || !data) return;
      if (data.length > 0) {
        const mapped = data.map((d) => ({
          type: d.device_type,
          name: d.device_name ?? d.device_type,
        }));
        setDevices(mapped);

        // Update statuses per category
        const patch: Record<string, { state: 'connected' | 'connected_auto' | 'connected_tesla_wc'; last_telemetry_at: string }> = {};
        const now = new Date().toISOString();
        for (const d of data) {
          const t = (d.device_type ?? '').toLowerCase();
          if (t.includes('vehicle') || t === 'car' || t === 'ev') patch.vehicle = { state: 'connected', last_telemetry_at: now };
          else if (t.includes('powerwall') || t.includes('battery')) patch.battery = { state: 'connected_auto', last_telemetry_at: now };
          else if (t.includes('wall_connector') || t.includes('charger')) patch.charger = { state: 'connected_tesla_wc', last_telemetry_at: now };
        }
        if (Object.keys(patch).length) await flow.setStatus(patch);
        setPhase('snapshot');
      }
    };
    check();
    const iv = setInterval(check, 4000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [phase, flow]);

  useEffect(() => {
    if (phase !== 'pairing') return;
    const iv = setInterval(() => setPairingElapsed((v) => v + 1), 1000);
    return () => clearInterval(iv);
  }, [phase]);

  const start = async () => {
    localStorage.setItem('beta_energy_flow', 'true');
    // Always show the "pairing / waiting" phase until we actually detect
    // devices on the account. Jumping straight to 'snapshot' shows a
    // misleading "You're connected" before Tesla OAuth has even resolved.
    setPhase('pairing');
    await startTeslaOAuth();
  };


  const skip = async () => {
    const patch: import('@/hooks/useBetaFlow').BetaStatus = {};
    if (flow.selections.vehicle) patch.vehicle = { state: 'skipped' };
    if (flow.selections.battery && !flow.status.battery) patch.battery = { state: 'skipped' };
    if (flow.selections.charger && !flow.status.charger) patch.charger = { state: 'skipped' };
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

  if (phase === 'consent') {
    return (
      <BetaShell eyebrow="Tesla" onBack={() => navigate('/beta/home')}>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">Next, approve access on Tesla</h1>
        <p className="text-[15px] text-muted-foreground mb-4 leading-relaxed">
          We'll open tesla.com so you can log in and approve ZenSolar. We never see your Tesla password,
          and you can revoke access anytime from your Tesla account.
        </p>
        {(flow.selections.battery || flow.selections.charger) && (
          <p className="text-[13px] text-amber-200/80 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 mb-6">
            If you have a Powerwall or Wall Connector, we'll find them automatically — no extra step needed.
          </p>
        )}
        <Button size="lg" className="w-full mb-3" onClick={start}>Continue to Tesla</Button>
        <button type="button" className="text-sm text-muted-foreground underline" onClick={skip}>
          Skip for now
        </button>
      </BetaShell>
    );
  }

  if (phase === 'pairing') {
    return (
      <BetaShell eyebrow="Tesla" onBack={() => setPhase('consent')}>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">One more step — pair ZenSolar in the Tesla app</h1>
        <p className="text-[15px] text-muted-foreground mb-6">
          Open the Tesla app, go to your vehicle → Locks, and add ZenSolar as a key.
          We'll pick it up automatically.
        </p>
        <div className="rounded-2xl border border-white/10 bg-card/40 p-4 mb-6">
          <p className="text-sm">
            {pairingElapsed < 90
              ? `Waiting for pairing… (${pairingElapsed}s)`
              : "Still stuck? Make sure you're on the same Tesla account, and try re-opening the Tesla app."}
          </p>
        </div>
        <Button variant="secondary" size="lg" className="w-full mb-3" onClick={() => setPhase('snapshot')}>
          I paired it
        </Button>
        {pairingElapsed >= 60 && (
          <button type="button" className="text-sm text-muted-foreground underline" onClick={skip}>
            Skip pairing for now
          </button>
        )}
      </BetaShell>
    );
  }

  return (
    <BetaShell eyebrow="Tesla · connected">
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
