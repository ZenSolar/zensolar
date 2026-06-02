## One-off lifetime backfill — Michael Tschida

### Current state (verified)

- **Wallbox** (`device_id=586948`) — already populated. `lifetime_totals.charging_kwh = 6,837.54`, `total_sessions = 115`, baseline captured 2026-05-30. **No action.**
- **Enphase solar** (`device_id=3237318`, system "Michael Tschida") — `lifetime_totals = {}` (empty). Baseline captured 2026-06-02 with no solar_wh value.
- Cached Enphase token response (from `energy_tokens.extra_data.cached_response`, fetched 2026-06-02 17:15 UTC) reports `lifetime_wh = 42,140,660` (≈ 42.14 MWh) for system 3237318.

### Action (one-off, manual)

Run a single `UPDATE` on `connected_devices` for the Enphase row only:

```sql
UPDATE public.connected_devices
SET lifetime_totals = jsonb_build_object(
      'solar_wh', 42140660,
      'lifetime_solar_wh', 42140660,
      'source', 'one_off_backfill_from_enphase_cache_2026_06_02',
      'updated_at', now()
    ),
    updated_at = now()
WHERE id = '4a39aa9a-f3ae-4774-89c9-634704a51232'
  AND user_id = '2827d5b3-fbc6-4f3a-8369-ccc0116b6735'
  AND provider = 'enphase';
```

`baseline_data` is left untouched (no `solar_wh` key → treated as 0), so all 42,140.66 kWh shows up as **pending solar** in the KPI/EnergyFlow — matching SSOT reads in `useDashboardData.ts` (`extractSolarWh` / `lifetimeSolarWh`).

### Out of scope (explicitly NOT doing)

- No new edge function, no automated backfill job, no cron.
- No code changes to `useDashboardData`, `useEnergyLog`, or the admin panel.
- No change to Wallbox row (already correct).
- No baseline re-capture (would zero out pending).
- No backfill for any other user — Tschida only.

### Verification

After the update:
1. Re-query `connected_devices` for Tschida → Enphase row shows populated `lifetime_totals.solar_wh = 42140660`.
2. Loading his dashboard renders the rich `EnergyFlowScene` with solar lifetime ≈ 42.14 MWh and pending ≈ 42.14 MWh.
3. KPI tile (`useKpiContributions`) reflects the new Enphase contribution.

### Why this is a one-off and not a feature

The proper long-term mechanism — Enphase device sync materializing lifetime totals into `connected_devices` — already exists (`enphase-data` + `enphase-historical`). The cached token response shows the next regular sync will populate this naturally; this manual update just front-runs that for Tschida's reference account so his demo/investor view is correct *right now*.
