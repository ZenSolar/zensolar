import { useEffect, useMemo, useRef, useState } from 'react';
import { useBatteryTelemetry } from '@/hooks/useDeviceTelemetry';
import { detectTeslaOutage, type OutageSource } from '@/lib/gridOutage';

export interface UseGridOutageOptions {
  /** Min continuous off-grid duration before flipping to true. Default 45s. */
  debounceMs?: number;
}

export interface UseGridOutageResult {
  isGridOutage: boolean;
  since: Date | null;
  source: OutageSource;
}

/**
 * Watches battery telemetry and emits a debounced grid-outage flag.
 * Phase 3 covers Tesla; Enphase + SolarEdge detectors can be OR-composed later.
 */
export function useGridOutage(opts: UseGridOutageOptions = {}): UseGridOutageResult {
  const { debounceMs = 45_000 } = opts;
  const battery = useBatteryTelemetry();
  const primary = battery.data?.[0];
  const oem = primary?.oem;
  const payload = primary?.payload;

  const rawSignal = useMemo(() => {
    if (oem === 'tesla') {
      return { isOutage: detectTeslaOutage(payload), source: 'tesla' as OutageSource };
    }
    return { isOutage: false, source: 'unknown' as OutageSource };
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
    if (firstSeenRef.current === null) firstSeenRef.current = now;
    const elapsed = now - firstSeenRef.current;

    if (elapsed >= debounceMs) {
      setState({
        isGridOutage: true,
        since: new Date(firstSeenRef.current),
        source: rawSignal.source,
      });
      return;
    }

    // Schedule a single flip when the threshold is reached.
    const remaining = debounceMs - elapsed;
    const t = window.setTimeout(() => {
      if (firstSeenRef.current === null) return; // recovered before flip
      setState({
        isGridOutage: true,
        since: new Date(firstSeenRef.current),
        source: rawSignal.source,
      });
    }, remaining);
    return () => window.clearTimeout(t);
  }, [rawSignal, debounceMs]);

  return state;
}
