## Scope

Five targeted fixes to Outage Mode. No backend/migration changes.

---

### 1. Detection speed → 15–25s (priority)

`src/hooks/useGridOutage.ts`
- Drop default `debounceMs` from `30_000` → `15_000`.
- Add a "fast-trigger" path: when the raw signal is *unambiguous* (grid |kW| ≤ 0.05, battery discharge ≥ 0.4 kW, home load ≥ 0.3 kW, OR explicit `gs ∈ {off_grid, islanded, backup}`), flip after `8s` instead of waiting the full debounce. Track this via a second ref so ambiguous signals still wait the full 15s.

`src/lib/gridOutage.ts`
- Export a small helper `isUnambiguousOutage(payload)` so the hook can branch without duplicating field parsing.
- Keep existing `detectTeslaOutage` behavior; just expose the stricter variant.

`src/components/dashboard/LiveEnergyMonitoringCard.tsx`
- Verify it passes no override for `debounceMs` (uses the new 15s default). Add a one-line comment explaining the two-tier debounce.

### 2. Deason: contextual outage message instead of generic welcome (priority)

`src/hooks/useOutageLifecycle.ts`
- Rewrite the start-phase `assistantSeed` to cover all four items the user listed (acknowledge outage + backup status; estimate + current load; 3 concrete load-shedding tips tailored to current draw; short safety line; offer to monitor & ping). Keep calm/supportive tone, ~120–160 words, markdown bullets.
- Include `homeKw` in the body when known; pick load-shedding tips based on `homeKw` band (e.g., > 3 kW → suggest pausing EV charging / large appliances; 1–3 kW → AC/heat-pump setback; < 1 kW → already lean).

`src/components/deason/DeasonFloatingBubble.tsx`
- When `pendingMeta.kind === 'grid_outage'` and the bubble auto-opens, **suppress the empty-state welcome** by dispatching `deason:seed` *before* the user sees the panel (already does this on open, but currently waits 60ms — reduce to 0 and dispatch synchronously inside the same tick the panel mounts so the `EmptyState` never flashes).
- Also dispatch a one-shot `deason:context` event carrying `meta` so future tools can read outage context. (Listener added in DeasonChat is a no-op stub for now — keeps surface area for follow-ups without behavior change.)

`src/components/deason/DeasonChat.tsx`
- When the first message in the thread is an outage-seeded assistant message (detect via the seeded text containing `Grid outage detected` OR via a new `deason:context` flag), skip rendering `<EmptyState>`. Today `EmptyState` only hides when `messages.length > 0`, but the seed lands a moment after mount — gate `EmptyState` behind a `hasPendingOutageSeed` ref set by the `deason:context` listener.

### 3. Energy Flow: dominant Battery → Home (priority)

`src/components/dashboard/EnergyFlowScene.tsx`
- During outage (`isOutage && flows.has('pw-home')`):
  - Replace inline `DottedFlow` for pw-home with a beefed-up variant: `r=1.1` particles (vs 0.6), 5 particles (vs 3), `strokeWidth=1.6` base line at `strokeOpacity=0.55`, `dur` floored at `0.9s` so motion reads as steady current.
  - Strengthen the amber halo: bump outer halo `strokeWidth` `2.4 → 4.0`, inner glow `0.9 → 1.6`, add a third soft pulse layer (`opacity 0.25`, `blur 4px`, `animate` 1.2s pulse).
  - Add an arrow chevron midway along `BLUEPRINT_PATHS.powerwallToHome` (small amber `<polygon>` aligned via `<animateMotion rotate="auto">`) to show direction.
- Dim non-essential flows during outage: wrap solar-related flows (`flow-solar-home`, `flow-solar-pw`) in `<g opacity={0.35}>` when `isOutage`.
- Keep the broken/dashed grid line + red X exactly as-is (already good per user).

Implement the beefed pw-home flow inline (don't refactor `DottedFlow`) so the calm default behavior elsewhere is untouched.

### 4. Outage start-time accuracy

`src/hooks/useGridOutage.ts`
- When the first off-grid sample arrives, prefer the telemetry's `sample_at` timestamp (from `useBatteryTelemetry().data[0].sample_at`) over `Date.now()` as the basis for `firstSeenRef`. Fallback to `Date.now()` when `sample_at` is missing.
- `since` continues to be set from `firstSeenRef`, so the "Since X ago" label now reflects the OEM sample time rather than the debounce-flip moment.

`src/hooks/useOutageLifecycle.ts`
- Use the same `since` value when inserting `grid_outage_events.started_at` (already does — verify no Date.now() override).

### 5. Deason input field sizing

`src/components/deason/DeasonChat.tsx` (line 598–618)
- Bump textarea: `min-h-[40px]` → `min-h-[56px]`, `max-h-32` → `max-h-44`, `py-2` → `py-3`, add `text-sm leading-relaxed` so wrapped lines breathe.
- Shorten the placeholder so it stops getting truncated on 390px viewports: `"Ask about your bill, rate plan, or savings… (/ for prompts)"`.
- Wrap the row in `items-end` (currently likely `items-center`) so the Send/Paperclip buttons sit at the bottom when the textarea grows.

---

### Out of scope

- Enphase / SolarEdge outage detectors
- New migrations or columns
- Deason long-term outage memory across events
- Any change to push-notification copy beyond what already ships

### Test updates

- `src/test/gridOutage.test.ts` — add `isUnambiguousOutage` cases (strict thresholds, missing fields, explicit off-grid status).
- `src/test/useOutageLifecycle.test.tsx` — assert the new seed contains "Stay safe", "backup remaining", and at least one load-shedding bullet.
- No new test file for the SVG changes (visual-only).
