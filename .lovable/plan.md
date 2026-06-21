# Home & AC Charging — coverage + multi-home support (v2)

## Answer to your scenario first

**Today: no — those kWh would not land in your ZenSolar account.** The current pipeline only writes to `home_charging_sessions` when a paired charger (Wallbox, ChargePoint, or a Wi-Fi-linked Tesla Wall Connector) streams a session up through its cloud. Your new Wall Connector has no Wi-Fi and isn't linked to your Tesla account, so it produces zero telemetry. The Tesla vehicle itself *does* know it's charging (`charge_state.charging_state = "Charging"`, `charge_energy_added`, `fast_charger_present = false`) — we just don't currently treat that as a creditable source for home/AC charging.

The fix is to add a **vehicle-side AC fallback** and broaden the concept from "home" to **"Home & AC Charging"** — covering your unpaired Tesla Wall Connector, a friend's house, hotel L2, workplace, etc.

## What this plan changes

### 1. Rename "Home Charging" → "Home & AC Charging" everywhere

Single consistent label across every surface (per your call):
- Dashboard KPI tile + drill-in sheet
- Clean Energy Center section header
- `SilentChargingStatus` line: `● AC charging • accruing silently +X.X kWh` (with a location chip when known)
- `ReceiptDrawer` + `VerifyPoAContent` source line
- Mint history filter label
- Blog copy in `EVChargingCryptoEarnings.tsx`
- Onboarding + Profile strings
- KPI display label (DB key `home_charger_kwh` stays for stability)

DB table `home_charging_sessions` keeps its name (rename is too invasive); we add a `location_kind` column.

### 2. Vehicle-side AC fallback (the actual coverage fix)

A new Tesla poller branch — `tesla-vehicle-ac-session` — runs when the vehicle is plugged in and `fast_charger_present = false` AND no paired-charger session covers the same window.

- Open a `home_charging_sessions` row with `source = 'tesla_vehicle'`, `device_id = <VIN>`, `charger_power_kw` from `charger_power`, `location` reverse-geocoded from `drive_state.latitude/longitude`.
- Increment `total_session_kwh` from `charge_energy_added` deltas (idempotent via `last_charge_energy_added`; resets on new session).
- Close on `charging_state` leaving `Charging`/`Complete`.

Anti-double-count: `crossSourceOverlap` extended so a paired charger session always wins over vehicle telemetry for the same window (existing data-source-of-truth rule).

### 3. Friendly "Is this your new home?" prompt (your suggestion)

When the vehicle-side fallback opens its **first session at a lat/lon that doesn't match any saved home or known away location**, we surface a single, warm, non-blocking prompt — once per new location, never repeated:

> ⚡ **New charging location detected**
> Looks like you're charging somewhere new. Want to save it?
> [ Yes — Set as my Home ]   [ Temporary stay ]   [ Just AC away, ignore ]

Behavior per choice:
- **Yes — Set as my Home** → opens a tiny confirm sheet ("Name this home" prefilled with the city, e.g. "Austin home"), saves to `user_home_locations` as `is_primary = true` (auto-flips previous primary to non-primary, keeps it active for 30 days for straggler sessions).
- **Temporary stay** → saves as `is_active = true`, `location_kind = away_known`, label like "Stay near Austin (Jan 2026)". No "home" treatment.
- **Just AC away, ignore** → no save; future sessions at this lat/lon classify as `away_unverified`. kWh still credited.

Surface rules (calm by default, per loudness memory):
- Appears as an L2 banner at the top of the dashboard the next time the user opens the app, not as a takeover. Auto-dismisses after 12s if untouched; reappears next open until answered or the session ends. No sound, no haptic.
- Suppressed entirely if the user has Do-Not-Disturb / silent default enabled — the session still classifies (as `away_unverified`) and credits silently; the prompt waits.
- Dismissed state persisted per location fingerprint so we never re-ask for the same spot.

### 4. Location classification

`location_kind` enum on `home_charging_sessions`:
- `home_primary` — within current primary home radius
- `home_secondary` — within another active saved home (the move case)
- `away_known` — saved non-home location (work, friend, temp stay)
- `away_unverified` — anywhere else; still credited

Receipt chip: "AC · Home (new address)" / "AC · Away — Austin, TX." No mint-rate difference — kWh is kWh.

### 5. Multi-home addresses

New `user_home_locations` table:
- `label`, `lat`, `lon`, `radius_m` (default 150m)
- `is_primary` (exactly one true per user, enforced by partial unique index)
- `is_active` (false = archived; kept for historical attribution)
- timestamps + `archived_at`

Profile UI:
- "Home addresses" section: list, add (map picker or "use my current location"), mark primary, archive.
- During a move: tap "Add new home" → drop pin or use GPS → mark primary. Old address auto-flips to non-primary, stays active 30 days.
- "Is this your new home?" prompt writes here directly.

### 6. Your unpaired Tesla Wall Connector

Treated like AC anywhere until it gets Wi-Fi: vehicle-side fallback credits the kWh, the friendly prompt asks once if your new house should be saved as Home, receipt shows "AC · Home (new address) · via vehicle telemetry." When the Wall Connector eventually pairs over Wi-Fi, data-source-of-truth auto-prefers charger telemetry going forward; historical vehicle-sourced rows aren't rewritten.

## Files touched

**New**
- `supabase/migrations/<ts>_home_ac_charging.sql` — `location_kind` enum + column on `home_charging_sessions`, `user_home_locations` table + RLS + GRANTs, partial unique index for one primary.
- `src/hooks/useHomeLocations.ts`
- `src/hooks/useNewLocationPrompt.ts` — owns the "Is this your new home?" detection + dismissal state
- `src/components/profile/HomeAddressesSection.tsx`
- `src/components/dashboard/NewLocationPrompt.tsx` — the friendly L2 banner
- `supabase/functions/tesla-vehicle-ac-session/index.ts`
- `src/lib/locationClassifier.ts` + tests

**Edited**
- `src/hooks/useHomeChargingSessions.ts` — surface `location_kind`, label
- `src/hooks/useActiveChargingSessionV2.ts` — accept vehicle-sourced AC sessions
- `src/components/dashboard/SilentChargingStatus.tsx` — "AC charging" + location chip
- `src/components/proof/VerifyPoAContent.tsx`, `src/components/mint-history/ReceiptDrawer.tsx`, `src/components/proof/ReceiptSourceLines.tsx`
- KPI label strings in `useKpiContributions.ts`, `ActivityMetrics.tsx`, `KpiActivityLogSheet.tsx`, `CO2OffsetCard.tsx`, `ChargerOnlyLiveCard.tsx`, `RewardActions.tsx`, `MintTokenDialog.tsx`
- `src/components/energy-log/ChargingSessionList.tsx`, `ComingSoon.tsx`
- `src/pages/Onboarding.tsx`, `src/pages/Profile.tsx`, `src/pages/blog/EVChargingCryptoEarnings.tsx`
- `src/components/ZenSolarDashboard.tsx` — mount `NewLocationPrompt`
- `src/lib/crossSourceOverlap.ts` — paired charger > vehicle telemetry
- `src/lib/dataSourcePriority.ts` — add vehicle-AC tier
- `.lovable/memory/features/supercharger-mint.md` + new `home-ac-charging.md`
- `.lovable/memory/index.md`

## Phasing

- **Phase A (this PR)** — rename everywhere, add `location_kind` + `user_home_locations`, Profile multi-home UI, classifier. Visible immediately; no new telemetry yet.
- **Phase B (next)** — vehicle-side AC fallback edge function + "Is this your new home?" prompt + idempotency / overlap tests. This is the part that actually credits your current session at the new house.

Say the word if you'd rather ship A+B together.

## Out of scope

- Public L2 networks (ChargePoint public, EVgo L2) via their own APIs — vehicle fallback already covers them functionally.
- Different mint multiplier by location — kWh is kWh; supercharger REC matching is the only multiplier difference and doesn't apply to AC.
- Renaming the DB table `home_charging_sessions`.
