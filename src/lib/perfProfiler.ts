/**
 * Lightweight perf profiler for the home dashboard.
 *
 * Two channels:
 *   1. React render timing — wrap any subtree in `<PerfProbe id="...">` and slow renders
 *      (default >16ms = one frame at 60fps) are logged to the console.
 *   2. Network timing — `installNetworkPerfLogger()` taps PerformanceObserver and logs any
 *      fetch/xhr that takes longer than the configured threshold (default 800ms).
 *
 * Both are no-ops in production. Set `localStorage.zenPerfDebug = "1"` in dev to also
 * log fast renders — useful for spot-checking hot paths.
 */

const FRAME_BUDGET_MS = 16; // 1 frame at 60fps
const SLOW_NETWORK_MS = 800;

const isDev = import.meta.env.DEV;

function verbose(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem('zenPerfDebug') === '1';
  } catch {
    return false;
  }
}

/** React Profiler `onRender` callback — log when a commit exceeds one frame. */
export function onRenderCallback(
  id: string,
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number,
  baseDuration: number,
) {
  if (!isDev) return;
  if (actualDuration > FRAME_BUDGET_MS) {
    // eslint-disable-next-line no-console
    console.warn(
      `[perf] slow ${phase} <${id}> ${actualDuration.toFixed(1)}ms (base ${baseDuration.toFixed(1)}ms)`,
    );
  } else if (verbose()) {
    // eslint-disable-next-line no-console
    console.debug(`[perf] ${phase} <${id}> ${actualDuration.toFixed(1)}ms`);
  }
}

let networkLoggerInstalled = false;

/** Install a one-time PerformanceObserver that logs slow XHR/fetch requests. */
export function installNetworkPerfLogger(thresholdMs = SLOW_NETWORK_MS) {
  if (!isDev || networkLoggerInstalled) return;
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType !== 'resource') continue;
        const r = entry as PerformanceResourceTiming;
        // Only flag XHR/fetch — ignore static assets (script/css/image/font).
        if (r.initiatorType !== 'fetch' && r.initiatorType !== 'xmlhttprequest') continue;
        if (r.duration < thresholdMs) {
          if (verbose()) {
            // eslint-disable-next-line no-console
            console.debug(`[perf-net] ${r.duration.toFixed(0)}ms ${r.name}`);
          }
          continue;
        }
        // eslint-disable-next-line no-console
        console.warn(`[perf-net] slow ${r.duration.toFixed(0)}ms ${r.name}`);
      }
    });
    observer.observe({ entryTypes: ['resource'] });
    networkLoggerInstalled = true;
  } catch {
    // Some browsers/test envs don't support entryTypes — fail silently.
  }
}
