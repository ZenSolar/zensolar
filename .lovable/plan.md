# Harden frontend for expired OEM tokens

## Root cause recap

The `tesla-data` edge function correctly returns `401 { error: "Token expired", needsReauth: true }` when Tesla rejects the stored refresh token. But the frontend mishandles it in two ways:

1. **Detection is unreliable.** `supabase.functions.invoke()` surfaces non-2xx as `error.message = "Edge Function returned a non-2xx status code"`. The string `needsReauth` / `Token expired` lives only in the response body, so our `errorMessage.includes('needsReauth')` checks in `useDashboardData.ts` and the matching checks in the Enphase / SolarEdge / Wallbox fetchers almost never match in production — the 401 falls into the generic `{ error: 'unknown' }` branch.
2. **No safety net.** Something downstream of the failed Tesla fetch throws (logged as `RUNTIME_ERROR` with `has_blank_screen: true`), and there's no error boundary around the live-energy subtree, so the whole dashboard goes blank instead of showing the existing reconnect CTA.

## What we'll build

### 1. New `parseFunctionInvokeError` helper (`src/lib/functionsInvokeError.ts`)
- Accepts the `error` returned from `supabase.functions.invoke`.
- When it's a `FunctionsHttpError`, read `context.response.clone().json()` and pull out `{ status, body }`.
- Return a normalized `{ status, needsReauth: boolean, rateLimited: boolean, body, raw }`.
- Falls back gracefully if the body isn't JSON.

### 2. Use the helper everywhere we call an OEM edge function
- `src/hooks/useDashboardData.ts` — `fetchTeslaData`, `fetchEnphaseData`, `fetchSolarEdgeData`, `fetchWallboxData`: replace the brittle `errorMessage.includes(...)` checks. Each returns `{ error: 'needs_reauth', needsReauth: true }` when the body says so, regardless of HTTP status text.
- `src/hooks/useDeviceTelemetry.ts` — `fetchFromOem`: today it swallows everything to `null`. Return `{ __reauth: true, provider }` instead when the helper reports `needsReauth`, and propagate that into the `CachedTelemetry` list so the live scene knows to render a reconnect tile rather than just "no data".

### 3. Surface per-provider reauth state from the dashboard hook
- `useDashboardData` already exposes `providerRefresh.tesla?.needsReauth`. Add the same field for `enphase`, `solaredge`, `wallbox` (Tesla CTA exists; just mirror the shape).
- Show one toast per provider per session via a small `useEffect` keyed on `sessionStorage`, so we don't spam on every poll.

### 4. Inline reconnect CTAs across all four providers
- The Tesla CTA in `ActivityMetrics.tsx` already exists. Extract it into a small reusable `<ProviderReauthCallout provider="tesla" />` component (`src/components/dashboard/ProviderReauthCallout.tsx`).
- Render one per affected provider above the energy flow card.
- Link target stays `/profile` (where Connect/Disconnect lives).

### 5. Error boundary around the live energy subtree
- New `src/components/dashboard/EnergyFlowErrorBoundary.tsx` (class component, no external deps).
- Wrap `<LiveEnergyMonitoringCard />` and the `EnergyFlowGlowCard` body in `ZenSolarDashboard.tsx` with it.
- Fallback UI: small card saying "Live energy flow temporarily unavailable" + the `<ProviderReauthCallout />` for any provider currently marked `needsReauth`, plus a "Reload section" button (re-mounts via key bump). Never blank-screens the dashboard again.

### 6. Telemetry
- Log `console.warn('[oem-reauth]', { provider, status })` once per provider per session so future occurrences are visible in console logs without needing the user to repro.

## Files touched

- **new** `src/lib/functionsInvokeError.ts`
- **new** `src/components/dashboard/ProviderReauthCallout.tsx`
- **new** `src/components/dashboard/EnergyFlowErrorBoundary.tsx`
- **edit** `src/hooks/useDashboardData.ts` — four fetchers + extended `providerRefresh` shape
- **edit** `src/hooks/useDeviceTelemetry.ts` — propagate `needsReauth`
- **edit** `src/components/dashboard/ActivityMetrics.tsx` — use the shared callout (no behavior change for Tesla path)
- **edit** `src/components/ZenSolarDashboard.tsx` — wrap energy-flow card in error boundary, render callouts for Enphase / SolarEdge / Wallbox

## Out of scope

- Edge function changes (the backend already returns the correct shape — the bug is purely in how the frontend interprets it).
- Auto-redirecting to the Tesla OAuth flow without user confirmation (would silently re-prompt OAuth; keeping it click-through via the existing `/profile` page).
- A new "Reconnect" page (the existing Profile → Integrations flow is fine).
