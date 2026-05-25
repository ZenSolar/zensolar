# Phase 2: Deason In-Chat Commerce (Stripe)

When Stripe payments are enabled, Deason becomes a conversational sales channel — recommending plans, add-ons, and upgrades inside chat, then completing checkout without the user leaving the conversation.

## Why this works
- Deason already knows the user's context (battery just added, panel upgrade, etc.)
- The assisted-purchase pattern is proven: Shopify, Klarna, and Intercom all ship AI-led checkout
- The analytics foundation is already wired (`deason_seeded_connection_success` is the same pattern as `deason_assisted_purchase`)

## Products Deason can sell
| Product | Trigger | Price (est.) |
|---------|---------|-------------|
| Battery Boost add-on | "I just added a battery" | $4/mo |
| Premium Analytics tier | "How do I earn more?" | $9.99/mo |
| Panel Expansion pack | "I want more panels" | One-time |
| Founders Pack (if still available) | "What's the best way to invest?" | $1,000 |
| Subscription annual (save 2 months) | "Can I pay yearly?" | $99/yr |

## Technical shape
- **Stripe Checkout** via payment link or `stripe.checkout.sessions.create` with `client_reference_id = user_id`
- **Metadata** on each session: `{ deason_recommended: true, product_sku, chat_thread_id }` for attribution
- **Webhook** (`checkout.session.completed`) → grant entitlement, fire `deason_assisted_purchase` analytics event
- **Refund guard** — if checkout fails or user cancels, Deason gracefully offers help instead of pushing again

## UX rules
- Deason only recommends in response to explicit user intent or clear contextual signal
- No hard-sell: one recommendation per conversation, max
- Price shown before checkout link (no surprise)
- Checkout opens in modal/overlay, not full redirect, so chat context is preserved

## Analytics events to add
- `deason_product_recommended` — which SKU, which trigger phrase
- `deason_checkout_started` — user clicked the payment link
- `deason_assisted_purchase` — webhook confirms payment (the key conversion metric)
- `deason_purchase_declined` — user said "no thanks" (train model on objections)

## Dependencies
- Stripe payments enabled (Lovable built-in, test mode first)
- Products + prices created in Stripe/Paddle catalog
- Webhook endpoint to handle `checkout.session.completed`

## Out of scope
- Deason does NOT store or see card numbers (Stripe hosted checkout handles all PCI)
- No in-chat subscription management (pause/cancel) — that stays in Settings for now

---

# Wire Enphase + SolarEdge batteries into the Battery Exported KPI

Today only Tesla Powerwall flows into `battery_discharge_wh`. We'll extend the existing `enphase-data` and `solaredge-data` edge functions so an Enphase IQ Battery or SolarEdge Home Battery pulls discharge data into the same KPI field — no schema changes needed.

## Why this works without DB changes

- The KPI hook (`useDashboardData` / `useKpiContributions`) already sums `connected_devices.lifetime_totals.battery_discharge_wh` across **all providers**.
- `mint-onchain` and `calculate-rewards` already read the same JSONB key provider-agnostically.
- So if we just write `lifetime_totals.battery_discharge_wh` for Enphase + SolarEdge devices the same way Tesla does, the KPI lights up automatically.

## What we'll build

### 1. Enphase battery pull (`supabase/functions/enphase-data/index.ts`)

For each Enphase system already in `connected_devices`:

- Detect a battery from the `/systems/{id}/summary` response (it includes `battery_count` / `battery_storage` on storage-equipped systems).
- If batteries exist, call `GET /systems/{id}/telemetry/battery` for the last 24h (`granularity=day`, `start_at=now-24h`).
- Sum the interval `discharge` values (Wh) → that's the day's discharge.
- Increment `lifetime_totals.battery_discharge_wh` by the new delta (dedup window stored in `extra_data.battery_last_sync_at` on `energy_tokens` so we never double-count if the function runs twice in the same window).
- Write a Proof-of-Delta™ row into `energy_production` with `data_type = 'battery'` (same hash chain pattern as the existing solar block).
- Rate-limit guard: if the battery endpoint returns 429, skip silently and keep the previous lifetime value — solar sync still succeeds.

### 2. SolarEdge battery pull (`supabase/functions/solaredge-data/index.ts`)

The `currentPowerFlow` response we already fetch tells us whether a STORAGE node exists. If yes:

- Call `GET /site/{siteId}/storageData?startTime=<lastSync>&endTime=<now>` (max 1 week per call per SolarEdge docs).
- Sum the `telemetries[].power` values where `power < 0` (discharge) over interval duration → Wh discharged in window.
- Add to `lifetime_totals.battery_discharge_wh` on the device row.
- Same Proof-of-Delta row + same `battery_last_sync_at` dedup marker stored in `energy_tokens.extra_data`.
- On 429 / 403, fall back to cached value.

### 3. KPI surface (no code change)

`useDashboardData` already does:
```
sum(connected_devices.lifetime_totals.battery_discharge_wh) across user's devices
```
So Battery Exported on the dashboard, the Proof-of-Genesis receipt, and the mint payload all pick up the new providers with zero frontend changes.

### 4. Memory + docs

Update `mem://features/energy-verification` to note that Enphase + SolarEdge now contribute to `battery_discharge_wh` and list the endpoints used.

## Files touched

- `supabase/functions/enphase-data/index.ts` — add `fetchAndStoreEnphaseBattery(systemId)` helper, call inside existing per-system loop.
- `supabase/functions/solaredge-data/index.ts` — add `fetchAndStoreSolarEdgeBattery(siteId)` helper, call after `powerFlow` if STORAGE node present.
- `.lovable/memory/features/energy-verification.md` — short note that battery KPI is now provider-agnostic.

## Out of scope (intentionally)

- No new tables / migrations — uses existing `lifetime_totals` JSONB + `energy_production` rows.
- No UI changes — KPI hook is already provider-agnostic.
- No backfill of historical battery data for already-connected users (we start counting from "now"). A separate `enphase-historical` / `solaredge-historical` battery backfill is a phase-2 follow-up if you want lifetime accuracy.
- Tesla path untouched.

## Risks

- **Rate limits**: Enphase's free tier is tight; adding one more call per sync per system. Mitigation: only call when system reports `battery_count > 0`, and respect existing 15-min cache.
- **SolarEdge `storageData` window**: capped at 1 week; first sync after a long gap may miss earlier discharge. Acceptable for forward-looking KPI; historical backfill can come later.
- **Double-counting**: Avoided via `battery_last_sync_at` marker — we only ingest the window since last sync.

Ready to implement on approval.
