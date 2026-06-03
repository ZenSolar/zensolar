import { useEffect, useMemo, useRef, useState } from 'react';
import { useBatteryTelemetry } from '@/hooks/useDeviceTelemetry';
import { detectTeslaOutage, isUnambiguousTeslaOutage, type OutageSource } from '@/lib/gridOutage';

export interface UseGridOutageOptions {
  /** Min continuous off-grid duration before flipping to true. Default 15s. */
  debounceMs?: number;
  /** Faster flip when signal is unambiguous (grid≈0, clear discharge, real load). Default 8s. */
  fastDebounceMs?: number;
}

export interface UseGridOutageResult {
  isGridOutage: boolean;
  since: Date | null;
  source: OutageSource;
}

/**
 * Watches battery telemetry and emits a debounced grid-outage flag.
 *
 * Two-tier debounce:
 *   • Unambiguous signals (clearly off-grid status OR strict heuristic match)
 *     flip after `fastDebounceMs` (~8s) so Outage Mode appears quickly.
 *   • Ambiguous signals wait the full `debounceMs` (~15s) to avoid false flips
 *     from idle drift.
 *
 * The `since` timestamp prefers the OEM telemetry `sample_at` over wall-clock,
 * so the "Since X ago" label reflects the real outage start, not the moment
 * the app first received a sample.
 */
export function useGridOutage(opts: UseGridOutageOptions = {}): UseGridOutageResult {
  const { debounceMs = 15_000, fastDebounceMs = 8_000 } = opts;
  const battery = useBatteryTelemetry();
  const primary = battery.data?.[0];
  const oem = primary?.oem;
  const payload = primary?.payload;
  const sampleAt = primary?.sample_at;

  const rawSignal = useMemo(() => {
    if (oem === 'tesla') {
      return {
        isOutage: detectTeslaOutage(payload),
        unambiguous: isUnambiguousTeslaOutage(payload),
        source: 'tesla' as OutageSource,
      };
    }
    return { isOutage: false, unambiguous: false, source: 'unknown' as OutageSource };
  }, [oem, payload]);

  const firstSeenRef = useRef<number | null>(null);
  const [state, setState] = useState<UseGridOutageResult>({
    isGridOutage: false,
    since: null,
    source: 'unknown',
  });

  useEffect(() => {
    if (!rawSignal.isOutage) {
      firstSeenRef.current = null;
      setState((prev) =>
        prev.isGridOutage || prev.since
          ? { isGridOutage: false, since: null, source: 'unknown' }
          : prev,
      );
      return;
    }

    const now = Date.now();
    if (firstSeenRef.current === null) {
      // Prefer the OEM telemetry sample time so "Since X ago" reflects the
      // actual outage start. Fallback to wall-clock when sample_at is missing.
      const sampleMs = sampleAt ? Date.parse(sampleAt) : NaN;
      firstSeenRef.current = Number.isFinite(sampleMs) ? sampleMs : now;
    }
    const elapsed = now - firstSeenRef.current;
    const effectiveDebounce = rawSignal.unambiguous ? fastDebounceMs : debounceMs;

    if (elapsed >= effectiveDebounce) {
      setState({
        isGridOutage: true,
        since: new Date(firstSeenRef.current),
        source: rawSignal.source,
      });
      return;
    }

    const remaining = effectiveDebounce - elapsed;
    const t = window.setTimeout(() => {
      if (firstSeenRef.current === null) return; // recovered before flip
      setState({
        isGridOutage: true,
        since: new Date(firstSeenRef.current),
        source: rawSignal.source,
      });
    }, remaining);
    return () => window.clearTimeout(t);
  }, [rawSignal, debounceMs, fastDebounceMs, sampleAt]);

  return state;
}
