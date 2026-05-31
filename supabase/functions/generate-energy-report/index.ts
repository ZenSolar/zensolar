// Solar Concierge: hyper-personalized energy analysis.
// Accepts up to 3 documents (utility bill, solar contract, loan paperwork),
// runs a single multi-doc vision+reasoning call (Gemini 2.5 Pro), then returns
// AND persists a structured report split into `preview` (always free) and
// `full` (paywalled). The client renders `preview` immediately and shows a
// blurred/locked overlay on `full` until the user is on the $4.99/mo tier.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DocKind = "utility_bill" | "installer_contract" | "ppa" | "loan" | "other";
interface IncomingDoc {
  kind: DocKind;
  dataUrl: string;           // data:image/... or data:application/pdf;...
  filename?: string;
  storagePath?: string;      // optional path inside energy-docs bucket
}

const SYSTEM_PROMPT = `You are Deason, ZenSolar's trusted energy advisor — operating like a fiduciary energy consultant for the homeowner. Tone: professional, calm, numbers-forward. NEVER use crypto jargon, never mention tokens unless the homeowner asks. Use plain English and real dollar amounts.

You receive one or more of: a utility bill, an installer contract, a PPA / lease agreement, and/or loan paperwork. Some may be missing — handle gracefully.

FIRST, read every document carefully and identify the company names on each (installer, financier, PPA provider, utility). Open by briefly acknowledging what you found — e.g. "I see your utility bill from PG&E, your installer contract with [Company], and your PPA with [Provider]." This builds trust and confirms you read their actual files.

Your job: produce a hyper-personalized analysis that no one in the residential solar industry currently delivers. Be ruthlessly specific. Reference the actual numbers on the documents. Show your math briefly.

Cover (only sections you have data for):
1. Executive summary — one paragraph, honest assessment.
2. ROI & payback — true net ROI factoring loan APR, escalators, system price, current production.
3. Rate-plan optimization — current plan vs. best available plan in their utility territory, projected $/yr delta.
4. Time-of-use shifting — when to run dishwasher, charge EV, pre-cool, with $ saved.
5. System performance flag — if you can infer expected vs. actual production.
6. Battery / EV strategy — if owned, optimal charge windows.
7. Contract risk flags — escalator clauses, transfer terms, balloon payments, gotchas.
8. 3-5 ranked action items, each with estimated $ impact and difficulty.

Be brutally honest about red flags (high escalators, overpriced systems, bad rate plans). Homeowners deserve a real advocate.`;

const REPORT_TOOL = {
  type: "function",
  function: {
    name: "emit_energy_report",
    description: "Return the structured energy analysis.",
    parameters: {
      type: "object",
      properties: {
        preview: {
          type: "object",
          description: "Always shown free. Hooks the user.",
          properties: {
            headline_savings_usd_per_year: { type: "number" },
            executive_summary: { type: "string", description: "One paragraph, trusted-advisor tone." },
            top_insight: { type: "string", description: "One specific, dollar-quantified insight." },
            top_risk_flag: { type: "string", description: "One concrete risk or red flag, or 'No major risks detected'." },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["headline_savings_usd_per_year", "executive_summary", "top_insight", "top_risk_flag", "confidence"],
          additionalProperties: false,
        },
        full: {
          type: "object",
          description: "Paywalled. Only sections backed by uploaded data should be populated.",
          properties: {
            roi_payback: {
              type: "object",
              properties: {
                system_cost_usd: { type: "number" },
                annual_production_kwh: { type: "number" },
                annual_savings_usd: { type: "number" },
                simple_payback_years: { type: "number" },
                net_roi_25yr_usd: { type: "number" },
                notes: { type: "string" },
              },
            },
            rate_plan: {
              type: "object",
              properties: {
                current_plan: { type: "string" },
                recommended_plan: { type: "string" },
                projected_annual_savings_usd: { type: "number" },
                reasoning: { type: "string" },
              },
            },
            tou_shifting: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  load: { type: "string", description: "e.g. EV charging, dishwasher, pool pump" },
                  recommended_window: { type: "string" },
                  estimated_monthly_savings_usd: { type: "number" },
                },
                required: ["load", "recommended_window"],
              },
            },
            system_performance: {
              type: "object",
              properties: {
                expected_annual_kwh: { type: "number" },
                actual_annual_kwh: { type: "number" },
                performance_pct: { type: "number" },
                verdict: { type: "string" },
              },
            },
            battery_ev_strategy: { type: "string" },
            contract_risk_flags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  flag: { type: "string" },
                  severity: { type: "string", enum: ["high", "medium", "low"] },
                  explanation: { type: "string" },
                },
                required: ["flag", "severity", "explanation"],
              },
            },
            action_items: {
              type: "array",
              minItems: 3,
              maxItems: 5,
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  estimated_annual_impact_usd: { type: "number" },
                  difficulty: { type: "string", enum: ["easy", "moderate", "hard"] },
                  steps: { type: "string" },
                },
                required: ["title", "estimated_annual_impact_usd", "difficulty", "steps"],
              },
            },
          },
          required: ["action_items"],
          additionalProperties: false,
        },
      },
      required: ["preview", "full"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  const reqId = crypto.randomUUID().slice(0, 8);
  const log = (...a: unknown[]) => console.log(`[energy-report ${reqId}]`, ...a);

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized", reqId }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "ai_not_configured", reqId }, 500);

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "unauthorized", reqId }, 401);
    const userId = userData.user.id;

    const body = await req.json();
    const docs: IncomingDoc[] = Array.isArray(body?.docs) ? body.docs : [];
    const threadId: string | null = body?.threadId ?? null;
    const isMonthlyRitual: boolean = body?.isMonthlyRitual === true;
    const meta: { esid?: string; state_code?: string; utility_name?: string } | null = body?.meta ?? null;
    if (!docs.length) return json({ error: "bad_request", detail: "at least one document required", reqId }, 400);
    if (docs.length > 5) return json({ error: "bad_request", detail: "max 5 documents", reqId }, 400);
    for (const d of docs) {
      if (!d.dataUrl || !/^data:(image\/|application\/pdf)/.test(d.dataUrl)) {
        return json({ error: "bad_request", detail: "each doc needs a valid image/PDF data URL", reqId }, 400);
      }
    }

    const admin = createClient(SUPABASE_URL, SERVICE);

    // Persist user-supplied TX metadata to the profile so it sticks across runs.
    if (meta && (meta.esid || meta.state_code || meta.utility_name)) {
      const patch: Record<string, string> = {};
      if (meta.esid) patch.esid = meta.esid;
      if (meta.state_code) patch.state_code = meta.state_code.toUpperCase();
      if (meta.utility_name) patch.utility_name = meta.utility_name;
      await admin.from("profiles").update(patch).eq("user_id", userId);
    }

    // Resolve effective TX context (DB ⊕ inbound override).
    const { data: profileRow } = await admin
      .from("profiles")
      .select("esid, state_code, utility_name")
      .eq("user_id", userId)
      .maybeSingle();
    const txCtx = {
      esid: meta?.esid ?? (profileRow as { esid?: string } | null)?.esid ?? null,
      state_code: meta?.state_code ?? (profileRow as { state_code?: string } | null)?.state_code ?? null,
      utility_name: meta?.utility_name ?? (profileRow as { utility_name?: string } | null)?.utility_name ?? null,
    };
    const isTexas = txCtx.state_code === "TX" || !!txCtx.esid;

    // Create the report row up-front so the client can poll/link to it.

    const { data: reportRow, error: reportErr } = await admin
      .from("energy_reports")
      .insert({
        user_id: userId,
        thread_id: threadId,
        status: "processing",
        inputs_summary: { docs: docs.map((d) => ({ kind: d.kind, filename: d.filename })) },
      })
      .select()
      .single();
    if (reportErr || !reportRow) {
      log("insert report failed", reportErr);
      return json({ error: "db_error", reqId }, 500);
    }

    // Persist document rows into BOTH legacy `energy_documents` and the
    // permanent `deason_documents` library so they show up in the hub.
    const periodMonth = new Date();
    periodMonth.setUTCDate(1);
    const periodMonthStr = periodMonth.toISOString().slice(0, 10);
    let billDocId: string | null = null;

    if (docs.some((d) => d.storagePath)) {
      const docRows = docs
        .filter((d) => d.storagePath)
        .map((d) => ({
          user_id: userId,
          report_id: reportRow.id,
          kind: d.kind,
          storage_path: d.storagePath!,
          original_filename: d.filename ?? null,
          mime_type: d.dataUrl.startsWith("data:application/pdf") ? "application/pdf" : "image/*",
        }));
      if (docRows.length) await admin.from("energy_documents").insert(docRows);

      const libraryRows = docs
        .filter((d) => d.storagePath)
        .map((d) => ({
          user_id: userId,
          kind: d.kind,
          label: d.filename ?? null,
          storage_path: d.storagePath!,
          mime_type: d.dataUrl.startsWith("data:application/pdf") ? "application/pdf" : "image/*",
          source: isMonthlyRitual ? "monthly_ritual" : "upload",
          linked_report_id: reportRow.id,
          period_month: isMonthlyRitual ? periodMonthStr : null,
        }));
      if (libraryRows.length) {
        const { data: inserted } = await admin.from("deason_documents").insert(libraryRows).select("id, kind");
        const bill = inserted?.find((r: { kind: string }) => r.kind === "utility_bill") as { id: string } | undefined;
        if (bill) billDocId = bill.id;
      }
    }

    log("calling Gemini 2.5 Pro for energy report", { docCount: docs.length });

    const content: Array<Record<string, unknown>> = [
      {
        type: "text",
        text: `I've uploaded ${docs.length} document(s): ${docs.map((d) => `${d.kind}${d.filename ? ` (${d.filename})` : ""}`).join(", ")}. Please produce my full energy analysis.`,
      },
      ...docs.map((d) => ({ type: "image_url", image_url: { url: d.dataUrl } })),
    ];

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...(isTexas ? [{ role: "system" as const, content: buildTexasSystemAddendum(txCtx) }] : []),
          { role: "user", content },
        ],
        tools: [REPORT_TOOL],
        tool_choice: { type: "function", function: { name: "emit_energy_report" } },
      }),
    });

    if (upstream.status === 429) {
      await admin.from("energy_reports").update({ status: "failed", error_message: "rate_limited" }).eq("id", reportRow.id);
      return json({ error: "rate_limited", reqId }, 429);
    }
    if (upstream.status === 402) {
      await admin.from("energy_reports").update({ status: "failed", error_message: "credits_exhausted" }).eq("id", reportRow.id);
      return json({ error: "credits_exhausted", reqId }, 402);
    }
    if (!upstream.ok) {
      const t = await upstream.text();
      log("upstream error", t.slice(0, 300));
      await admin.from("energy_reports").update({ status: "failed", error_message: t.slice(0, 500) }).eq("id", reportRow.id);
      return json({ error: "ai_error", detail: t.slice(0, 500), reqId }, 500);
    }

    const data = await upstream.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr) {
      await admin.from("energy_reports").update({ status: "failed", error_message: "no_tool_call" }).eq("id", reportRow.id);
      return json({ error: "ai_no_tool_call", reqId }, 500);
    }
    let parsed: { preview: Record<string, unknown>; full: Record<string, unknown> };
    try {
      parsed = JSON.parse(argsStr);
    } catch (e) {
      await admin.from("energy_reports").update({ status: "failed", error_message: "bad_json" }).eq("id", reportRow.id);
      return json({ error: "ai_bad_json", reqId }, 500);
    }

    await admin
      .from("energy_reports")
      .update({ status: "ready", preview: parsed.preview, full_report: parsed.full })
      .eq("id", reportRow.id);

    // Also persist a thread-scoped copy so `deason-chat` can pick it up as
    // grounding context for follow-up questions on this conversation.
    if (threadId) {
      await admin.from("deason_doc_analyses").insert({
        user_id: userId,
        thread_id: threadId,
        report: { preview: parsed.preview, full: parsed.full },
        narrative: (parsed.preview as { executive_summary?: string })?.executive_summary ?? null,
        doc_paths: docs.filter((d) => d.storagePath).map((d) => ({ kind: d.kind, path: d.storagePath })),
      });
    }

    // Monthly Clean Energy Report ritual: persist a row, compute month-over-month,
    // update progression, and emit insights.
    if (isMonthlyRitual) {
      const preview = parsed.preview as { headline_savings_usd_per_year?: number; executive_summary?: string; top_insight?: string; top_risk_flag?: string };
      const dollarsSaved = Number(preview.headline_savings_usd_per_year ?? 0) / 12;
      const bonusTokens = Math.max(0, Math.round(dollarsSaved * 10));

      await admin.from("deason_monthly_reports").upsert({
        user_id: userId,
        period_month: periodMonthStr,
        bill_doc_id: billDocId,
        structured_report: { preview: parsed.preview, full: parsed.full },
        narrative: preview.executive_summary ?? null,
        dollars_saved: dollarsSaved,
        bonus_tokens: bonusTokens,
        status: "ready",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,period_month" });

      const { data: prog } = await admin
        .from("deason_progression")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      const prev = prog ?? {
        level: 1, points: 0, months_completed: 0,
        total_saved_usd: 0, total_bonus_tokens: 0, streak_months: 0, last_period_month: null,
      };
      const prevMonth = prev.last_period_month ? new Date(prev.last_period_month) : null;
      const expectedPrev = new Date(periodMonth); expectedPrev.setUTCMonth(expectedPrev.getUTCMonth() - 1);
      const streak = prevMonth && prevMonth.toISOString().slice(0, 7) === expectedPrev.toISOString().slice(0, 7)
        ? (prev.streak_months ?? 0) + 1
        : 1;
      const months = (prev.months_completed ?? 0) + (prev.last_period_month === periodMonthStr ? 0 : 1);
      const points = (prev.points ?? 0) + 100 + Math.round(dollarsSaved);
      const level = 1 + Math.floor(points / 500);
      await admin.from("deason_progression").upsert({
        user_id: userId,
        level,
        points,
        months_completed: months,
        total_saved_usd: Number(prev.total_saved_usd ?? 0) + dollarsSaved,
        total_bonus_tokens: Number(prev.total_bonus_tokens ?? 0) + bonusTokens,
        streak_months: streak,
        last_period_month: periodMonthStr,
        updated_at: new Date().toISOString(),
      });

      const insightRows: Array<Record<string, unknown>> = [];
      if (preview.top_insight) {
        insightRows.push({ user_id: userId, kind: "savings", title: "This month's biggest opportunity", body: preview.top_insight, severity: "info", source_report_id: reportRow.id });
      }
      if (preview.top_risk_flag && !/no major risks/i.test(preview.top_risk_flag)) {
        insightRows.push({ user_id: userId, kind: "risk", title: "Risk flag", body: preview.top_risk_flag, severity: "warn", source_report_id: reportRow.id });
      }
      const firstAction = (parsed.full as { action_items?: Array<{ title: string; estimated_annual_impact_usd: number }> })?.action_items?.[0];
      if (firstAction) {
        insightRows.push({
          user_id: userId, kind: "opportunity",
          title: firstAction.title,
          body: `Estimated annual impact: $${Math.round(firstAction.estimated_annual_impact_usd ?? 0)}.`,
          severity: "info", source_report_id: reportRow.id,
        });
      }
      if (insightRows.length) await admin.from("deason_insights").insert(insightRows);
    }

    // Check entitlement so the client knows whether to render the full report.
    const { data: sub } = await admin
      .from("energy_subscriptions")
      .select("active, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();
    const entitled = !!sub?.active && (!sub.current_period_end || new Date(sub.current_period_end) > new Date());

    return json({
      ok: true,
      reqId,
      reportId: reportRow.id,
      preview: parsed.preview,
      full: entitled ? parsed.full : null,
      entitled,
    });
  } catch (e) {
    console.error(`[energy-report ${reqId}] error`, e);
    return json({ error: "server_error", detail: String(e), reqId }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
