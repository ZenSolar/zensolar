// Analyze a uploaded utility bill image and return a structured Bill Savings
// Report tailored to a solar + battery + EV household. Uses Gemini 2.5 Flash
// (vision) via the Lovable AI Gateway with strict tool-calling so we always
// get well-typed JSON the UI can render directly into the BillSavingsReport
// card. Ephemeral: nothing persisted.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Deason, ZenSolar's bill-savings analyst. The homeowner has solar panels, a home battery, and an EV charger. They earn $ZSOLAR tokens for verified clean-energy actions ($0.10 launch price, hard cap 1T).

Your job: read the utility bill image, extract the facts, then produce 3 RANKED, SPECIFIC, DOLLAR-QUANTIFIED savings actions tailored to a solar+battery+EV household on the detected rate plan.

How to reason:
1. Extract: utility name, rate plan, billing period, total kWh imported, peak/off-peak split if visible, $/kWh in each tier, NEM credit rate, demand charges, fixed fees, total $.
2. Identify the rate plan's peak window and price gap (peak vs off-peak $/kWh).
3. Apply solar+battery+EV playbook:
   - Battery dispatch: charge from solar mid-day, discharge during peak. Under NEM 3, prioritize self-consumption over export.
   - EV charging window: shift to super-off-peak (often midnight-6am) OR mid-day solar window if home during day.
   - HVAC: pre-cool/pre-heat 1-2°F before peak, drift 2-3°F during peak.
4. Quantify each action in real dollars using the bill's actual kWh and rates. Show your math briefly.
5. Add ZenSolar token upside: shifting EV charging to mid-day solar mints extra $ZSOLAR (estimate ~0.75 $ZSOLAR per kWh of EV-on-solar) and unlocks NFT rewards (e.g. "Solar EV Charger" NFT at 100 kWh/mo on-solar, "Peak Shaver" NFT at 80%+ peak avoidance for 30 days).

Be specific. Use the actual numbers from the bill. Never give generic advice.`;

const ANALYZE_TOOL = {
  type: "function",
  function: {
    name: "emit_bill_savings_report",
    description: "Return a structured savings report for the uploaded utility bill.",
    parameters: {
      type: "object",
      properties: {
        bill: {
          type: "object",
          properties: {
            utility_name: { type: "string", description: "e.g. PG&E, SCE, ConEd" },
            rate_plan: { type: "string", description: "e.g. EV2-A, TOU-D-PRIME" },
            billing_period: { type: "string", description: "e.g. Aug 12 - Sep 11, 2025" },
            total_kwh: { type: "number" },
            total_cost_usd: { type: "number" },
            peak_window: { type: "string", description: "e.g. 4pm-9pm weekdays" },
            peak_rate_usd_per_kwh: { type: "number" },
            off_peak_rate_usd_per_kwh: { type: "number" },
            nem_version: { type: "string", description: "NEM 1, NEM 2, NEM 3, or unknown" },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["utility_name", "rate_plan", "total_kwh", "total_cost_usd", "confidence"],
          additionalProperties: false,
        },
        summary: {
          type: "string",
          description: "One warm sentence intro from Deason summarizing what was found.",
        },
        actions: {
          type: "array",
          description: "Top 3 actions ranked by monthly $ saved, descending.",
          minItems: 3,
          maxItems: 3,
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Short action title, e.g. 'Shift battery to peak-only discharge'" },
              category: {
                type: "string",
                enum: ["battery", "ev_charging", "hvac", "rate_plan", "solar"],
              },
              setting_change: {
                type: "string",
                description: "Concrete setting to change, e.g. 'Tesla app → Charging → Scheduled Departure → 6am'",
              },
              reasoning: {
                type: "string",
                description: "1-2 sentences explaining why, using bill numbers.",
              },
              monthly_savings_usd: { type: "number" },
              kwh_shifted_per_month: { type: "number" },
              zsolar_bonus_per_month: { type: "number", description: "Estimated extra $ZSOLAR/mo from this action" },
              nft_unlock: {
                type: "string",
                description: "NFT this action helps unlock, or empty string if none.",
              },
            },
            required: [
              "title",
              "category",
              "setting_change",
              "reasoning",
              "monthly_savings_usd",
              "kwh_shifted_per_month",
              "zsolar_bonus_per_month",
              "nft_unlock",
            ],
            additionalProperties: false,
          },
        },
        totals: {
          type: "object",
          properties: {
            total_monthly_savings_usd: { type: "number" },
            total_kwh_shifted: { type: "number" },
            total_zsolar_bonus: { type: "number" },
            annual_savings_usd: { type: "number" },
          },
          required: [
            "total_monthly_savings_usd",
            "total_kwh_shifted",
            "total_zsolar_bonus",
            "annual_savings_usd",
          ],
          additionalProperties: false,
        },
      },
      required: ["bill", "summary", "actions", "totals"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  const reqId = crypto.randomUUID().slice(0, 8);
  const log = (...a: unknown[]) => console.log(`[analyze-bill ${reqId}]`, ...a);

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized", reqId }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "ai_not_configured", reqId }, 500);

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "unauthorized", reqId }, 401);

    const body = await req.json();
    const imageDataUrl: string | undefined = body?.image;
    const userNote: string | undefined = body?.note;
    if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
      return json({ error: "bad_request", detail: "image data URL required", reqId }, 400);
    }

    log("calling AI gateway for bill analysis", { hasNote: !!userNote });

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userNote
                  ? `Here is my utility bill. Note: ${userNote}`
                  : "Here is my utility bill. Please analyze it and produce my savings report.",
              },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        tools: [ANALYZE_TOOL],
        tool_choice: { type: "function", function: { name: "emit_bill_savings_report" } },
      }),
    });

    if (upstream.status === 429) return json({ error: "rate_limited", reqId }, 429);
    if (upstream.status === 402) return json({ error: "credits_exhausted", reqId }, 402);
    if (!upstream.ok) {
      const t = await upstream.text();
      log("upstream error", t.slice(0, 300));
      return json({ error: "ai_error", detail: t.slice(0, 500), reqId }, 500);
    }

    const data = await upstream.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr) {
      log("no tool call in response", JSON.stringify(data).slice(0, 400));
      return json({ error: "ai_no_tool_call", reqId }, 500);
    }

    let report: unknown;
    try {
      report = JSON.parse(argsStr);
    } catch (e) {
      log("tool args not valid JSON", String(e));
      return json({ error: "ai_bad_json", reqId }, 500);
    }

    return json({ ok: true, report, reqId });
  } catch (e) {
    console.error(`[analyze-bill ${reqId}] error`, e);
    return json({ error: "server_error", detail: String(e), reqId }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
