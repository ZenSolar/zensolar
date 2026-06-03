import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { estimateBackupTime } from '@/lib/gridOutage';
import { useDeasonOutageAccess } from '@/hooks/useDeasonOutageAccess';

/**
 * Side-effect orchestrator for grid outages.
 *
 * Consumes the already-debounced state from `useGridOutage()` and, on
 * transitions, triggers:
 *   1. Push notifications (start, long-outage check-in, recovery)
 *   2. Proactive Deason auto-open (gated by `useDeasonOutageAccess`)
 *   3. Outage history logging in `grid_outage_events`
 *
 * Pure side effects — renders nothing. Mount once near where
 * `useGridOutage()` is already consumed (LiveEnergyMonitoringCard).
 */

const DEFAULT_LONG_OUTAGE_MS = 4 * 60 * 60 * 1000; // 4 hours

export interface OutageLifecycleInput {
  isGridOutage: boolean;
  since: Date | null;
  source: 'tesla' | 'enphase' | 'solaredge' | 'unknown' | string;
  batteryStats: {
    soc: number | null;
    capacityKwh: number | null;
    powerKw: number | null;
  };
  solarKw: number;
  primaryBattery?: {
    device_id?: string | null;
    device_name?: string | null;
    oem?: string | null;
  } | null;
  batteryCount?: number;
  /** Current household load (kW), used for peak-load tracking. */
  homeKw?: number | null;
  /** Override the 4h follow-up cadence (ms). Mostly for tests. */
  longOutageMs?: number;
}

function sendPush(userId: string, title: string, body: string, url = '/') {
  // Fire-and-forget. Never block the dashboard if push infra is offline.
  void supabase.functions
    .invoke('send-push-notification', {
      body: { user_id: userId, title, body, url },
    })
    .catch((err) => {
      console.warn('[useOutageLifecycle] push failed', err);
    });
}

function backupLabelNow(stats: OutageLifecycleInput['batteryStats']) {
  const est = estimateBackupTime({
    socPct: stats.soc ?? 0,
    usableCapacityKwh: stats.capacityKwh ?? 13.5,
    currentDischargeKw: Math.max(0, -(stats.powerKw ?? 0)),
    smoothingKey: 'outage-lifecycle',
  });
  return est.label;
}

export function useOutageLifecycle(input: OutageLifecycleInput) {
  const { user } = useAuth();
  const { hasAccess } = useDeasonOutageAccess();

  const eventIdRef = useRef<string | null>(null);
  const wasActiveRef = useRef(false);
  const lastLongPingAtRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const longOutageMs = input.longOutageMs ?? DEFAULT_LONG_OUTAGE_MS;

  useEffect(() => {
    if (!user) return;

    const {
      isGridOutage, since, source, batteryStats, primaryBattery, batteryCount,
    } = input;

    const wasActive = wasActiveRef.current;

    // ── Transition: false → true (start) ───────────────────────────────────
    if (isGridOutage && !wasActive) {
      wasActiveRef.current = true;
      const startedAt = since ?? new Date();
      startedAtRef.current = startedAt.getTime();
      lastLongPingAtRef.current = startedAt.getTime();

      const label = backupLabelNow(batteryStats);
      const socStart = batteryStats.soc;
      const backupEst = estimateBackupTime({
        socPct: socStart ?? 0,
        usableCapacityKwh: batteryStats.capacityKwh ?? 13.5,
        currentDischargeKw: Math.max(0, -(batteryStats.powerKw ?? 0)),
        smoothingKey: 'outage-start',
      });

      const deviceContext = {
        device_id: primaryBattery?.device_id ?? null,
        device_name: primaryBattery?.device_name ?? null,
        oem: primaryBattery?.oem ?? source,
        battery_count: batteryCount ?? 1,
      };

      // 1. Log history
      void supabase
        .from('grid_outage_events')
        .insert({
          user_id: user.id,
          source: String(source ?? 'unknown'),
          started_at: startedAt.toISOString(),
          estimated_backup_hours_at_start: Number.isFinite(backupEst.hours)
            ? Number(backupEst.hours.toFixed(2))
            : null,
          soc_pct_start: socStart,
          device_context: deviceContext,
        })
        .select('id')
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) console.warn('[useOutageLifecycle] insert failed', error);
          eventIdRef.current = data?.id ?? null;
        });

      // 2. Push notification
      sendPush(
        user.id,
        'Grid outage detected',
        `Your battery is now powering your home. ${label} of backup remaining.`,
        '/',
      );

      // 3. Deason — proactive open (gated) or subtle nudge
      const meta = {
        kind: 'grid_outage',
        phase: 'start',
        socPct: socStart,
        backupLabel: label,
        dischargeKw: Math.max(0, -(batteryStats.powerKw ?? 0)),
        source,
      };
      const assistantSeed =
        `Grid outage detected. Your battery is now powering your home — about ${label}. ` +
        `Want me to put together a quick load-shedding plan to extend your backup time?`;

      window.dispatchEvent(
        new CustomEvent('deason:nudge', { detail: { assistant: assistantSeed, meta } }),
      );
      if (hasAccess) {
        window.dispatchEvent(new Event('deason:open'));
      }
      return;
    }

    // ── While active: long-outage follow-up ────────────────────────────────
    if (isGridOutage && wasActive) {
      const now = Date.now();
      const last = lastLongPingAtRef.current ?? startedAtRef.current ?? now;
      if (now - last >= longOutageMs) {
        lastLongPingAtRef.current = now;
        const label = backupLabelNow(batteryStats);
        const soc = batteryStats.soc != null ? Math.round(batteryStats.soc) : null;
        sendPush(
          user.id,
          'Still on battery backup',
          soc != null
            ? `${label} of backup remaining. Battery at ${soc}%.`
            : `${label} of backup remaining.`,
          '/',
        );
      }
      return;
    }

    // ── Transition: true → false (recovery) ────────────────────────────────
    if (!isGridOutage && wasActive) {
      wasActiveRef.current = false;
      const eventId = eventIdRef.current;
      const socEnd = batteryStats.soc;

      if (eventId) {
        void supabase
          .from('grid_outage_events')
          .update({
            ended_at: new Date().toISOString(),
            soc_pct_end: socEnd,
          })
          .eq('id', eventId)
          .then(({ error }) => {
            if (error) console.warn('[useOutageLifecycle] update failed', error);
          });
      }

      sendPush(
        user.id,
        'Power restored',
        'Grid is back online. Your battery is recharging.',
        '/',
      );

      window.dispatchEvent(
        new CustomEvent('deason:nudge', {
          detail: {
            assistant:
              'Power is back. Your battery is recharging from the grid — I can summarize how your backup performed if you want a quick recap.',
            meta: { kind: 'grid_outage', phase: 'recovery', socPct: socEnd },
          },
        }),
      );

      eventIdRef.current = null;
      startedAtRef.current = null;
      lastLongPingAtRef.current = null;
    }
  }, [
    user,
    hasAccess,
    longOutageMs,
    input.isGridOutage,
    input.since,
    input.source,
    input.batteryStats.soc,
    input.batteryStats.capacityKwh,
    input.batteryStats.powerKw,
    input.primaryBattery?.device_id,
    input.batteryCount,
    // Intentionally not depending on `input` identity to avoid re-firing.
    input,
  ]);
}
