// Lightweight diagnostics buffer for the Tesla/Enphase OAuth + device-selection
// flow. Every event is logged to the browser console AND appended to a rolling
// ring buffer in sessionStorage so we can inspect the full transition timeline
// even after redirects/PWA reloads wipe the console.
//
// Inspect from DevTools:  window.__oauthDiag()          -> returns array
//                          window.__oauthDiag('clear')   -> wipes buffer
//                          window.__oauthDiag('dump')    -> console.table

const KEY = 'oauth_diagnostics_buffer_v1';
const MAX = 200;

export type OAuthDiagEvent = {
  ts: string;          // ISO timestamp
  t: number;           // ms since page load (approx)
  scope: string;       // e.g. 'OAuthCallback', 'BetaTesla', 'useEnergyOAuth', 'DeviceSelectionDialog'
  event: string;       // short verb
  data?: unknown;
};

function readBuffer(): OAuthDiagEvent[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBuffer(events: OAuthDiagEvent[]) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(events.slice(-MAX)));
  } catch {
    // sessionStorage full / disabled — ignore, console log is still available
  }
}

const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();

export function oauthDiag(scope: string, event: string, data?: unknown) {
  const evt: OAuthDiagEvent = {
    ts: new Date().toISOString(),
    t: Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt),
    scope,
    event,
    data: data === undefined ? undefined : safeSerialize(data),
  };

  // Console — tagged, easy to grep
  // eslint-disable-next-line no-console
  console.log(`[oauth:${scope}] ${event}`, data ?? '');

  if (typeof sessionStorage === 'undefined') return;
  const buf = readBuffer();
  buf.push(evt);
  writeBuffer(buf);
}

function safeSerialize(value: unknown): unknown {
  try {
    // Trim large payloads — we only want signal, not tokens or blobs
    const seen = new WeakSet();
    return JSON.parse(
      JSON.stringify(value, (_key, val) => {
        if (typeof val === 'string' && val.length > 200) return val.slice(0, 200) + `…(+${val.length - 200})`;
        if (val && typeof val === 'object') {
          if (seen.has(val as object)) return '[Circular]';
          seen.add(val as object);
        }
        return val;
      }),
    );
  } catch {
    return String(value);
  }
}

// Expose an easy inspector for the user / debugging sessions.
if (typeof window !== 'undefined') {
  (window as unknown as { __oauthDiag?: (cmd?: string) => unknown }).__oauthDiag = (cmd?: string) => {
    if (cmd === 'clear') {
      sessionStorage.removeItem(KEY);
      // eslint-disable-next-line no-console
      console.log('[oauth] diagnostics buffer cleared');
      return [];
    }
    const buf = readBuffer();
    if (cmd === 'dump') {
      // eslint-disable-next-line no-console
      console.table(buf.map(({ ts, t, scope, event }) => ({ ts, t, scope, event })));
      return buf;
    }
    return buf;
  };
}
