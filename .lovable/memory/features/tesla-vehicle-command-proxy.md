---
name: Tesla Vehicle Command Proxy (Remix-launch requirement)
description: Production spec for the Tesla Vehicle Command HTTP Proxy + Virtual Key pairing — required for real HW3/HW4 Fleet Telemetry (AutopilotState) and any signed Tesla command. Execute on day 1 of Remix v2 build.
type: feature
---

# Tesla Vehicle Command Proxy — Production Spec

**Status:** SPEC LOCKED. Do NOT bolt onto legacy lab project. Execute on day 1 of the Remix v2 production build.

**Why it's required:** As of late 2024, Tesla rejects direct REST calls to `fleet_telemetry_config` (and all signed commands) for post-2021 vehicles with:
> "This endpoint must be called through the **Vehicle Command HTTP Proxy**."

Without it, `AutopilotState` never streams → FSD miles for HW3 vehicles fall back to inferred odometer deltas (error-prone). Also blocks future signed commands (wake, charge start, climate, lock).

---

## 1. Infrastructure (Option A — Tesla's official Go proxy)

Deploy `tesla-http-proxy` (Tesla's open-source Go binary) as a sidecar:

- **Host:** Fly.io or Railway, single small VM (~$5/mo). Region: us-west (lowest Tesla Fleet API latency).
- **Domain:** `tesla-proxy.zen.solar` (internal-only, mTLS or IP-allowlist to Supabase edge egress IPs).
- **TLS:** Let's Encrypt via Caddy in front, OR Tesla proxy's built-in TLS.
- **Secrets on host:**
  - `TESLA_COMMAND_PRIVATE_KEY` — EC P-256 PEM, mounted as file at `/keys/private-key.pem`
  - `TLS_CERT_PATH` / `TLS_KEY_PATH`
- **Health:** `/api/1/vehicles` proxied call returning 401 is OK (proxy itself is up).

Revisit Option B (Deno port of signing logic) only if proxy infra becomes a maintenance burden.

---

## 2. Tesla Developer prerequisites (one-time, manual)

Joe to complete in Tesla Developer Portal:

1. ✅ Partner app registered (client_id exists).
2. ⬜ Generate EC P-256 keypair:
   ```bash
   openssl ecparam -name prime256v1 -genkey -noout -out private-key.pem
   openssl ec -in private-key.pem -pubout -out public-key.pem
   ```
3. ⬜ Host `public-key.pem` at:
   `https://zen.solar/.well-known/appspecific/com.tesla.3p.public-key.pem`
   (Already present in repo at `public/.well-known/appspecific/` — REPLACE with new key on Remix launch.)
4. ⬜ POST to Tesla `/api/1/partner_accounts` register endpoint to bind public key to `zen.solar` domain.
5. ⬜ Store private key as Lovable runtime secret `TESLA_COMMAND_PRIVATE_KEY` AND deploy to proxy host.

---

## 3. App-side changes (Remix v2)

### New onboarding step: "Pair Virtual Key"
- Inserted into the 4-screen onboarding tour between "Connect Tesla" and "Home Charging Setup".
- One-tap deep link: `https://tesla.com/_ak/zen.solar` → opens Tesla app → user taps Approve.
- Post-pair: write `connected_devices.device_metadata.virtual_key_paired_at = now()`.
- Skip-allowed but with a warning ("FSD miles will use estimated mode until paired").

### Cockpit pairing indicator
- Pairing-status chip on each Tesla vehicle card in the Cockpit.
- If unpaired: red dot + "Pair Virtual Key" CTA that re-launches the deep link.

### Edge function changes
- `tesla-telemetry-config`: change `TESLA_API_BASE` → `https://tesla-proxy.zen.solar` (env var `TESLA_PROXY_URL`). Body/headers unchanged.
- All future signed-command functions (`tesla-wake`, `tesla-charge-start`, etc.) route through the proxy.
- Unsigned reads (`vehicle_data`, `vehicles` list) continue to hit Tesla Fleet API directly — proxy not required for reads.

### Backfill job
- One-shot `tesla-telemetry-config-backfill` edge function: iterates every `connected_devices` row where `provider='tesla'` AND `virtual_key_paired_at IS NOT NULL` AND `device_metadata.telemetry_config.ok != true`, re-runs registration through the proxy.
- Cron: nightly at 03:00 UTC for the first 30 days post-launch, then disable.

---

## 4. Storage / schema additions

Migration on Remix v2 (NOT on legacy):
```sql
-- device_metadata.virtual_key_paired_at: ISO timestamp string
-- device_metadata.virtual_key_pair_attempts: int
-- device_metadata.telemetry_config.proxy_url: string (audit trail)
```
No new columns — all in existing `device_metadata` JSONB.

Runtime secrets to add on Remix project:
- `TESLA_COMMAND_PRIVATE_KEY` (PEM string, used if we ever in-process sign)
- `TESLA_PROXY_URL` (e.g. `https://tesla-proxy.zen.solar`)
- `TESLA_PROXY_AUTH_TOKEN` (shared secret between edge functions and proxy host, if mTLS not used)

---

## 5. Effort & sequencing

| Step | Owner | Effort |
|---|---|---|
| Generate EC keypair + publish pubkey + register partner | Joe | 30 min |
| Stand up `tesla-http-proxy` on Fly.io | Lovable agent | 2 hr |
| `TESLA_PROXY_URL` rewire in `tesla-telemetry-config` | Lovable agent | 30 min |
| Virtual Key pairing onboarding step | Lovable agent | 3 hr |
| Cockpit pairing indicator + re-pair CTA | Lovable agent | 2 hr |
| Backfill job + cron | Lovable agent | 1 hr |
| **Total** | | **~1 day** |

---

## 6. Until Remix launches

- Legacy lab project keeps telemetry-gated inference DISABLED (current state).
- ZenX FSD miles will display 0 until real `AutopilotState` events arrive — this is correct and honest for investor demos.
- DO NOT spend more cycles trying to make `fleet_telemetry_config` work via direct REST on the lab project. It's a Tesla-side block, not a code bug.

---

## 7. Execution trigger

When user says "Remix is ready" / "starting the Remix build":
1. Read this spec.
2. Read `mem://features/remix-v2-decisions.md` for onboarding shape.
3. Execute steps 3.1 → 3.4 above as part of the v2 build, BEFORE the first end-to-end customer test.
