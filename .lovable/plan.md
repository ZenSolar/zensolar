## Fix: Powerwall SOC stale by ~10% on Live card

**Problem.** ZenSolar shows 97% SOC while the Tesla app shows 87% at the same moment. Root cause is in `src/hooks/useDeviceTelemetry.ts`:

```ts
const TTL_MS: Record<Capability, number> = {
  battery: 12 * 60 * 60 * 1000,   // 12 hours — way too long for a live cockpit
  ev:      90 * 1000,
  solar:   60 * 60 * 1000,        // 1 hour — also too long for "Live"
};
```

A 12-hour cache means the Live card can be reading a value from breakfast. The "UPDATED 1M AGO" pill currently shows the cache-write time, not the sample time, which makes the lie convincing.

This plan is data-layer only. No visual changes. The clean-slate visual rebuild is paused until reference screenshots arrive.

### Changes

**1. Tighten TTLs for the Live card (`src/hooks/useDeviceTelemetry.ts`)**
- `battery`: `12h` → `60s`
- `solar`: `1h` → `60s`
- `ev`: leave at `90s`
- Add a brief comment block above `TTL_MS` explaining why these are short (Live cockpit) and noting that downstream summary/history hooks that legitimately need longer caching should not import this map — they should define their own.

**2. Surface real sample time, not cache-write time**
- In `CachedTelemetry`, add `sample_at: string | null` alongside `cached_at`. Populate from the OEM payload when present:
  - Tesla: `payload.response.charge_state.timestamp` (battery) / `payload.energy_sites[0].timestamp` (solar)
  - Enphase: `payload.last_report_at` or `payload.read_at`
  - SolarEdge: `payload.lastUpdateTime`
  - Fallback to `cached_at` when no sample timestamp is provided.
- `LiveEnergyMonitoringCard.tsx` "UPDATED Nm AGO" pill: read from `sample_at ?? cached_at` (one-line change inside the existing pill — no visual redesign).

**3. Force-refresh on manual reload**
- The refresh button next to the "UPDATED" pill should call `refresh({ force: true })` for all three capabilities (battery, ev, solar). Verify it currently does; if not, wire it through. This already exists in `useTelemetry` — just confirm the button passes `force: true`.

**4. Tests**
- Add one unit test in `src/hooks/__tests__/useDeviceTelemetry.test.ts` (create file if absent) asserting:
  - Cached row older than 60s for `battery` is treated as stale (re-fetch attempted).
  - `sample_at` is preferred over `cached_at` when present in the payload.
- Existing 21 tests in `powerwallFlow.test.tsx` must still pass — none of these changes touch the visual component, so they will.

### Out of scope (explicit)

- No edits to `AnimatedEnergyFlow.tsx`. No edits to the visual layer of `LiveEnergyMonitoringCard.tsx` beyond the one-line timestamp source swap.
- No clean-slate rebuild — that's the next plan, written after you send the Tesla day-mode + EV-charging + Enphase Enlighten reference screenshots.
- No backend / Supabase schema changes. `device_telemetry_cache` row shape is unchanged; we just write more often.
- No hero asset generation yet.

### Success criteria

- Open Live card → Powerwall SOC matches Tesla app within ±1% (sampling jitter).
- "UPDATED Nm AGO" reflects the OEM's sample time, so a 12-minute-stale read reads "UPDATED 12M AGO" instead of "UPDATED 1M AGO".
- Refresh button pulls fresh values within ~2 seconds.

### Next plan (queued, not started)

Once you've sent the Tesla day-mode, Tesla EV-charging, and Enphase Enlighten reference screenshots, I'll write the **clean-slate ZenCasa visual rebuild** plan: hybrid AI-generated hero scenes now (day / dusk / night / EV-plugged / PW-discharging), thin floating labels, single animated glow stroke along the wire conduit, no perimeter node grid, no orbiting particles. Archive the current `AnimatedEnergyFlow.tsx` to `src/components/dashboard/archive/` rather than mutate it again.
