import { useCallback, useEffect, useRef } from 'react';
import { logAudioDebug } from '@/lib/audioDebug';
import {
  getSharedAudioContext,
  IMMEDIATE_SOUND_LEAD,
  POST_RESUME_SOUND_LEAD,
  getSafeAudioStartTime,
  scheduleWhenAudioRunning,
} from './useMintSound';
import {
  createShimmerAudioGraph,
  setShimmerGraphCycleDuration,
  setShimmerGraphVolume,
  type ShimmerNodes,
} from './shimmer/shimmerAudioGraph';
import {
  clearShimmerDisposalTimeout,
  pollUntilShimmerReady,
  scheduleShimmerGraphDisposal,
} from './shimmer/shimmerAudioLifecycle';

/**
 * useShimmerSound — continuous lightsaber-style ambient hum
 * that pulses in sync with the dashboard shimmer sweep cycle.
 *
 * Reuses the shared AudioContext from useMintSound so it benefits
 * from the same user-gesture unlock and keep-alive infrastructure.
 */

interface ShimmerSoundOptions {
  /** Duration of one shimmer cycle in seconds (default 5) */
  cycleDuration?: number;
  /** Master volume 0-1 (default 0.06 — very subtle) */
  volume?: number;
  /** Whether the sound is active */
  enabled?: boolean;
  /** Prebuild the graph silently so first activation is instant */
  prewarm?: boolean;
}

export function useShimmerSound({
  cycleDuration = 5,
  volume = 0.06,
  enabled = true,
  prewarm = false,
}: ShimmerSoundOptions = {}) {
  const nodesRef = useRef<ShimmerNodes | null>(null);
  const disposeTimerRef = useRef<number | null>(null);
  const pendingBootCleanupRef = useRef<(() => void) | null>(null);
  const pendingBootVolumeRef = useRef(0);
  const pendingBootStartTimeRef = useRef<number | undefined>(undefined);
  const lastManualStartRef = useRef(0);
  const volumeRef = useRef(volume);
  const cycleDurationRef = useRef(cycleDuration);
  volumeRef.current = volume;
  cycleDurationRef.current = cycleDuration;

  const clearPendingDisposal = useCallback(() => {
    disposeTimerRef.current = clearShimmerDisposalTimeout(disposeTimerRef.current);
  }, []);

  const clearPendingBoot = useCallback(() => {
    pendingBootCleanupRef.current?.();
    pendingBootCleanupRef.current = null;
    pendingBootStartTimeRef.current = undefined;
  }, []);

  const stopSound = useCallback((force = false) => {
    // Guard: don't let effect-driven cleanup kill a graph that was just
    // manually started (e.g. via the gesture handler) within the last 2s.
    if (!force && lastManualStartRef.current && Date.now() - lastManualStartRef.current < 2000) {
      return;
    }

    clearPendingBoot();
    clearPendingDisposal();

    const nodes = nodesRef.current;
    if (!nodes) return;

    disposeTimerRef.current = scheduleShimmerGraphDisposal(nodes, () => {
      if (nodesRef.current === nodes) {
        nodesRef.current = null;
      }
      disposeTimerRef.current = null;
    });
  }, [clearPendingBoot, clearPendingDisposal]);

  const startSound = useCallback(function startSoundInternal(
    scheduledStartTime?: number,
    activationVolume?: number,
  ) {
    lastManualStartRef.current = Date.now();
    const targetVolume = activationVolume ?? volumeRef.current;
    const existingNodes = nodesRef.current;

    const queueUntilRunning = (
      ctx: AudioContext,
      activate: (now: number, volume: number) => void,
    ) => {
      pendingBootStartTimeRef.current = scheduledStartTime;
      pendingBootVolumeRef.current = targetVolume;

      if (pendingBootCleanupRef.current) {
        return true;
      }

      ctx.resume().catch(() => {});
      pendingBootCleanupRef.current = scheduleWhenAudioRunning(
        ctx,
        (runningStartTime) => {
          pendingBootCleanupRef.current = null;

          const nextScheduledStartTime = pendingBootStartTimeRef.current;
          const nextVolume = pendingBootVolumeRef.current;
          pendingBootStartTimeRef.current = undefined;

          activate(
            nextScheduledStartTime !== undefined
              ? getSafeAudioStartTime(ctx, nextScheduledStartTime, 0)
              : runningStartTime,
            nextVolume,
          );
        },
        {
          requestedTime: scheduledStartTime,
          runningLead: IMMEDIATE_SOUND_LEAD,
          resumedLead: POST_RESUME_SOUND_LEAD,
          onTimeout: () => {
            pendingBootCleanupRef.current = null;
            pendingBootStartTimeRef.current = undefined;
            logAudioDebug('hum-missed', { reason: 'audio-running-timeout' });
          },
        },
      );

      return true;
    };

    if (existingNodes) {
      clearPendingDisposal();

      const activateExistingNodes = (now: number, volumeToApply: number, mode: 'reactivate' | 'reactivate-cold') => {
        setShimmerGraphCycleDuration(existingNodes, cycleDurationRef.current, now);
        setShimmerGraphVolume(existingNodes, volumeToApply, now);

        if (volumeToApply > 0) {
          logAudioDebug('hum-fired', {
            ctx: existingNodes.ctx.state,
            mode,
            start: now,
            volume: volumeToApply,
          });
        }
      };

      if (existingNodes.ctx.state !== 'running') {
        return queueUntilRunning(existingNodes.ctx, (now, volumeToApply) => {
          activateExistingNodes(now, volumeToApply, 'reactivate-cold');
        });
      }

      const now = scheduledStartTime !== undefined
        ? getSafeAudioStartTime(existingNodes.ctx, scheduledStartTime, 0)
        : existingNodes.ctx.currentTime;

      activateExistingNodes(now, targetVolume, 'reactivate');
      return true;
    }

    const ctx = getSharedAudioContext();
    if (!ctx) {
      logAudioDebug('hum-missed', { reason: 'no-context' });
      return false;
    }

    const finalizeBoot = (now: number, volumeToApply: number, mode: 'boot' | 'boot-cold') => {
      clearPendingDisposal();
      nodesRef.current = createShimmerAudioGraph(ctx, now, {
        cycleDuration: cycleDurationRef.current,
        volume: volumeToApply,
      });

      if (volumeToApply > 0) {
        logAudioDebug('hum-fired', { ctx: ctx.state, mode, start: now, volume: volumeToApply });
      }
    };

    if (ctx.state !== 'running') {
      return queueUntilRunning(ctx, (now, volumeToApply) => {
        finalizeBoot(now, volumeToApply, 'boot-cold');
      });
    }

    const now = scheduledStartTime !== undefined
      ? getSafeAudioStartTime(ctx, scheduledStartTime, 0)
      : getSafeAudioStartTime(ctx, undefined, IMMEDIATE_SOUND_LEAD);

    finalizeBoot(now, targetVolume, 'boot');

    return true;
  }, [clearPendingBoot, clearPendingDisposal]);

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled && !prewarm) {
      stopSound(true);
      return;
    }

    const initialVolume = enabled ? volumeRef.current : 0;

    return pollUntilShimmerReady(() => {
      // Only boot if a manual startSound call hasn't already created the graph
      if (!nodesRef.current) {
        return startSound(undefined, initialVolume);
      }
      return true;
    });
    // Cleanup: only force-stop if we're transitioning TO disabled (not to enabled)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, prewarm, startSound, stopSound]);

  useEffect(() => () => {
    stopSound(true);
  }, [stopSound]);

  useEffect(() => {
    if (!nodesRef.current) return;
    setShimmerGraphVolume(nodesRef.current, enabled ? volume : 0, nodesRef.current.ctx.currentTime, 0.1);
  }, [enabled, volume]);

  useEffect(() => {
    if (!nodesRef.current) return;
    setShimmerGraphCycleDuration(nodesRef.current, cycleDuration, nodesRef.current.ctx.currentTime);
  }, [cycleDuration]);

  useEffect(() => {
    if (!enabled) return;

    const sustain = () => {
      const nodes = nodesRef.current;
      if (!nodes) return;

      clearPendingDisposal();

      if (nodes.ctx.state !== 'running') {
        nodes.ctx.resume().catch(() => {});
      }

      const now = nodes.ctx.currentTime;
      setShimmerGraphCycleDuration(nodes, cycleDurationRef.current, now, 0.15);
      setShimmerGraphVolume(nodes, volumeRef.current, now, 0.15);
    };

    sustain();
    const intervalId = window.setInterval(sustain, 1200);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') sustain();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', sustain);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', sustain);
    };
  }, [enabled, clearPendingDisposal]);

  return startSound;
}
