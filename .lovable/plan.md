## Phase 4.1 — Round out outage history columns

Phase 4 (push notifications + auto-Deason + `grid_outage_events` logging + access gate) is already live from the previous turn. Re-reading the new spec, two fields aren't yet captured:

- **Peak load during the outage** (kW)
- **Whether the user interacted with Deason during the outage** (boolean)

Everything else in the request — push at start / 4h follow-up / restore, auto-open Deason gated by founder/beta/active sub, and the `grid_outage_events` row with start/end/duration/SOC/backup estimate — already ships. Tests pass.

### Changes

**1. Migration — extend `grid_outage_events`**

```sql
ALTER TABLE public.grid_outage_events
  ADD COLUMN peak_load_kw numeric,
  ADD COLUMN deason_interacted boolean NOT NULL DEFAULT false;
```

(No new GRANT/RLS — inherits from existing policies.)

**2. `useOutageLifecycle.ts` — track peak load**

- Add a `peakLoadKwRef` updated on every render while `isGridOutage` is true. Source: `load_power` from `primaryBattery.payload` (already extracted as `homeKw` in `LiveEnergyMonitoringCard`) — accept it as a new optional `homeKw` input field rather than reaching into payload again.
- On recovery, include `peak_load_kw: peakLoadKwRef.current` in the UPDATE alongside `ended_at` / `soc_pct_end`.
- Also initialize the ref at start with the current load so single-tick outages still get a value.

**3. `useOutageLifecycle.ts` — Deason-interaction flag**

- New ref `deasonInteractedRef` set to `false` on outage start.
- Subscribe (only while an outage is active) to a new `deason:user-message` window event that the Deason chat will dispatch when the user sends a message (one-line addition in `DeasonChat`'s submit handler — fire-and-forget `CustomEvent`).
- Also flip the flag to `true` if the user manually opens the bubble (`deason:open` initiated by tap, not by us) during an outage. Cleanest signal: have the Deason bubble dispatch `deason:user-message` on first user submission; we don't need to differentiate manual-open from auto-open.
- On recovery, UPDATE includes `deason_interacted: deasonInteractedRef.current`.

**4. `DeasonChat` (or `DeasonFloatingBubble`) — emit interaction event**

Single line in the user-message submit handler:

```ts
window.dispatchEvent(new CustomEvent('deason:user-message'));
```

Find the existing submit handler (chat composer) and add the dispatch right after the optimistic message is appended. Cheap and decoupled.

**5. `LiveEnergyMonitoringCard` — pass `homeKw`**

`homeKwRaw` is already computed (line ~674). Pass it into `useOutageLifecycle({ homeKw: homeKwRaw, ... })`.

**6. Tests**

Extend `src/test/useOutageLifecycle.test.tsx`:
- Verify the recovery UPDATE includes `peak_load_kw` ≥ the highest `homeKw` seen.
- Verify `deason_interacted: true` after firing a `deason:user-message` event mid-outage; `false` otherwise.

### Out of scope (unchanged)

- Outage history UI / list view
- Long-term Deason memory across past outages
- Enphase / SolarEdge detectors
- Actual `$4.99` paywall plumbing (still beta/founder fallback with TODO)
