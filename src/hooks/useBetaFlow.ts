import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type BetaCategory = 'vehicle' | 'solar' | 'battery' | 'charger';

export type BetaStatusState =
  | 'not_started'
  | 'pending'
  | 'connected'
  | 'connected_auto'
  | 'connected_manual'
  | 'connected_tesla_wc'
  | 'connected_wallbox'
  | 'not_detected'
  | 'not_connected'
  | 'skipped';

export interface BetaHomeSelections {
  vehicle?: boolean;
  solar?: boolean;
  battery?: boolean;
  charger?: boolean;
  none?: boolean;
}

export type BetaStatus = Partial<
  Record<BetaCategory, { state: BetaStatusState; last_telemetry_at?: string | null }>
>;

export type BetaStep =
  | 'signin'
  | 'verify'
  | 'home'
  | 'tesla'
  | 'solar'
  | 'charger'
  | 'extras'
  | 'proof'
  | 'account'
  | 'summary'
  | 'done';

export type BetaAccountState = 'pending' | 'secured' | 'skipped';


export interface BetaFlow {
  loading: boolean;
  step: BetaStep | null;
  selections: BetaHomeSelections;
  status: BetaStatus;
  inviteToken: string | null;
  refresh: () => Promise<void>;
  setStep: (step: BetaStep) => Promise<void>;
  setSelections: (sel: BetaHomeSelections) => Promise<void>;
  setStatus: (patch: BetaStatus) => Promise<void>;
  setInviteToken: (token: string | null) => Promise<void>;
}

/**
 * Reads and writes /beta flow state stored on `profiles`.
 * Keeps the per-category status independent so the summary screen can
 * show Vehicle / Solar / Battery / Charger separately.
 */
export function useBetaFlow(): BetaFlow {
  const [loading, setLoading] = useState(true);
  const [step, setStepState] = useState<BetaStep | null>(null);
  const [selections, setSelectionsState] = useState<BetaHomeSelections>({});
  const [status, setStatusState] = useState<BetaStatus>({});
  const [inviteToken, setInviteTokenState] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUserId(null);
      setStepState(null);
      setLoading(false);
      return;
    }
    setUserId(user.id);
    const { data } = await supabase
      .from('profiles')
      .select('beta_flow_step, beta_home_selections, beta_status, beta_invite_token')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!data) {
      await supabase
        .from('profiles')
        .insert({ user_id: user.id, display_name: user.user_metadata?.display_name ?? null })
        .select('beta_flow_step')
        .maybeSingle();
    }
    setStepState((data?.beta_flow_step as BetaStep) ?? 'home');
    setSelectionsState((data?.beta_home_selections as BetaHomeSelections) ?? {});
    setStatusState((data?.beta_status as BetaStatus) ?? {});
    setInviteTokenState((data?.beta_invite_token as string) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { void load(); });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const setStep = useCallback(async (next: BetaStep) => {
    setStepState(next);
    if (!userId) return;
    await supabase.from('profiles').update({ beta_flow_step: next }).eq('user_id', userId);
  }, [userId]);

  const setSelections = useCallback(async (sel: BetaHomeSelections) => {
    setSelectionsState(sel);
    if (!userId) return;
    await supabase.from('profiles').update({ beta_home_selections: JSON.parse(JSON.stringify(sel)) }).eq('user_id', userId);
  }, [userId]);

  const setStatus = useCallback(async (patch: BetaStatus) => {
    const merged = { ...status, ...patch };
    setStatusState(merged);
    if (!userId) return;
    await supabase.from('profiles').update({ beta_status: JSON.parse(JSON.stringify(merged)) }).eq('user_id', userId);
  }, [status, userId]);

  const setInviteToken = useCallback(async (token: string | null) => {
    setInviteTokenState(token);
    if (!userId) return;
    await supabase.from('profiles').update({ beta_invite_token: token }).eq('user_id', userId);
  }, [userId]);

  return { loading, step, selections, status, inviteToken, refresh: load, setStep, setSelections, setStatus, setInviteToken };
}
