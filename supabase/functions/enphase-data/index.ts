import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getPreviousProof as sharedGetPreviousProof,
  buildProofMetadata,
  snapshotDelta,
  resolveCumulativeAnchor,
} from "../_shared/proofDelta.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-target-user-id",
};

const ENPHASE_API_BASE = "https://api.enphaseenergy.com/api/v4";

// ── Cryptographic Helpers (Proof-of-Delta) ──────────────────────────────────

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function buildEnergyHash(deviceId: string, timestamp: string, value: number, prevHash: string): Promise<string> {
  return sha256Hex(`${deviceId}|${timestamp}|${value}|${prevHash}`);
}

// Prev-value resolution now reads proof_metadata.value (cumulative snapshot)
// with a legacy fallback to production_wh. See _shared/proofDelta.ts.
async function getPreviousProof(supabaseClient: any, deviceId: string, dataType: string, userId: string, provider: string = "enphase") {
  return await sharedGetPreviousProof(supabaseClient, deviceId, provider, dataType, userId);
}

const ENPHASE_TOKEN_URL = "https://api.enphaseenergy.com/oauth/token";

// Helper to refresh Enphase token
async function refreshEnphaseToken(
  supabaseClient: any,
  userId: string,
  refreshToken: string
): Promise<string | null> {
  const clientId = Deno.env.get("ENPHASE_CLIENT_ID");
  const clientSecret = Deno.env.get("ENPHASE_CLIENT_SECRET");

  if (!clientId || !clientSecret || !refreshToken) {
    console.error("Missing Enphase credentials for refresh");
    return null;
  }

  try {
    const credentials = btoa(`${clientId}:${clientSecret}`);
    const tokenUrl = new URL(ENPHASE_TOKEN_URL);
    tokenUrl.searchParams.set("grant_type", "refresh_token");
    tokenUrl.searchParams.set("refresh_token", refreshToken);

    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: "POST",
      headers: { "Authorization": `Basic ${credentials}` },
    });

    if (!tokenResponse.ok) {
      console.error("Enphase token refresh failed:", await tokenResponse.text());
      return null;
    }

    const tokens = await tokenResponse.json();
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    // Update tokens in database
    await supabaseClient
      .from("energy_tokens")
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || refreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", "enphase");

    console.log("Enphase token refreshed successfully");
    return tokens.access_token;
  } catch (error) {
    console.error("Enphase token refresh error:", error);
    return null;
  }
}

// Cache duration in minutes - Enphase Watt plan has very limited API calls
const CACHE_DURATION_MINUTES = 15;

// Recalculate pending_solar_wh from current baselines to avoid stale post-mint values
async function recalcPendingFromBaselines(
  supabaseClient: any,
  userId: string,
  cachedResponse: Record<string, unknown>
): Promise<Record<string, unknown>> {
  try {
    const { data: devices } = await supabaseClient
      .from("connected_devices")
      .select("device_id, lifetime_totals, baseline_data")
      .eq("user_id", userId)
      .eq("provider", "enphase");

    if (!devices || devices.length === 0) return cachedResponse;

    let recalcPending = 0;
    for (const dev of devices) {
      const lt = (dev.lifetime_totals as Record<string, number>) || {};
      const bl = (dev.baseline_data as Record<string, number>) || {};
      const lifetimeWh = lt.solar_wh || lt.lifetime_solar_wh || 0;
      const baselineWh = bl.solar_wh || bl.solar_production_wh || 0;
      recalcPending += Math.max(0, lifetimeWh - baselineWh);
    }

    const cachedTotals = (cachedResponse.totals as Record<string, unknown>) || {};
    const oldPending = cachedTotals.pending_solar_wh;
    if (oldPending !== recalcPending) {
      console.log(`Recalculated pending from baselines: ${recalcPending} Wh (cached was ${oldPending})`);
    }
    return {
      ...cachedResponse,
      totals: { ...cachedTotals, pending_solar_wh: recalcPending },
    };
  } catch (err) {
    console.error("Failed to recalculate pending from baselines:", err);
    return cachedResponse;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bearer = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const targetUserIdHeader = req.headers.get("X-Target-User-Id");
    let targetUserId: string | null = null;

    // Cron/service-role bypass: allow enphase-data-cron to sync any user.
    if (serviceRoleKey && bearer === serviceRoleKey && targetUserIdHeader) {
      targetUserId = targetUserIdHeader;
      console.log(`[enphase-data] service-role cron sync for user ${targetUserId}`);
    } else {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(bearer);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targetUserId = user.id;

      if (targetUserIdHeader && targetUserIdHeader !== user.id) {
        const { data: isAdmin } = await supabaseClient.rpc('is_admin', { _user_id: user.id });
        if (!isAdmin) {
          console.log(`User ${user.id} attempted admin override but is not admin`);
          return new Response(JSON.stringify({ error: "Admin access required" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        targetUserId = targetUserIdHeader;
        console.log(`Admin ${user.id} syncing Enphase data for user ${targetUserId}`);
      }
    }


    const apiKey = Deno.env.get("ENPHASE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Enphase API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's Enphase tokens with cached data
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("energy_tokens")
      .select("*")
      .eq("user_id", targetUserId)
      .eq("provider", "enphase")
      .single();

    if (tokenError || !tokenData) {
      console.error("No Enphase tokens found:", tokenError);
      return new Response(JSON.stringify({ error: "Enphase not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let telemetryReq: { mode?: string; capability?: string; siteId?: string; force?: boolean } = {};
    if (req.method === "POST") {
      try { telemetryReq = await req.clone().json(); } catch { /* no body */ }
    }

    // Check if we have cached data that's still fresh. Telemetry requests must bypass
    // this heavy-sync cache so the live card can call Enphase summary directly.
    const extraData = tokenData.extra_data as Record<string, unknown> || {};
    const cachedData = extraData.cached_response as Record<string, unknown> | undefined;
    const cachedAt = extraData.cached_at as string | undefined;
    
    // `force: true` = deliberate manual run; skip the 15-minute sync cache.
    if (telemetryReq.mode !== "telemetry" && telemetryReq.force !== true && cachedData && cachedAt) {
      const cacheAge = Date.now() - new Date(cachedAt).getTime();
      const cacheMaxAge = CACHE_DURATION_MINUTES * 60 * 1000;
      
      if (cacheAge < cacheMaxAge) {
        console.log(`Returning cached Enphase data (${Math.round(cacheAge / 1000)}s old)`);
        const correctedData = await recalcPendingFromBaselines(supabaseClient, targetUserId, cachedData);
        return new Response(JSON.stringify({
          ...correctedData,
          cached: true,
          cache_age_seconds: Math.round(cacheAge / 1000),
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let accessToken = tokenData.access_token;

    // Check if token is expired and refresh if needed
    if (tokenData.expires_at) {
      const expiresAt = new Date(tokenData.expires_at);
      const now = new Date();
      // Refresh if expired or expiring in next 5 minutes
      if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
        console.log("Enphase token expired or expiring soon, refreshing...");
        const newToken = await refreshEnphaseToken(
          supabaseClient,
          targetUserId,
          tokenData.refresh_token
        );
        if (newToken) {
          accessToken = newToken;
        } else {
          return new Response(JSON.stringify({ 
            error: "Token expired", 
            needsReauth: true 
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // ── Lightweight telemetry mode (Premium Energy Insights live card) ──────
    // Body: { mode: 'telemetry', capability: 'solar', siteId }
    //
    // Enphase `/summary` returns `current_power` but that field only refreshes
    // every ~15 min and frequently reports 0 between updates. To match what the
    // Enphase app itself shows for "producing now", we prefer the 5-min
    // production_micro telemetry and fall back to summary on failure.
    if (telemetryReq.mode === "telemetry" && telemetryReq.siteId && telemetryReq.capability === "solar") {
      const systemId = String(telemetryReq.siteId);
      try {
        // 1) Summary — authoritative for today / lifetime totals.
        const sumResp = await fetch(
          `${ENPHASE_API_BASE}/systems/${systemId}/summary?key=${apiKey}`,
          { headers: { "Authorization": `Bearer ${accessToken}` } }
        );
        if (!sumResp.ok) {
          return new Response(JSON.stringify({ error: "summary_failed", status: sumResp.status }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const s = await sumResp.json();

        // 2) Fresher current_power via 5-min production_micro (90 min window —
        //    the endpoint lags 15-30 min, so a 30 min window is routinely empty).
        const summaryPowerW = Number(s?.current_power || 0);
        const energyTodayWh = Number(s?.energy_today || 0);
        let currentPowerW = summaryPowerW;
        let powerSource = "summary_current_power";
        let sampleAtIso: string | null = s?.last_report_at
          ? new Date(Number(s.last_report_at) * 1000).toISOString()
          : null;
        let microWindowEmpty = false;
        try {
          const startAt = Math.floor(Date.now() / 1000) - 90 * 60;
          const microResp = await fetch(
            `${ENPHASE_API_BASE}/systems/${systemId}/telemetry/production_micro?key=${apiKey}&granularity=5mins&start_at=${startAt}`,
            { headers: { "Authorization": `Bearer ${accessToken}` } }
          );
          if (microResp.ok) {
            const micro = await microResp.json();
            const intervals: any[] = Array.isArray(micro?.intervals) ? micro.intervals : [];
            // Last interval with enwh > 0 → avg watts = enwh * (3600 / 300) = enwh * 12.
            for (let i = intervals.length - 1; i >= 0; i--) {
              const iv = intervals[i];
              const enwh = Number(iv?.enwh ?? 0);
              if (enwh > 0) {
                currentPowerW = Math.round(enwh * 12);
                powerSource = "production_micro";
                const endAt = Number(iv?.end_at);
                if (Number.isFinite(endAt)) sampleAtIso = new Date(endAt * 1000).toISOString();
                break;
              }
            }
            // An all-zero window is NOT proof of "no production" — this endpoint
            // lags and returns empty/zero windows on some plan tiers. Record it
            // and let the counter-delta below arbitrate.
            microWindowEmpty =
              intervals.length === 0 ||
              intervals.every((iv) => Number(iv?.enwh ?? 0) === 0);
          } else {
            console.warn(`enphase production_micro failed (${microResp.status}) for system ${systemId} — falling back to summary current_power`);
          }
        } catch (microErr) {
          console.warn("enphase production_micro error, falling back to summary:", microErr);
        }

        // 3) Counter-delta fallback. `energy_today` is a monotonic within-day
        //    counter; its movement since the last cached read is the most honest
        //    "producing now" signal when both instantaneous sources read zero.
        if (currentPowerW <= 0) {
          try {
            const { data: prevCache } = await supabaseClient
              .from("device_telemetry_cache")
              .select("payload, cached_at")
              .eq("user_id", targetUserId)
              .eq("provider", "enphase")
              .eq("capability", "solar")
              .eq("device_id", systemId)
              .maybeSingle();

            const prevWh = Number(prevCache?.payload?.energy_today_wh ?? NaN);
            const prevAt = prevCache?.cached_at ? new Date(prevCache.cached_at).getTime() : NaN;
            const elapsedH = (Date.now() - prevAt) / 3_600_000;
            if (
              Number.isFinite(prevWh) &&
              Number.isFinite(prevAt) &&
              elapsedH >= 5 / 60 && elapsedH <= 2 &&
              energyTodayWh > prevWh
            ) {
              currentPowerW = Math.round((energyTodayWh - prevWh) / elapsedH);
              powerSource = "energy_today_delta";
              sampleAtIso = new Date().toISOString();
            } else if (microWindowEmpty && summaryPowerW <= 0) {
              powerSource = "unknown_lagging_feed";
            }
          } catch (deltaErr) {
            console.warn("enphase counter-delta fallback failed:", deltaErr);
          }
        }

        return new Response(JSON.stringify({
          current_power_w: currentPowerW,
          power_source: powerSource,
          // True when every instantaneous source was silent — the UI should say
          // "waiting on inverter report", not render a confident 0 kW.
          power_unknown: powerSource === "unknown_lagging_feed",
          energy_today_wh: energyTodayWh,
          energy_lifetime_wh: Number(s?.energy_lifetime || 0),
          last_report_at: sampleAtIso ?? s?.last_report_at,
          status: s?.status,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      } catch (e) {
        console.error("enphase telemetry error", e);
        return new Response(JSON.stringify({ error: "telemetry_exception" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }




    // Prefer using already-known system IDs from connected_devices to reduce API calls.
    // This avoids the expensive /systems call (which is the most likely to hit rate limits).
    const { data: enphaseDevices, error: enphaseDevicesError } = await supabaseClient
      .from("connected_devices")
      .select("id, device_id, device_name, baseline_data, lifetime_totals")
      .eq("user_id", targetUserId)
      .eq("provider", "enphase");

    if (enphaseDevicesError) {
      console.error("Failed to fetch connected Enphase devices:", enphaseDevicesError);
    }

    const deviceBySystemId = new Map<string, any>();
    for (const d of enphaseDevices ?? []) {
      deviceBySystemId.set(String(d.device_id), d);
    }

    // Build systems list to fetch
    let systemsToFetch: Array<{ system_id: string; name: string }> = [];
    if (enphaseDevices && enphaseDevices.length > 0) {
      systemsToFetch = enphaseDevices.map((d: any) => ({
        system_id: String(d.device_id),
        name: d.device_name || "Enphase System",
      }));
    } else {
      // Fallback: if connected_devices isn't populated for some reason, fall back to /systems.
      const systemsResponse = await fetch(`${ENPHASE_API_BASE}/systems?key=${apiKey}`, {
        headers: { "Authorization": `Bearer ${accessToken}` },
      });

      if (!systemsResponse.ok) {
        const errorText = await systemsResponse.text();
        console.error("Failed to fetch Enphase systems:", errorText);

        // If rate limited, return cached data if available
        if (systemsResponse.status === 429 && cachedData) {
          console.log("Rate limited, returning stale cached data");
          const correctedData = await recalcPendingFromBaselines(supabaseClient, targetUserId, cachedData);
          return new Response(JSON.stringify({
            ...correctedData,
            cached: true,
            stale: true,
            rate_limited: true,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // If rate limited and no cache, try to get data from connected_devices table
        if (systemsResponse.status === 429) {
          console.log("Rate limited, no cache - checking connected_devices for fallback data");
          const { data: devices } = await supabaseClient
            .from("connected_devices")
            .select("lifetime_totals, baseline_data, device_name")
            .eq("user_id", targetUserId)
            .eq("provider", "enphase");

          if (devices && devices.length > 0) {
            let totalLifetimeSolarWh = 0;
            let totalPendingSolarWh = 0;
            let systemName = "Enphase System";

            for (const device of devices) {
              const lifetime = (device.lifetime_totals as Record<string, number>) || {};
              const baseline = (device.baseline_data as Record<string, number>) || {};
              const solarWh = lifetime.solar_wh || lifetime.lifetime_solar_wh || 0;
              const baselineWh = baseline.solar_wh || baseline.solar_production_wh || 0;
              totalLifetimeSolarWh += solarWh;
              totalPendingSolarWh += Math.max(0, solarWh - baselineWh);
              if (device.device_name) systemName = device.device_name;
            }

            console.log("Returning fallback data from connected_devices:", { totalLifetimeSolarWh, totalPendingSolarWh });
            return new Response(JSON.stringify({
              systems: [{ system_id: "fallback", name: systemName }],
              totals: {
                lifetime_solar_wh: totalLifetimeSolarWh,
                pending_solar_wh: totalPendingSolarWh,
              },
              cached: true,
              stale: true,
              rate_limited: true,
              fallback: true,
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        return new Response(JSON.stringify({ error: "Failed to fetch systems. Please try again." }), {
          status: systemsResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const systemsData = await systemsResponse.json();
      console.log("Enphase systems:", JSON.stringify(systemsData));

      if (!systemsData.systems || systemsData.systems.length === 0) {
        return new Response(JSON.stringify({
          systems: [],
          message: "No Enphase systems found",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Keep it simple: fetch the first system if we had to fall back to /systems
      systemsToFetch = [{
        system_id: String(systemsData.systems[0].system_id),
        name: String(systemsData.systems[0].name || "Enphase System"),
      }];
    }

    let totalLifetimeWh = 0;
    let totalPendingWh = 0;
    let totalEnergyTodayWh = 0;
    let rateLimited = false;
    const perSystem: Array<{ system_id: string; name: string; lifetime_wh: number; pending_wh: number; energy_today_wh: number }> = [];

    for (const system of systemsToFetch) {
      const systemId = system.system_id;

      const summaryResponse = await fetch(
        `${ENPHASE_API_BASE}/systems/${systemId}/summary?key=${apiKey}`,
        { headers: { "Authorization": `Bearer ${accessToken}` } }
      );

      if (summaryResponse.status === 429) {
        rateLimited = true;
        console.warn(`Enphase rate limited fetching summary for system ${systemId}`);
        continue;
      }

      if (!summaryResponse.ok) {
        console.error(`Failed to fetch Enphase summary for system ${systemId}:`, await summaryResponse.text());
        continue;
      }

      const summaryData = await summaryResponse.json();
      const lifetimeEnergyWh = Number(summaryData?.energy_lifetime || 0);
      const energyTodayWh = Number(summaryData?.energy_today || 0);

      // Baseline is stored in connected_devices
      const deviceRow = deviceBySystemId.get(String(systemId));
      const baseline = (deviceRow?.baseline_data as Record<string, any> | null) ?? {};
      const baselineSolarWh = Number(
        baseline.solar_wh || baseline.solar_production_wh || baseline.total_solar_produced_wh || baseline.lifetime_solar_wh || 0
      );
      const pendingSolarWh = Math.max(0, lifetimeEnergyWh - baselineSolarWh);

      totalLifetimeWh += lifetimeEnergyWh;
      totalPendingWh += pendingSolarWh;
      totalEnergyTodayWh += energyTodayWh;
      perSystem.push({
        system_id: systemId,
        name: system.name,
        lifetime_wh: lifetimeEnergyWh,
        pending_wh: pendingSolarWh,
        energy_today_wh: energyTodayWh,
      });

      // Store production data with Proof-of-Delta cryptographic verification.
      // MINT SOURCE = `energy_lifetime` ONLY. It is monotonically cumulative,
      // so a delta between two readings is always genuine new production.
      // `energy_today` resets at local midnight and is therefore DISPLAY-ONLY —
      // never an issuance source.
      if (lifetimeEnergyWh > 0) {
        const now = new Date();
        const recordedAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).toISOString();
        const tsNow = now.toISOString();
        const devId = String(systemId);
        const prev = await getPreviousProof(supabaseClient, devId, "solar", targetUserId);
        const bucketStart = await resolveCumulativeAnchor(supabaseClient, {
          userId: targetUserId,
          deviceId: devId,
          provider: "enphase",
          dataType: "solar",
          recordedAt,
          prev,
          currentValue: lifetimeEnergyWh,
        });
        const delta = snapshotDelta(lifetimeEnergyWh, bucketStart);
        const hash = await buildEnergyHash(devId, tsNow, lifetimeEnergyWh, prev.prevHash);
        console.log(`[Proof-of-Delta] Enphase solar ${devId}: lifetime=${lifetimeEnergyWh} Wh, bucket_start=${bucketStart}, delta=${delta} Wh (today=${energyTodayWh} Wh display-only)`);

        await supabaseClient
          .from("energy_production")
          .upsert({
            user_id: targetUserId,
            device_id: devId,
            provider: "enphase",
            production_wh: delta,
            data_type: "solar",
            recorded_at: recordedAt,
            proof_metadata: buildProofMetadata({
              hash,
              prevHash: prev.prevHash,
              deviceId: devId,
              value: lifetimeEnergyWh,
              prevValue: prev.prevValue,
              delta,
              dataType: "solar",
              timestamp: tsNow,
              unit: "wh",
              valueSemantics: "cumulative_snapshot",
              extra: {
                bucket_start_value: bucketStart,
                source: "enphase_summary_energy_lifetime",
                energy_today_wh_display_only: energyTodayWh,
              },
            }),
          }, { onConflict: "device_id,provider,recorded_at,data_type" });
      }


      // Persist lifetime totals so the dashboard can still show values when rate limited later.
      if (lifetimeEnergyWh > 0) {
        await supabaseClient
          .from("connected_devices")
          .update({
            lifetime_totals: {
              solar_wh: lifetimeEnergyWh,
              lifetime_solar_wh: lifetimeEnergyWh,
              updated_at: new Date().toISOString(),
            },
          })
          .eq("user_id", targetUserId)
          .eq("device_id", String(systemId))
          .eq("provider", "enphase");
      }

      // ── Battery (IQ Battery / Encharge) ────────────────────────────────────
      // Only call telemetry/battery if summary indicates a battery is present
      // (avoids burning the rate-limit budget on solar-only sites).
      const batteryCount = Number(
        summaryData?.battery_count ?? summaryData?.battery_storage?.count ?? 0
      );
      const hadBatteryBefore = Number(
        (deviceRow?.lifetime_totals as any)?.battery_discharge_wh ?? 0
      ) > 0;
      if (batteryCount > 0 || hadBatteryBefore) {
        try {
          // Incremental window: since last battery sync (or last 24h on first run).
          const lastBattSync = (extraData.battery_last_sync_at as string | undefined);
          const sinceMs = lastBattSync
            ? new Date(lastBattSync).getTime()
            : Date.now() - 24 * 60 * 60 * 1000;
          const startAt = Math.floor(sinceMs / 1000);
          const battResp = await fetch(
            `${ENPHASE_API_BASE}/systems/${systemId}/telemetry/battery?key=${apiKey}&granularity=day&start_at=${startAt}`,
            { headers: { "Authorization": `Bearer ${accessToken}` } }
          );
          if (battResp.ok) {
            const battJson = await battResp.json();
            const intervals = battJson?.intervals || [];
            let windowDischargeWh = 0;
            for (const iv of intervals) {
              windowDischargeWh += Number(iv?.discharge ?? 0);
            }
            const prevLifetime = Number(
              (deviceRow?.lifetime_totals as any)?.battery_discharge_wh ?? 0
            );
            const newLifetime = prevLifetime + windowDischargeWh;
            console.log(`[Enphase battery] system ${systemId}: +${windowDischargeWh} Wh this window → lifetime ${newLifetime} Wh`);

            if (windowDischargeWh > 0) {
              // Proof-of-Delta row. `newLifetime` is a cumulative accumulator,
              // so production_wh carries only the delta for this hourly bucket.
              const now = new Date();
              const recordedAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).toISOString();
              const tsNow = now.toISOString();
              const devId = String(systemId);
              const prev = await getPreviousProof(supabaseClient, devId, "battery", targetUserId);
              const bucketStart = await resolveCumulativeAnchor(supabaseClient, {
                userId: targetUserId,
                deviceId: devId,
                provider: "enphase",
                dataType: "battery",
                recordedAt,
                prev,
                currentValue: newLifetime,
              });
              const battDelta = snapshotDelta(newLifetime, bucketStart);
              const battHash = await buildEnergyHash(devId, tsNow, newLifetime, prev.prevHash);
              await supabaseClient
                .from("energy_production")
                .upsert({
                  user_id: targetUserId,
                  device_id: devId,
                  provider: "enphase",
                  production_wh: battDelta,
                  data_type: "battery",
                  recorded_at: recordedAt,
                  proof_metadata: buildProofMetadata({
                    hash: battHash,
                    prevHash: prev.prevHash,
                    deviceId: devId,
                    value: newLifetime,
                    prevValue: prev.prevValue,
                    delta: battDelta,
                    dataType: "battery",
                    timestamp: tsNow,
                    unit: "wh",
                    valueSemantics: "cumulative_snapshot",
                    extra: { bucket_start_value: bucketStart, window_discharge_wh: windowDischargeWh },
                  }),
                }, { onConflict: "device_id,provider,recorded_at,data_type" });
            }


            // Merge battery total into lifetime_totals (preserve solar)
            await supabaseClient
              .from("connected_devices")
              .update({
                lifetime_totals: {
                  solar_wh: lifetimeEnergyWh,
                  lifetime_solar_wh: lifetimeEnergyWh,
                  battery_discharge_wh: newLifetime,
                  lifetime_battery_discharge_wh: newLifetime,
                  updated_at: new Date().toISOString(),
                },
              })
              .eq("user_id", targetUserId)
              .eq("device_id", String(systemId))
              .eq("provider", "enphase");

            // Persist marker so next sync only ingests new intervals
            extraData.battery_last_sync_at = new Date().toISOString();
          } else if (battResp.status === 429) {
            console.warn(`Enphase battery telemetry rate limited for system ${systemId}; will retry next sync.`);
          } else {
            console.warn(`Enphase battery telemetry fetch failed (${battResp.status}) for system ${systemId}`);
          }
        } catch (err) {
          console.warn(`Enphase battery telemetry error for system ${systemId}:`, err);
        }
      }

      // --- Historical backfill verification ---
      // Check if this user has sufficient historical data. If not, trigger backfill.
      // This is a self-healing mechanism: if the initial backfill failed or was incomplete,
      // the next dashboard sync will automatically retry it.
      if (lifetimeEnergyWh > 0) {
        const { count: histRecordCount } = await supabaseClient
          .from("energy_production")
          .select("id", { count: "exact", head: true })
          .eq("user_id", targetUserId)
          .eq("device_id", String(systemId))
          .eq("provider", "enphase")
          .eq("data_type", "solar");

        // If the user has lifetime production but fewer than 30 historical records,
        // their backfill likely failed. Trigger it in the background.
        const MIN_EXPECTED_RECORDS = 30;
        if ((histRecordCount ?? 0) < MIN_EXPECTED_RECORDS) {
          console.log(`[Backfill Check] User ${targetUserId} system ${systemId}: only ${histRecordCount} records, expected ${MIN_EXPECTED_RECORDS}+. Triggering historical backfill...`);
          
          // Fire-and-forget: call enphase-historical via internal HTTP
          const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
          const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
          fetch(`${supabaseUrl}/functions/v1/enphase-historical`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceRoleKey}`,
              "X-Target-User-Id": targetUserId,
            },
            body: JSON.stringify({ user_id: targetUserId }),
          }).then(async (res) => {
            if (res.ok) {
              const result = await res.json();
              console.log(`[Backfill Check] Historical backfill completed for user ${targetUserId}: ${result.total_days_imported} days imported`);
            } else {
              const errText = await res.text();
              console.error(`[Backfill Check] Historical backfill failed for user ${targetUserId}: ${res.status} ${errText}`);
            }
          }).catch((err) => {
            console.error(`[Backfill Check] Historical backfill error for user ${targetUserId}:`, err);
          });
        }
      }
    }

    // If we couldn't fetch anything and we're rate-limited, fall back to cached/DB values.
    if (perSystem.length === 0) {
      if (cachedData) {
        console.log("Enphase rate limited, returning cached data");
        const correctedData = await recalcPendingFromBaselines(supabaseClient, targetUserId, cachedData);
        return new Response(JSON.stringify({
          ...correctedData,
          cached: true,
          stale: true,
          rate_limited: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // No cache; attempt DB fallback
      const { data: devices } = await supabaseClient
        .from("connected_devices")
        .select("lifetime_totals, baseline_data, device_name")
        .eq("user_id", targetUserId)
        .eq("provider", "enphase");

      if (devices && devices.length > 0) {
        let totalLifetimeSolarWh = 0;
        let totalPendingSolarWh = 0;
        let systemName = "Enphase System";

        for (const device of devices) {
          const lifetime = (device.lifetime_totals as Record<string, number>) || {};
          const baseline = (device.baseline_data as Record<string, number>) || {};
          const solarWh = lifetime.solar_wh || lifetime.lifetime_solar_wh || 0;
          const baselineWh = baseline.solar_wh || baseline.solar_production_wh || 0;
          totalLifetimeSolarWh += solarWh;
          totalPendingSolarWh += Math.max(0, solarWh - baselineWh);
          if (device.device_name) systemName = device.device_name;
        }

        console.log("Returning fallback data from connected_devices:", { totalLifetimeSolarWh, totalPendingSolarWh });
        return new Response(JSON.stringify({
          systems: [{ system_id: "fallback", name: systemName }],
          totals: {
            lifetime_solar_wh: totalLifetimeSolarWh,
            pending_solar_wh: totalPendingSolarWh,
          },
          cached: true,
          stale: true,
          rate_limited: true,
          fallback: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const responseData = {
      systems: systemsToFetch,
      per_system: perSystem,
      totals: {
        lifetime_solar_wh: totalLifetimeWh,
        pending_solar_wh: totalPendingWh,
        energy_today_wh: totalEnergyTodayWh,
      },
      rate_limited: rateLimited,
    };
    
    // Cache the response for future requests
    await supabaseClient
      .from("energy_tokens")
      .update({
        extra_data: {
          ...extraData,
          cached_response: responseData,
          cached_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", targetUserId)
      .eq("provider", "enphase");
    
    console.log("Cached Enphase data for future requests");
    
    return new Response(JSON.stringify({
      ...responseData,
      cached: false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Enphase data error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch energy data. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
