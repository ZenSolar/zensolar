import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DeviceSelectionDialog } from '@/components/dashboard/DeviceSelectionDialog';
import { TeslaScopeRecovery } from '@/components/onboarding/TeslaScopeRecovery';

import { BetaShell } from './BetaShell';
import { useBetaFlow, type BetaStatus } from '@/hooks/useBetaFlow';
import { useEnergyOAuth } from '@/hooks/useEnergyOAuth';
import { supabase } from '@/integrations/supabase/client';
import { computeNextStep } from './betaRouting';
import { oauthDiag } from '@/lib/oauthDiagnostics';

type Phase = 'consent' | 'connecting' | 'scope-recovery' | 'device-selection' | 'no-devices' | 'snapshot';
type TeslaDeviceRow = {
  device_type: string;
  device_name: string | null;
  last_known_state: unknown;
};

export default function BetaTesla() {
  const navigate = useNavigate();
  const flow = useBetaFlow();
  const { startTeslaOAuth } = useEnergyOAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  // If we returned from Tesla OAuth, show device selection first instead of
  // looping back to the approval screen.
  const returningFromOAuth = searchParams.get('oauth_success') === 'true';
  const needsDeviceSelection = searchParams.get('device_selection') === 'true';
  const initialPhase: Phase = returningFromOAuth || needsDeviceSelection ? 'device-selection' : 'consent';
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [devices, setDevices] = useState<Array<{ type: string; name: string; extra?: string }>>([]);
  const [syncElapsed, setSyncElapsed] = useState(0);
  const [detectedStatus, setDetectedStatus] = useState<BetaStatus>({});
  const [missingScopes, setMissingScopes] = useState<string[]>([]);
  const [blockingScopes, setBlockingScopes] = useState<string[]>([]);

  useEffect(() => {
    oauthDiag('BetaTesla', 'mount', {
      initialPhase,
      returningFromOAuth,
      needsDeviceSelection,
      search: window.location.search,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    oauthDiag('BetaTesla', 'phase:change', { phase });
  }, [phase]);

  // Clear the query flag once consumed so a back-forward navigation doesn't re-trigger.
  useEffect(() => {
    if (returningFromOAuth) {
      const next = new URLSearchParams(searchParams);
      next.delete('oauth_success');
      next.delete('provider');
      next.delete('device_selection');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyDetectedDevices = async (data: TeslaDeviceRow[]) => {
    if (data.length === 0) return false;

    const mapped = data.map((d) => ({
      type: d.device_type,
      name: d.device_name ?? d.device_type,
    }));
    setDevices(mapped);

    // Update statuses per category
    const patch: BetaStatus = {};
    const now = new Date().toISOString();
    for (const d of data) {
      const t = (d.device_type ?? '').toLowerCase();
      if (t.includes('vehicle') || t === 'car' || t === 'ev') patch.vehicle = { state: 'connected', last_telemetry_at: now };
      else if (t.includes('powerwall') || t.includes('battery')) patch.battery = { state: 'connected_auto', last_telemetry_at: now };
      else if (t.includes('wall_connector') || t.includes('charger')) patch.charger = { state: 'connected_tesla_wc', last_telemetry_at: now };
    }
    setDetectedStatus(patch);
    if (Object.keys(patch).length) await flow.setStatus(patch);
    setPhase('snapshot');
    return true;
  };

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        oauthDiag('BetaTesla', 'check:no-user', { phase });
        return;
      }
      const { data } = await supabase
        .from('connected_devices')
        .select('device_type, device_name, last_known_state')
        .eq('user_id', user.id)
        .eq('provider', 'tesla');
      if (cancelled || !data) return;
      oauthDiag('BetaTesla', 'check:devices', {
        phase,
        count: data.length,
        types: data.map((d) => d.device_type),
      });
      const found = await applyDetectedDevices(data);
      if (found || phase === 'snapshot') return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: tokenCheck, error: tokenErr } = await supabase.functions.invoke('tesla-auth', {
        body: { action: 'check-tokens' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      oauthDiag('BetaTesla', 'check:tokens', {
        phase,
        exists: !!tokenCheck?.exists,
        severity: tokenCheck?.scope_severity ?? null,
        missing: tokenCheck?.missing_scopes ?? null,
        error: tokenErr?.message ?? null,
      });

      if (!cancelled && tokenCheck?.exists) {
        const missing: string[] = tokenCheck.missing_scopes ?? [];
        const blocking: string[] = tokenCheck.blocking_scopes ?? [];
        setMissingScopes(missing);
        setBlockingScopes(blocking);
        if (missing.length > 0 && phase !== 'scope-recovery') {
          oauthDiag('BetaTesla', 'auto-advance:scope-recovery', { missing, blocking });
          setPhase('scope-recovery');
          return;
        }
        if (missing.length === 0 && phase === 'consent') {
          oauthDiag('BetaTesla', 'auto-advance:consent->device-selection');
          setPhase('device-selection');
          return;
        }
      }

      const { data: refreshed } = await supabase
        .from('connected_devices')
        .select('device_type, device_name, last_known_state')
        .eq('user_id', user.id)
        .eq('provider', 'tesla');

      if (!cancelled && refreshed) {
        await applyDetectedDevices(refreshed);
      }
    };
    check();
    if (phase !== 'connecting') return () => { cancelled = true; };
    const iv = setInterval(check, 4000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [phase, flow]);

  useEffect(() => {
    if (phase !== 'connecting') return;
    setSyncElapsed(0);
    const iv = setInterval(() => setSyncElapsed((v) => v + 1), 1000);
    return () => clearInterval(iv);
  }, [phase]);

  // After 15s in connecting with tokens but 0 devices → no-devices phase.
  useEffect(() => {
    if (phase !== 'connecting' || syncElapsed < 15) return;
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data: devs } = await supabase
        .from('connected_devices')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', 'tesla');
      if (cancelled) return;
      if ((devs?.length ?? 0) === 0) {
        oauthDiag('BetaTesla', 'auto-advance:no-devices', { syncElapsed });
        setPhase('no-devices');
      }
    })();
    return () => { cancelled = true; };
  }, [phase, syncElapsed]);

  const start = async () => {
    oauthDiag('BetaTesla', 'start:tesla-oauth', { returnTo: '/onboarding/tesla' });
    localStorage.setItem('beta_energy_flow', 'true');
    setPhase('connecting');
    await startTeslaOAuth({ returnTo: '/onboarding/tesla' });
  };


  const skip = async () => {
    const patch: import('@/hooks/useBetaFlow').BetaStatus = {};
    if (flow.selections.vehicle) patch.vehicle = { state: 'skipped' };
    if (flow.selections.battery && !flow.status.battery) patch.battery = { state: 'skipped' };
    if (flow.selections.charger && !flow.status.charger) patch.charger = { state: 'skipped' };
    await flow.setStatus(patch);
    const next = computeNextStep(flow.selections, { ...flow.status, ...patch });
    await flow.setStep(next);
    navigate(`/onboarding/${next}`);
  };

  const cont = async () => {
    const effectiveStatus = { ...flow.status, ...detectedStatus };
    const next = computeNextStep(flow.selections, effectiveStatus);
    await flow.setStep(next);
    navigate(`/onboarding/${next}`);
  };

  const handleDeviceSelectionComplete = () => {
    setPhase('connecting');
  };

  const handleDeviceSelectionOpenChange = (open: boolean) => {
    if (!open) setPhase('connecting');
  };

  if (phase === 'consent') {
    return (
      <BetaShell eyebrow="Tesla" onBack={() => navigate('/beta/home')}>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">Next, approve access on Tesla</h1>
        <p className="text-[15px] text-muted-foreground mb-4 leading-relaxed">
          We'll open tesla.com so you can log in and approve ZenSolar. We never see your Tesla password,
          and you can revoke access anytime from your Tesla account.
        </p>

        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 mb-4">
          <p className="text-[13px] font-semibold text-emerald-200 mb-2 uppercase tracking-wide">
            Leave every box checked
          </p>
          <p className="text-[13px] text-emerald-100/85 leading-relaxed mb-2">
            Tesla will show a list of permission checkboxes. <strong>Leave every box checked</strong> — ZenSolar only reads this data, never sends commands to your car or home.
          </p>
          <ul className="text-[13px] text-emerald-100/85 leading-relaxed space-y-1 pl-4 list-disc">
            <li>Vehicle Information <span className="text-emerald-100/60">→ your miles &amp; FSD miles</span></li>
            <li>Vehicle Location <span className="text-emerald-100/60">→ tells home charging apart from Supercharging</span></li>
            <li>Vehicle Charging Management <span className="text-emerald-100/60">→ kWh added, live sessions (read-only)</span></li>
            <li>Energy Product Information <span className="text-emerald-100/60">→ your solar production and Powerwall, if you have them</span></li>
          </ul>
          <p className="text-[12px] text-emerald-100/60 leading-relaxed mt-2">
            Unchecking any box means we can't verify that activity — and can't reward you for it.
          </p>
        </div>

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

  if (phase === 'connecting') {
    const past15 = syncElapsed >= 15;
    return (
      <BetaShell eyebrow="Tesla" onBack={() => setPhase('consent')}>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">
          {past15 ? 'Your Tesla might be asleep' : 'Finishing your Tesla connection'}
        </h1>
        <p className="text-[15px] text-muted-foreground mb-6 leading-relaxed">
          {past15
            ? "Teslas go to sleep to save battery, so first data can take a few minutes. Your account is connected — you can continue and we'll fill in numbers as your car wakes up."
            : "Keep this page open while ZenSolar confirms your Tesla account and finds your devices."}
        </p>
        <div className="rounded-2xl border border-white/10 bg-card/40 p-4 mb-6">
          <p className="text-sm">
            {past15
              ? `Still waiting on your car to wake up (${syncElapsed}s)…`
              : `Checking Tesla connection… (${syncElapsed}s)`}
          </p>
        </div>
        {past15 && (
          <Button size="lg" className="w-full mb-3" onClick={skip}>
            Continue — sync in the background
          </Button>
        )}
      </BetaShell>
    );
  }

  if (phase === 'scope-recovery') {
    return (
      <BetaShell eyebrow="Tesla" onBack={() => setPhase('consent')}>
        <TeslaScopeRecovery
          missingScopes={missingScopes}
          blockingScopes={blockingScopes}
          onReauthorize={start}
          onContinueDegraded={blockingScopes.length === 0 ? () => setPhase('device-selection') : undefined}
        />
      </BetaShell>
    );
  }

  if (phase === 'device-selection') {
    return (
      <BetaShell eyebrow="Tesla · connected" onBack={() => setPhase('consent')}>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">Choose your Tesla devices</h1>
        <p className="text-[15px] text-muted-foreground mb-6">
          Tesla approved access. Select the vehicles and energy products you want ZenSolar to track.
        </p>
        <DeviceSelectionDialog
          open={true}
          onOpenChange={handleDeviceSelectionOpenChange}
          provider="tesla"
          onComplete={handleDeviceSelectionComplete}
        />
      </BetaShell>
    );
  }

  if (phase === 'no-devices') {
    return (
      <BetaShell eyebrow="Tesla · connected" onBack={() => setPhase('consent')}>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">
          We didn't find any vehicles on this Tesla account
        </h1>
        <p className="text-[15px] text-muted-foreground mb-6 leading-relaxed">
          Your Tesla account is linked, but no vehicles or energy products came back. If you have a
          Tesla on a different account, sign in with that one. Otherwise you can continue and add
          devices later.
        </p>
        <Button size="lg" className="w-full mb-3" onClick={start}>Try a different Tesla account</Button>
        <button type="button" className="text-sm text-muted-foreground underline" onClick={skip}>
          Continue without a vehicle
        </button>
      </BetaShell>
    );
  }

  // snapshot — devices claimed. Distinguish "asleep, no telemetry yet" from ready.
  const anyTelemetry = devices.length > 0 && Object.values(detectedStatus).some(
    (s) => s?.last_telemetry_at,
  );
  const sleeping = devices.length > 0 && !anyTelemetry;

  return (
    <BetaShell eyebrow="Tesla · connected">
      <h1 className="text-3xl font-semibold tracking-tight mb-3">
        {sleeping ? 'Your Tesla is asleep' : "You're connected"}
      </h1>
      {sleeping && (
        <p className="text-[15px] text-muted-foreground mb-4 leading-relaxed">
          Data will update automatically when your car wakes up — usually within a few minutes of
          driving or charging. You can continue setup now.
        </p>
      )}
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
