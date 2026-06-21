/**
 * SuperchargerBanner — Phase 3 L2 loudness banner.
 *
 * Strict rules:
 *   - L2 only. No audio. No animation beyond a calm slide+fade.
 *   - Auto-dismisses after 8s.
 *   - Shown ONLY for first-ever Supercharger or first-ever home session.
 *     Repeat sessions at known sites stay strict L1 (banner does not render).
 *   - "First ever" is detected from profiles.first_supercharger_at /
 *     first_home_charge_at being NULL at the moment a session goes live.
 *     We persist the dismissal per session id in sessionStorage so the
 *     banner never reappears mid-session.
 *
 * Mounted near the top of the dashboard.
 */
import { useEffect, useMemo, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';
import { useActiveChargingSessionV2 } from '@/hooks/useActiveChargingSessionV2';
import { classifyLoudness } from '@/hooks/useMintLoudness';

interface FirstEverFlags {
  first_supercharger_at: string | null;
  first_home_charge_at: string | null;
}

function useFirstEverFlags() {
  const { user } = useAuth();
  const viewAsUserId = useViewAsUserId();
  const userId = viewAsUserId ?? user?.id ?? null;
  return useQuery<FirstEverFlags | null>({
    queryKey: ['profile-first-charge-flags', userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from('profiles')
        .select('first_supercharger_at, first_home_charge_at')
        .eq('id', userId)
        .maybeSingle();
      return (data as any) ?? { first_supercharger_at: null, first_home_charge_at: null };
    },
  });
}

const DISMISS_KEY = (sessionId: string) => `zs:banner:dismissed:${sessionId}`;

export function SuperchargerBanner() {
  const { data: session } = useActiveChargingSessionV2();
  const { data: flags } = useFirstEverFlags();
  const [dismissed, setDismissed] = useState(false);

  const isFirstEver = useMemo(() => {
    if (!session || !flags) return false;
    if (session.source === 'supercharger' || session.source === 'third_party_dc') {
      return flags.first_supercharger_at == null;
    }
    if (session.source === 'home' || session.source === 'wallbox') {
      return flags.first_home_charge_at == null;
    }
    return false;
  }, [session, flags]);

  // Reset dismissal state per session id and honour prior dismissal.
  useEffect(() => {
    if (!session) {
      setDismissed(false);
      return;
    }
    try {
      const prev = sessionStorage.getItem(DISMISS_KEY(session.id));
      setDismissed(prev === '1');
    } catch {
      setDismissed(false);
    }
  }, [session?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 8s auto-dismiss.
  useEffect(() => {
    if (!session || dismissed || !isFirstEver) return;
    const t = window.setTimeout(() => handleDismiss(), 8000);
    return () => window.clearTimeout(t);
  }, [session?.id, dismissed, isFirstEver]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!session || dismissed || !isFirstEver) return null;

  // Loudness guard — defensive: only render when classifier agrees this is L2.
  const level = classifyLoudness({
    kind: 'session_started',
    source: session.source,
    isFirstEver: true,
  });
  if (level !== 'L2') return null;

  const isCharger =
    session.source === 'supercharger' || session.source === 'third_party_dc';
  const message = isCharger
    ? 'This is the rhythm. Whenever you plug in, ZenSolar mints silently in the background.'
    : 'This is the rhythm. Every home session quietly mints $ZSOLAR — no taps required.';

  function handleDismiss() {
    if (!session) return;
    try {
      sessionStorage.setItem(DISMISS_KEY(session.id), '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-1 mb-3 flex items-start gap-2.5 rounded-lg border border-border/40 bg-card/60 px-3 py-2 backdrop-blur-sm animate-in fade-in slide-in-from-top-1 duration-500"
    >
      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/80" />
      <div className="min-w-0 flex-1 text-[12px] leading-snug text-foreground/90">
        {message}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="ml-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
