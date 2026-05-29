// Premium Energy Insights — live-telemetry report generator.
// Uses cached battery + EV charger telemetry (device_telemetry_cache) and
// connected_devices to build a Gemini prompt. First report (no prior reports)
// → Gemini 2.5 Pro (~$0.06). Subsequent / weekly recaps → Gemini 2.5 Flash
// (~$0.02). Stored in energy_reports with a `kind=live_insights` marker in
// inputs_summary. Throttled to once per 24h per user.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYSTEM_PROMPT = `You are Deason, ZenSolar's friendly energy concierge. You are looking at LIVE telemetry from the homeowner's battery and EV charger (plus solar if available). Write a short, exciting, plain-English insights report. NEVER use crypto jargon. Use real numbers, friendly tone, celebratory where appropriate. Keep it under ~300 words across all sections.`;

interface ReportJson {
  headline: string;
  battery_story: string;
  ev_charger_story: string;
  smart_tip: string;
  this_week_win: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);
    const user = userData.user;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Subscription gate
    const { data: sub } = await admin
      .from("energy_subscriptions")
      .select("active, tier, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle();

    const isActive = !!sub?.active && (!sub.current_period_end || new Date(sub.current_period_end) > new Date());
    if (!isActive) {
      return json({ error: "not_subscribed", message: "Premium Energy Insights subscription required." }, 402);
    }

    // 24h throttle — look at most recent live_insights report
    const { data: lastReport } = await admin
      .from("energy_reports")
      .select("id, created_at, inputs_summary")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const lastLive = (lastReport ?? []).find((r: any) => r.inputs_summary?.kind === "live_insights");
    if (lastLive) {
      const ageMs = Date.now() - new Date(lastLive.created_at).getTime();
      if (ageMs < 24 * 60 * 60 * 1000) {
        const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - ageMs) / (60 * 60 * 1000));
        return json({
          error: "throttled",
          message: `Next report available in ~${hoursLeft}h.`,
          last_report_id: lastLive.id,
        }, 429);
      }
    }

    // Pull cached telemetry for this user (battery + ev_charger)
    const { data: telemetry } = await admin
      .from("device_telemetry_cache")
      .select("oem_type, device_type, site_id, payload, cached_at")
      .eq("user_id", user.id)
      .in("device_type", ["battery", "ev_charger", "solar"]);

    if (!telemetry || telemetry.length === 0) {
      return json({
        error: "no_telemetry",
        message: "No live battery or EV charger telemetry yet. Connect a device in the Clean Energy Center.",
      }, 400);
    }

    // Device list for friendly naming
    const { data: devices } = await admin
      .from("connected_devices")
      .select("provider, device_type, device_name, device_id")
      .eq("user_id", user.id);

    // Choose model: Pro for first report, Flash otherwise
    const isFirst = !lastLive;
    const model = isFirst ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";

    const userPrompt = buildPrompt(telemetry, devices ?? []);

    // Create processing row
    const { data: created, error: createErr } = await admin
      .from("energy_reports")
      .insert({
        user_id: user.id,
        status: "processing",
        preview: {},
        inputs_summary: {
          kind: "live_insights",
          model,
          devices: (devices ?? []).map((d: any) => ({ provider: d.provider, type: d.device_type })),
          telemetry_count: telemetry.length,
        },
      })
      .select("id")
      .single();

    if (createErr) {
      console.error("create report err", createErr);
      return json({ error: "db_error" }, 500);
    }

    // Call Lovable AI Gateway
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "emit_insights",
              description: "Return the live energy insights report.",
              parameters: {
                type: "object",
                properties: {
                  headline: { type: "string", description: "1-line headline, exciting, ≤80 chars." },
                  battery_story: { type: "string", description: "2–3 sentence story about battery activity." },
                  ev_charger_story: { type: "string", description: "2–3 sentence story about EV charging." },
                  smart_tip: { type: "string", description: "One actionable tip for the homeowner." },
                  this_week_win: { type: "string", description: "Celebratory micro-win." },
                },
                required: ["headline", "battery_story", "ev_charger_story", "smart_tip", "this_week_win"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "emit_insights" } },
      }),
    });

    if (aiRes.status === 429) {
      await admin.from("energy_reports").update({ status: "error", error_message: "rate_limited" }).eq("id", created.id);
      return json({ error: "rate_limited" }, 429);
    }
    if (aiRes.status === 402) {
      await admin.from("energy_reports").update({ status: "error", error_message: "credits_exhausted" }).eq("id", created.id);
      return json({ error: "credits_exhausted" }, 402);
    }
    if (!aiRes.ok) {
      const detail = await aiRes.text();
      console.error("AI error", aiRes.status, detail);
      await admin.from("energy_reports").update({ status: "error", error_message: `ai_${aiRes.status}` }).eq("id", created.id);
      return json({ error: "ai_error", detail }, 500);
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    let report: ReportJson;
    try {
      report = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("parse err", e, aiJson);
      await admin.from("energy_reports").update({ status: "error", error_message: "parse_error" }).eq("id", created.id);
      return json({ error: "parse_error" }, 500);
    }

    await admin
      .from("energy_reports")
      .update({
        status: "ready",
        preview: { headline: report.headline, this_week_win: report.this_week_win },
        full_report: report as unknown as Record<string, unknown>,
      })
      .eq("id", created.id);

    return json({ report_id: created.id, report, model, first_report: isFirst });
  } catch (e) {
    console.error("fn error", e);
    return json({ error: "server_error", detail: String(e) }, 500);
  }
});

function buildPrompt(telemetry: any[], devices: any[]): string {
  const lines: string[] = [];
  lines.push("Here is the homeowner's connected device list and the latest cached live telemetry.\n");
  lines.push("CONNECTED DEVICES:");
  for (const d of devices) {
    lines.push(`- ${d.provider} ${d.device_type}${d.device_name ? ` ("${d.device_name}")` : ""}`);
  }
  lines.push("\nLIVE TELEMETRY (most recent cached snapshot per device):");
  for (const t of telemetry) {
    lines.push(`\n[${t.oem_type} • ${t.device_type} • site ${t.site_id}] cached_at=${t.cached_at}`);
    lines.push(JSON.stringify(t.payload).slice(0, 2000));
  }
  lines.push("\nWrite a short Premium Energy Insights report. Use the emit_insights tool.");
  return lines.join("\n");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
