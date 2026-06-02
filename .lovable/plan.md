# Telemetry SSOT + Joseph Scan + Deason Diagnostics + Wallbox Indicator

Schema migration already approved and ran. The remaining work is code + memory.

## 1. SSOT module (new)
- **`src/lib/dataSourcePriority.ts`** — `pickSource(capability, profile, devices)` returning one `{provider, deviceId, reason}` for `solar | battery | charging | consumption`, plus `detectSolarConflict` / `detectChargingConflict` helpers used by Deason.
  - Solar: `solar_installer='tesla'` wins → Tesla. Else `solar_inverter_brand` (enphase/solaredge/tesla). Powerwall CTs NEVER used as solar source.
  - Battery: Powerwall > Enphase IQ Battery > SolarEdge Home Battery.
  - Charging: Tesla vehicle present → Tesla `charge_state` only. Else home charger (Wallbox/etc.).
  - Consumption: follows battery winner.
- **`supabase/functions/_shared/dataSourcePriority.ts`** — Deno-compatible copy.

## 2. Enforcement (light-touch, since current code already implements matching priorities)
- Add a header comment in `useDashboardData.ts`, `useEnergyLog.ts`, `mint-onchain/index.ts`, `generate-weekly-digest/index.ts` pointing at the SSOT module and forbidding cross-OEM summation.
- `useEnergyLog.ts` EV-charging tab: when a Tesla vehicle is connected, skip `home_charging_sessions` (prevents double-count if a Wallbox is added later for the same user).

## 3. Wallbox "live kW not available yet" indicator (user-requested this turn)
- Update `ChargerTile` inside `src/components/dashboard/ChargerOnlyLiveCard.tsx`:
  - Replace today's small paragraph with a compact info icon + tooltip / hint line: *"Live charging power not yet available for {oem}. Showing today's totals instead."*
  - Wallbox-specific copy when `provider === 'wallbox'`. Lightweight muted styling — not an error state.
  - Tile already used inside `SolarPlusCard` so it inherits the indicator automatically.

## 4. Onboarding — capture inverter brand
- New **`src/components/onboarding/InverterBrandScreen.tsx`** — shown only when `solar_installer === 'other'`. Options: Enphase, SolarEdge, Tesla inverter, Other/Unsure.
- Persist to `profiles.solar_inverter_brand` via `useProfile.updateProfile`.
- Wire into `src/pages/Onboarding.tsx` flow immediately after `SolarInstallerScreen` when user picked "other".
- Profile editing: extend `InstallerCard` with an inverter brand row using a select control (re-uses the same options). No new card.

## 5. Deason OEM discrepancy support
- New **`src/hooks/useOemDiagnostics.ts`** — runs on connected-devices change. Uses `detectSolarConflict` / `detectChargingConflict` + queries `energy_tokens.expires_at` and last-seen telemetry. Writes warn rows to the new `oem_diagnostic_log` table.
- New **`src/components/dashboard/OemDiagnosticsBanner.tsx`** — small chip beside Energy Sources card and inside ConnectAccounts that lists open diagnostics with friendly copy + reconnect deep link + "Ask Deason" CTA (`/deason?topic=oem`).
- Extend `supabase/functions/deason-chat/index.ts` (system context) with an injected block of open diagnostics so Deason can troubleshoot in-thread.

## 6. Joseph reference-scan documentation
- Findings written into `.lovable/memory/features/data-source-of-truth.md` under a new "Joseph reference account" section. Includes the SQL we ran, the three claimed devices, the discrepancy (`solar_installer` was NULL — now backfilled to `other`/`enphase`/`tesla_vehicle` via migration), and a re-scan snippet for any beta user.

## 7. Memory updates
- Rewrite **`.lovable/memory/features/data-source-of-truth.md`** with new user-preference-driven solar rule, Tesla-vehicle charging rule, Joseph scan section, and a pointer to `src/lib/dataSourcePriority.ts` as SSOT.
- New **`.lovable/memory/features/deason-oem-diagnostics.md`** — diagnostic catalog (token expired, scope missing, solar conflict, silent device), tone guide, table schema reference.
- Extend **`.lovable/memory/features/energy-log-kpi-parity.md`** with the Tesla-vehicle-wins charging skip rule.
- Append one-liner to **`.lovable/memory/index.md`** Core: *"ONE OEM per KPI. Tesla vehicle = sole charging source when connected. Solar source = user installer/inverter choice, never summed. Wallbox = totals only (no live kW yet)."*

## Out of scope
- No retroactive cleanup of `energy_production` rows.
- No new OEM integrations.
- No rewrite of dashboard tile layouts beyond the Wallbox indicator.

## Acceptance
- Joseph (already verified): charging=Tesla, solar=Enphase (now deterministic via migration), battery=Powerwall.
- Tschida (solar via Tesla install + Wallbox): charging=Wallbox totals (no fake live kW), solar=Tesla, no battery tile.
- Any user with expired Enphase token or solar conflict gets a Deason warn within one refresh + reconnect CTA.
- `grep` for `+ enphase.*solaredge` style summation returns nothing.
