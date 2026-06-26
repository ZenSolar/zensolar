// tesla-telemetry-webhook — receives Tesla Fleet Telemetry stream events.
//
// IMPORTANT: this function runs with verify_jwt = false because Tesla cannot
// present a Supabase JWT. Authenticity is established by validating Tesla's
// JWS signature on the payload (see verifyTeslaSignature).
//
// For each batch of events per VIN we:
//   1. Walk events in timestamp order, maintaining an in-DB accumulator on
//      connected_devices.last_known_state.fsd_accumulator.
//   2. When AutopilotState is engaged AND Gear=D, credit the odometer delta
//      to supervised_miles (Tesla currently exposes no L4/unsupervised flag,
//      so unsupervised_miles stays 0).
//   3. Reject per-event deltas > 5 miles as glitches.
//   4. Write a single cumulative `data_type='fsd_miles'` row to
//      energy_production with full Proof-of-Delta metadata
//      (prevHash → snapshotHash), matching the ev_miles pattern.
//   5. Update lifetime_totals.lifetime_fsd_miles + last_known_state.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-tesla-signature, x-tesla-timestamp",
};

const ENGAGED_STATES = new Set([
  "Active", "Engaged", "FullSelfDriving", "Autosteer", "TrafficAwareCruiseControl",
]);
const MAX_PER_EVENT_DELTA_MI = 5;

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function buildEnergyHash(deviceId: string, ts: string, value: number, prev: string) {
  return sha256Hex(`${deviceId}|${ts}|${value}|${prev}`);
}

/**
 * Validate Tesla's JWS signature header.
 *
 * Tesla telemetry signs each request with a public key documented at
 * /api/1/partner_accounts/public_key. In production we cache that key and
 * verify the X-Tesla-Signature header (RS256 over the raw body).
 *
 * For initial rollout we accept either:
 *   - a valid Tesla signature (verified against TESLA_TELEMETRY_PUBLIC_KEY), OR
 *   - a shared secret in X-Telemetry-Secret matching TESLA_TELEMETRY_SHARED_SECRET
 *     (used for our own backfill calls and integration tests).
 *
 * Without one of those, the request is rejected.
 */
async function verifyTeslaSignature(req: Request, rawBody: string): Promise<boolean> {
  const sharedSecret = Deno.env.get("TESLA_TELEMETRY_SHARED_SECRET");
  if (sharedSecret && req.headers.get("X-Telemetry-Secret") === sharedSecret) {
    return true;
  }

  const sig = req.headers.get("X-Tesla-Signature") || req.headers.get("x-tesla-signature");
  const pubKeyPem = Deno.env.get("TESLA_TELEMETRY_PUBLIC_KEY");
  if (!sig || !pubKeyPem) return false;

  try {
    const keyData = pubKeyPem
      .replace(/-----BEGIN PUBLIC KEY-----/, "")
      .replace(/-----END PUBLIC KEY-----/, "")
      .replace(/\s+/g, "");
    const der = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      "spki", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"],
    );
    const sigBytes = Uint8Array.from(atob(sig), c => c.charCodeAt(0));
    return await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5", cryptoKey, sigBytes, new TextEncoder().encode(rawBody),
    );
  } catch (e) {
    console.error("Signature verify error:", e);
    return false;
  }
}

interface TelemetryEvent {
  field: string;          // e.g. "AutopilotState", "Odometer", "Gear"
  value: string | number; // numeric for Odometer/Speed, string for state
  ts: string;             // ISO8601
}

interface TelemetryBatch {
  vin: string;
  events: TelemetryEvent[];
}

interface FsdAccumulator {
  engaged: boolean;
  in_drive: boolean;
  last_odometer: number;
  last_event_at: string | null;
  supervised_miles: number;
  unsupervised_miles: number;
}

function defaultAccumulator(seedOdo = 0): FsdAccumulator {
  return {
    engaged: false,
    in_drive: false,
    last_odometer: seedOdo,
    last_event_at: null,
    supervised_miles: 0,
    unsupervised_miles: 0,
  };
}

/** Apply a batch of events to an accumulator. Returns updated accumulator + miles added.
 *  Also surfaces the latest official `SelfDrivingMilesSinceReset` value when Tesla emits it
 *  (HW4 + recent firmware). When present, this wins over the engagement-delta math. */
function applyBatch(acc: FsdAccumulator, events: TelemetryEvent[]) {
  let supervisedAdded = 0;
  let officialFsdMiles: number | null = null;
  let lastEngagedAt: string | null = null;
  // Sort chronologically — Tesla batches can arrive out of order.
  const ordered = [...events].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  for (const ev of ordered) {
    if (ev.field === "AutopilotState") {
      acc.engaged = ENGAGED_STATES.has(String(ev.value));
      if (acc.engaged) lastEngagedAt = ev.ts;
    } else if (ev.field === "AutosteerCmd") {
      // Treat any Autosteer command above 0 as engaged.
      if (typeof ev.value === "number" && ev.value > 0) {
        acc.engaged = true;
        lastEngagedAt = ev.ts;
      }
    } else if (ev.field === "Gear") {
      acc.in_drive = String(ev.value).toUpperCase().startsWith("D");
    } else if (ev.field === "SelfDrivingMilesSinceReset" || ev.field === "FSDMilesSinceReset") {
      // Official Tesla field (HW4). Use last value in the batch.
      const n = Number(ev.value);
      if (Number.isFinite(n) && n >= 0) officialFsdMiles = n;
    } else if (ev.field === "Odometer") {
      const odo = Number(ev.value);
      if (!Number.isFinite(odo) || odo <= 0) continue;
      if (acc.last_odometer === 0) {
        acc.last_odometer = odo;
        continue;
      }
      const delta = odo - acc.last_odometer;
      if (delta > 0 && delta <= MAX_PER_EVENT_DELTA_MI) {
        if (acc.engaged && acc.in_drive) {
          acc.supervised_miles += delta;
          supervisedAdded += delta;
          lastEngagedAt = ev.ts;
        }
      }
      // Always advance the odometer pointer so we don't double-credit on next reading.
      if (delta >= 0) acc.last_odometer = odo;
    }
    acc.last_event_at = ev.ts;
  }

  return { acc, supervisedAdded, officialFsdMiles, lastEngagedAt };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let rawBody = "";
  try {
    rawBody = await req.text();
    const valid = await verifyTeslaSignature(req, rawBody);
    if (!valid) {
      return new Response(JSON.stringify({ error: "invalid_signature" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(rawBody);
    const batches: TelemetryBatch[] = Array.isArray(payload) ? payload
      : Array.isArray(payload.batches) ? payload.batches
      : payload.vin && payload.events ? [payload]
      : [];

    if (batches.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let processedBatches = 0;
    let totalSupervisedAdded = 0;

    for (const batch of batches) {
      const vin = batch.vin;
      if (!vin || !Array.isArray(batch.events) || batch.events.length === 0) continue;

      // Look up the owning user + current accumulator. There can only be one
      // claimer per VIN — connected_devices is unique on (provider, device_id).
      const { data: device } = await supabase
        .from("connected_devices")
        .select("user_id, lifetime_totals, baseline_data, last_known_state")
        .eq("provider", "tesla")
        .eq("device_id", vin)
        .maybeSingle();
      if (!device) {
        console.warn(`[telemetry-webhook] unknown VIN ${vin}, skipping`);
        continue;
      }

      const userId = device.user_id as string;
      const lifetime = (device.lifetime_totals as any) || {};
      const baseline = (device.baseline_data as any) || {};
      const lastState = (device.last_known_state as any) || {};
      const prevAcc: FsdAccumulator = lastState.fsd_accumulator || defaultAccumulator(lifetime.odometer ?? 0);

      const { acc, supervisedAdded, officialFsdMiles } = applyBatch({ ...prevAcc }, batch.events);
      totalSupervisedAdded += supervisedAdded;

      // Decide which value to publish for this VIN.
      //   - Tesla's SelfDrivingMilesSinceReset (HW4) wins when present.
      //   - Otherwise fall back to the engagement-delta accumulator (HW3 path).
      const useOfficial = typeof officialFsdMiles === "number";
      const cumulative = useOfficial
        ? (officialFsdMiles as number)
        : acc.supervised_miles + acc.unsupervised_miles;
      const fsdSource: "official" | "calculated_hw3" = useOfficial ? "official" : "calculated_hw3";
      const cumulativeChanged = useOfficial
        ? cumulative > Number(lifetime.lifetime_fsd_miles ?? 0)
        : supervisedAdded > 0;

      // Write a Proof-of-Delta cumulative row whenever miles changed.
      if (cumulativeChanged) {
        const tsNow = acc.last_event_at || new Date().toISOString();

        const { data: prevRow } = await supabase
          .from("energy_production")
          .select("proof_metadata, production_wh")
          .eq("device_id", vin)
          .eq("provider", "tesla")
          .eq("data_type", "fsd_miles")
          .eq("user_id", userId)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const prevHash = (prevRow?.proof_metadata as any)?.hash || "genesis";
        const prevValue = Number(prevRow?.production_wh || 0);
        const snapshotHash = await buildEnergyHash(vin, tsNow, cumulative, prevHash);

        await supabase
          .from("energy_production")
          .upsert({
            user_id: userId,
            device_id: vin,
            provider: "tesla",
            production_wh: cumulative,           // reuses numeric col, units = miles
            data_type: "fsd_miles",
            recorded_at: tsNow,
            proof_metadata: {
              hash: snapshotHash,
              prev_hash: prevHash,
              device_id: vin,
              value: cumulative,
              prev_value: prevValue,
              delta: Math.max(0, cumulative - prevValue),
              data_type: "fsd_miles",
              unit: "miles",
              timestamp: tsNow,
              algorithm: "SHA-256",
              preimage_format: "device_id|timestamp|value|prevHash",
              source: fsdSource,
            },
          }, { onConflict: "device_id,provider,recorded_at,data_type" });
      }

      // Persist updated accumulator + lifetime watermark + ensure baseline exists.
      const firstSampleAt =
        (lastState.fsd_source_meta as any)?.first_sample_at
        || acc.last_event_at
        || new Date().toISOString();
      const nextLifetime = {
        ...lifetime,
        lifetime_fsd_miles: cumulative,
        updated_at: new Date().toISOString(),
      };
      const nextBaseline = {
        ...baseline,
        fsd_baseline_miles: baseline.fsd_baseline_miles ?? 0,
      };
      const nextLastState = {
        ...lastState,
        fsd_accumulator: acc,
        fsd_source: fsdSource,
        fsd_source_meta: {
          ...((lastState.fsd_source_meta as any) || {}),
          first_sample_at: firstSampleAt,
          last_source: fsdSource,
          last_updated_at: new Date().toISOString(),
        },
      };

      await supabase
        .from("connected_devices")
        .update({
          lifetime_totals: nextLifetime,
          baseline_data: nextBaseline,
          last_known_state: nextLastState,
        })
        .eq("user_id", userId)
        .eq("provider", "tesla")
        .eq("device_id", vin);

      processedBatches += 1;
    }

    return new Response(JSON.stringify({
      ok: true,
      processed: processedBatches,
      supervised_miles_added: totalSupervisedAdded,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("tesla-telemetry-webhook error:", err, "body=", rawBody.slice(0, 500));
    return new Response(JSON.stringify({ error: String((err as Error).message || err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
