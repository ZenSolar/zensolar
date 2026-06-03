## Phase 4: Notifications + Proactive Deason + Outage history

Builds on the `useGridOutage()` hook already shipped.

## 1. DB — `grid_outage_events` table

New migration. Captures one row per outage; updated on recovery.

```sql
CREATE TABLE public.grid_outage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'tesla',      -- 'tesla' | 'enphase' | 'solaredge' | 'unknown'
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  duration_seconds integer GENERATED ALWAYS AS
    (CASE WHEN ended_at IS NULL THEN NULL
          ELSE GREATEST(0, EXTRACT(EPOCH FROM (ended_at - started_at))::int)
     END) STORED,
  estimated_backup_hours_at_start numeric,
  soc_pct_start numeric,
  soc_pct_end numeric,
  device_context jsonb DEFAULT '{}'::jsonb,  -- {device_id, device_name, oem, battery_count}
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.grid_outage_events TO authenticated;
GRANT ALL ON public.grid_outage_events TO service_role;

ALTER TABLE public.grid_outage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own outages: select" ON public.grid_outage_events FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own outages: insert" ON public.grid_outage_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own outages: update" ON public.grid_outage_events FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX grid_outage_events_user_started_idx ON public.grid_outage_events (user_id, started_at DESC);
CREATE TRIGGER grid_outage_events_set_updated_at BEFORE UPDATE ON public.grid_outage_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

No UI surface yet — capture only.

## 2. Access gate — `src/hooks/useDeasonOutageAccess.ts`

Mirrors the existing `useEnergyInsightsSubscription` gating so we have a clear future hook for the real `$4.99 Deason` subscription:

- Founders / admins → access.
- Beta users (any user with ≥1 `connected_devices` row) → access.
- `energy_subscriptions.active === true` → access.
- Otherwise → no access.

Returns `{ hasAccess: boolean, reason: 'founder' | 'beta' | 'subscription' | 'none', loading }`. TODO comment marking the spot to swap in a future `deason_subscriptions` table.

## 3. Orchestrator hook — `src/hooks/useOutageLifecycle.ts`

Single source of truth for all outage side effects. Mounted once inside `LiveEnergyMonitoringCard` (which already wires `useGridOutage`). Pure side-effects, no JSX.

Inputs (read inside the hook):
- `useAuth()` for `user.id`
- `useGridOutage()` → `{ isGridOutage, since, source }`
- `useBatteryTelemetry()` first row → derive `socPct`, `capacityKwh`, `dischargeKw`, `solarKw`, `device_name/id/count`
- `estimateBackupTime(...)` for current label
- `useDeasonOutageAccess()`

Refs/state:
- `eventIdRef` — uuid of the currently active outage row.
- `lastLongPingAtRef` — last time we sent a "still on backup" push.
- `transitionedRef` — guards double-fire under StrictMode/re-renders.

Lifecycle actions:

**On transition `false → true` (start):**
1. INSERT into `grid_outage_events` with `started_at = since ?? new Date()`, source, SOC, backup-hours estimate, device_context. Store returned id.
2. Invoke `send-push-notification` (best-effort, fire-and-forget):
   - title: `Grid outage detected`
   - body: `Your battery is now powering your home. ~{label} of backup remaining.`
   - url: `/`
3. If `hasAccess`, dispatch:
   - `deason:nudge` with `assistant` seed: `"Grid outage detected. Your battery is now powering your home — about {label}. Want me to put together a quick load-shedding plan to extend your backup time?"` and `meta: { kind: 'grid_outage', phase: 'start', socPct, backupLabel, dischargeKw, source }`
   - `deason:open`
4. If no access, dispatch `deason:nudge` (no auto-open) so the bubble still pulses subtly.

**While active (every render):**
- If `Date.now() - (lastLongPingAtRef.current ?? startedAt) >= LONG_OUTAGE_MS` (default 4h, configurable via hook arg), send a follow-up push: `Still on battery backup`, body: `~{label} of backup remaining. Battery at {soc}%.`. Update ref.

**On transition `true → false` (recovery):**
1. UPDATE the row (`eventIdRef.current`) with `ended_at = now()`, `soc_pct_end`.
2. Push: title `Power restored`, body: `Grid is back online. Your battery is recharging.`
3. If `hasAccess`, dispatch `deason:nudge` only (no auto-open) summarizing recovery.
4. Clear refs.

All Supabase calls swallow errors with `console.warn` — never let logging or push failures break the dashboard. The hook also guards itself when `!user` or `!isGridOutage` on first mount (no spurious start).

## 4. Wire into `LiveEnergyMonitoringCard`

One line near the existing `useGridOutage()` call:

```ts
const autoOutage = useGridOutage();
useOutageLifecycle({
  isGridOutage: autoOutage.isGridOutage,
  since: autoOutage.since,
  source: autoOutage.source,
  batteryStats,
  solarKw: solarStats.currentKw ?? 0,
  primaryBattery,
  batteryCount: battery.data?.length ?? 1,
});
```

No visual change to the card.

## 5. Tests

- `src/test/useOutageLifecycle.test.tsx` (jsdom): mock supabase + battery hook + grid-outage hook. Verify:
  - On false→true: one INSERT, one `send-push-notification` invocation, one `deason:open` event when `hasAccess` is true.
  - When `hasAccess` is false: no `deason:open`, push still sent.
  - On true→false: one UPDATE with `ended_at` + recovery push.
  - Re-rendering with the same state does not re-fire.

## Out of scope

- UI list / view of outage history (data is logged only).
- Enphase / SolarEdge detectors.
- Custom notification preferences page.
- Actual `$4.99` paywall plumbing (gated by founder/beta/active sub heuristic with TODO).
