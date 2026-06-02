import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { detectSolarConflict, detectChargingConflict } from '@/lib/dataSourcePriority';

/**
 * Surfaces OEM connection issues so Deason can guide the user through fixes.
 *
 * Detected diagnostics:
 *   - `oem_token_expired`     — energy_tokens.expires_at < now()
 *   - `solar_source_conflict` — multiple OEMs report solar (we still pick ONE
 *                               via pickSource, but the user deserves a heads-up)
 *   - `charging_source_conflict` — Tesla vehicle AND a separate home charger
 *                                  are claimed (Tesla wins; we suppress the
 *                                  charger to avoid double-count)
 *
 * Each open finding is mirrored into `oem_diagnostic_log` (admin/team visible)
 * and presented in-app by `OemDiagnosticsBanner` with a friendly explanation
 * plus a deep-link to reconnect or open Deason.
 */
export type OemDiagnosticKey =
  | 'oem_token_expired'
  | 'solar_source_conflict'
  | 'charging_source_conflict';

export interface OemDiagnostic {
  key: OemDiagnosticKey;
  provider: string;
  severity: 'info' | 'warn' | 'error';
  title: string;
  detail: string;
  /** Suggested next step the UI should render. */
  cta?: { label: string; href: string };
}

interface DeviceRow {
  provider: string;
  device_type: string;
  device_id: string;
  device_name: string | null;
}

export function useOemDiagnostics() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [diagnostics, setDiagnostics] = useState<OemDiagnostic[]>([]);
  const [loading, setLoading] = useState(true);

  const scan = useCallback(async () => {
    if (!user) {
      setDiagnostics([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const findings: OemDiagnostic[] = [];

    const [{ data: tokens }, { data: devices }] = await Promise.all([
      supabase
        .from('energy_tokens')
        .select('provider, expires_at')
        .eq('user_id', user.id),
      supabase
        .from('connected_devices')
        .select('provider, device_type, device_id, device_name')
        .eq('user_id', user.id),
    ]);

    const now = Date.now();
    for (const t of (tokens as { provider: string; expires_at: string | null }[] | null) ?? []) {
      if (t.expires_at && new Date(t.expires_at).getTime() < now) {
        findings.push({
          key: 'oem_token_expired',
          provider: t.provider,
          severity: 'warn',
          title: `${pretty(t.provider)} needs to be reconnected`,
          detail: `Your ${pretty(t.provider)} session has expired. We can't pull new data until you reconnect — it usually takes under a minute.`,
          cta: { label: `Reconnect ${pretty(t.provider)}`, href: `/profile?reconnect=${t.provider}` },
        });
      }
    }

    const devs = (devices as DeviceRow[] | null) ?? [];

    const solar = detectSolarConflict(devs);
    if (solar.conflicting) {
      const winner =
        profile?.solar_installer === 'tesla'
          ? 'Tesla'
          : profile?.solar_inverter_brand && profile.solar_inverter_brand !== 'other'
            ? pretty(profile.solar_inverter_brand)
            : 'Enphase';
      findings.push({
        key: 'solar_source_conflict',
        provider: solar.providers.join(','),
        severity: 'info',
        title: 'Multiple solar sources connected',
        detail: `You have ${solar.providers.map(pretty).join(' + ')} reporting solar. We use ${winner} only — the others stay connected for backup but never double-count a kWh.`,
        cta: { label: 'Review in Profile', href: '/profile#installer' },
      });
    }

    const ch = detectChargingConflict(devs);
    if (ch.conflicting) {
      findings.push({
        key: 'charging_source_conflict',
        provider: 'tesla,home_charger',
        severity: 'info',
        title: 'Tesla vehicle + home charger detected',
        detail:
          'Both your Tesla and a home charger are connected. We use the Tesla vehicle as the single source of truth for charging energy so kWh never get counted twice.',
      });
    }

    setDiagnostics(findings);
    setLoading(false);

    // Mirror open findings into the audit log (best-effort, ignore failures).
    if (findings.length > 0) {
      const rows = findings.map((f) => ({
        user_id: user.id,
        provider: f.provider,
        diagnostic_key: f.key,
        severity: f.severity,
        detail: { title: f.title, detail: f.detail } as Record<string, unknown>,
      }));
      await supabase.from('oem_diagnostic_log').insert(rows).select().then(undefined, () => undefined);
    }
  }, [user, profile?.solar_installer, profile?.solar_inverter_brand]);

  useEffect(() => {
    void scan();
  }, [scan]);

  return { diagnostics, loading, rescan: scan };
}

function pretty(p: string) {
  if (p === 'solaredge') return 'SolarEdge';
  return p.charAt(0).toUpperCase() + p.slice(1);
}
