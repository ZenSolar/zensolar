/**
 * KPI tap analytics — records single/double-tap events and whether a user
 * confirmed a mint within the double-tap window. Inserts are batched and
 * flushed on a short timer (and on pagehide) so dashboard interactions
 * never block on the network.
 *
 * Schema: public.kpi_tap_events
 *   - category: 'solar' | 'battery' | 'ev' | 'supercharger' | 'home_charger' | string
 *   - event_type: 'single_tap' | 'double_tap' | 'mint_in_window' | 'mint_outside_window'
 */
import { supabase } from '@/integrations/supabase/client';

export type KpiCategory = 'solar' | 'battery' | 'ev' | 'supercharger' | 'home_charger' | string;
export type KpiEventType = 'single_tap' | 'double_tap' | 'mint_in_window' | 'mint_outside_window';

interface QueuedEvent {
  user_id: string;
  category: string;
  event_type: KpiEventType;
  occurred_at: string;
  session_id: string;
  metadata?: Record<string, unknown>;
}

const FLUSH_INTERVAL_MS = 4000;
const MAX_BATCH = 25;

// Stable per-tab session id so we can group events client-side later.
function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  const KEY = 'zen.kpiTapSessionId';
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return 'session';
  }
}

const queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let cachedUserId: string | null = null;
let userIdLookupPromise: Promise<string | null> | null = null;

async function getUserId(): Promise<string | null> {
  if (cachedUserId) return cachedUserId;
  if (!userIdLookupPromise) {
    userIdLookupPromise = supabase.auth.getUser().then(({ data }) => {
      cachedUserId = data.user?.id ?? null;
      return cachedUserId;
    }).catch(() => null);
  }
  return userIdLookupPromise;
}

async function flush() {
  flushTimer = null;
  if (queue.length === 0) return;
  const batch = queue.splice(0, MAX_BATCH);
  try {
    await supabase.from('kpi_tap_events').insert(batch);
  } catch {
    // Silently drop — analytics must never break the dashboard.
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
}

/** Record a KPI tap event. Non-blocking. */
export async function recordKpiTapEvent(
  category: KpiCategory,
  eventType: KpiEventType,
  metadata?: Record<string, unknown>
) {
  try {
    const userId = await getUserId();
    if (!userId) return; // Anonymous — skip.
    queue.push({
      user_id: userId,
      category,
      event_type: eventType,
      occurred_at: new Date().toISOString(),
      session_id: getSessionId(),
      metadata,
    });
    if (queue.length >= MAX_BATCH) {
      if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
      void flush();
    } else {
      scheduleFlush();
    }
  } catch {
    // Silent
  }
}

// Best-effort flush when the tab is hidden / closed.
if (typeof window !== 'undefined') {
  const onHide = () => { if (queue.length) void flush(); };
  window.addEventListener('pagehide', onHide);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onHide();
  });
}
