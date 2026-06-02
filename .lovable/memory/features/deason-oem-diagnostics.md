---
name: Deason OEM diagnostics
description: How Deason detects, surfaces, and helps troubleshoot OEM connection issues (expired tokens, conflicting sources, double-count risks)
type: feature
---

# Deason OEM diagnostics

When the user connects OEMs and a data conflict or missing-data issue is detected, Deason surfaces a calm, helpful message — never an error state.

## Diagnostic catalog

| key | severity | trigger |
|---|---|---|
| `oem_token_expired` | warn | `energy_tokens.expires_at < now()` |
| `solar_source_conflict` | info | `detectSolarConflict()` returns >1 provider — SSOT still picks one; user gets a heads-up |
| `charging_source_conflict` | info | Tesla vehicle AND a home charger claimed — Tesla wins, home charger suppressed |

## Pipeline

1. `useOemDiagnostics` hook runs on dashboard mount + after device claim/release.
2. Findings render in `OemDiagnosticsBanner` (used above dashboard and inside ConnectAccounts).
3. Each finding mirrored to `oem_diagnostic_log` (admin/editor/viewer visible) for team triage.
4. Banner CTAs: reconnect deep link (`/profile?reconnect=<provider>`) + "Ask Deason" (`/deason?topic=oem&provider=...`).
5. `deason-chat` edge function injects open diagnostics into system context so the assistant can troubleshoot in-thread with step-by-step guidance.

## Tone guide

- Calm, customer-service first. "We noticed…" not "ERROR:".
- Always explain *why* it matters in one sentence ("so kWh never get counted twice").
- Always offer one clear next action.
- Never blame the user.
