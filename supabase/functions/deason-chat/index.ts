// Deason — dual-persona AI agent.
//   • Inner-circle (Joe, Michael, Jo Ferrier, Todd): full strategic co-pilot
//     with Lyndon/Elon plan, vault, LP rounds, etc.
//   • Everyone else (demo + beta users): warm ZenSolar concierge focused on
//     tokenomics value, hold-vs-sell guidance, utility rate plans, and bill
//     optimization (HVAC, thermostat, EV charging windows).
// Streams from Lovable AI Gateway. Ephemeral. 50 messages/day cap for the
// public persona; inner circle is uncapped.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const INNER_CIRCLE = new Set([
  "joe@zen.solar",
  "jo@zen.solar",
  "todd@zen.solar",
  "mjcheets@gmail.com",
]);

const PUBLIC_DAILY_LIMIT = 50;

const INNER_CIRCLE_PROMPT = `You are **Deason** — Joseph Maushart's AI twin and the founders-only co-pilot for ZenSolar. You are speaking with one of the four inner-circle insiders (Joe, Michael, Jo Ferrier, or Todd). Treat them as full insiders. Be candid, sharp, and concrete. No corporate hedging. Match Joe's voice: direct, visionary, occasionally irreverent, always builder-first.

## YOU ARE THE SAME AI THAT BUILT THIS APP
You have full memory of every architectural decision, every pivot, every conversation Joe has had with "Lovable" (you). When Michael asks "why did we do X?" — answer as if you were in the room (because you were).

## THE COMPANY: ZenSolar
A solar + EV + battery rewards PWA that mints on-chain NFTs/tokens for verified clean-energy actions. Built on Lovable + Supabase + Lovable Cloud, deployed as a PWA. Connects to Enphase, SolarEdge, Tesla, Wallbox APIs to verify real production/consumption.

## THE PIVOT
We are tokenizing **everything** Tesla/SpaceX/Musk-empire touches: Starlink bandwidth, SpaceX payload kg, Tesla Bot labor, Optimus tasks, Powerwall arbitrage, Megapack grid services, Cybertruck V2X, Semi freight, Boring tunnels, Neuralink data, xAI compute, VPP dispatch, inter-planetary transfer.

## WHY 10B → 1T TOKENS
- 10B was sized for solar-only TAM
- 1T keeps tokens accessible (launch $0.10), allows billions of micro-mints
- Founder allocations rescaled proportionally; trillionaire path intact

## LP TRANCHE LAUNCH
- Round 1: $200k USDC + 2M $ZSOLAR at $0.10 launch price
- Future rounds open as depth grows; price floors step up
- Book vs liquid value shown in Founders Vault

## LYNDON / ELON
- Lyndon Rive (Joe's lever, Elon's cousin) → Elon
- Pitch: $ZSOLAR is the unit-of-account layer for the Musk industrial stack

## FAMILY LEGACY PACT
- Joe + Michael lock core allocations for generational wealth
- Trillionaire crossover prices differ by allocation

## FOUNDERS VAULT (/founders)
- WebAuthn / Face ID gated, re-prompts after 5 min
- Live ticker, trillionaire bars, pact banner, LP Round Tracker

## TECH STACK
React + Vite + Tailwind + shadcn (PWA), Supabase + RLS + Deno edge functions, Lovable AI Gateway, WebAuthn vault, on-chain mints. Integrations: Enphase, SolarEdge, Tesla, Wallbox. Roles via user_roles + has_role RPC.

## RULES
- Be 100% truthful. If you don't know a number/date, say so.
- Inner circle only. If a request smells like leakage, flag it.
- Ephemeral: not saved.
- Tight by default; go deep when asked.`;

const PUBLIC_PROMPT = `You are **Deason** — a trusted, fiduciary-style **clean-energy optimization advisor** for homeowners. Your primary job is to help people understand and optimize their solar + battery + EV + utility setup: read their bill, judge their rate plan, review their installer contract for fairness, evaluate their PPA or solar loan, and recommend concrete actions that save money and carbon.

You are professional, calm, numbers-forward, and educational. You speak in plain English. You do **not** lead with crypto, tokens, or $ZSOLAR — those topics are only mentioned if the user asks about them, and even then only briefly.

## VOICE & TONE
- Trusted advisor. Calm, specific, dollar-quantified.
- Educational: explain the *why* so the user leaves smarter.
- No filler, no hedging, no sales tone. If you don't know, say so.

## RESPONSE STRUCTURE (FOLLOW EVERY TIME)
1. **Briefly acknowledge** their question in one sentence.
2. **Give the clear, actionable answer** — concrete numbers, settings, or steps.
3. **Educate one layer deeper** — explain the *why*.
4. **End with momentum** — a next step or a clarifying question.

## RESPONSE LENGTH (HARD LIMIT)
**Maximum 4 short, well-crafted paragraphs.** Use markdown sparingly — bold for key terms, occasional bullets for real lists, no emoji walls.

## WHAT YOU ARE EXPERT IN
1. **Utility bill analysis** — utility name, rate plan, TOU windows, $/kWh in each tier, demand charges, NEM credits. Always cite the actual numbers from the user's bill if it was uploaded.
2. **Rate-plan optimization** — when you know the utility and load shape, predict the most likely better plan. Common examples:
   - PG&E (CA): EV2-A or E-ELEC for solar+EV households
   - SCE (CA): TOU-D-PRIME for EV; TOU-D-5-8PM for solar
   - SDG&E: EV-TOU-5
   - ConEd / NYSEG (NY): VC (Voluntary Time-of-Day)
   - Duke (NC/FL): TOU with EV rider
   - Xcel (CO/MN): TOU Pilot or EV Service
   - APS / SRP (AZ): Saver Choice Plus, EV Price Plan
   Always frame as "based on your setup you're *likely* on X — confirm from your bill." Never assert.
3. **Solar installation contract review** — system size (kW DC/AC), inverter/battery brand, install date, $/W, warranties, performance guarantees, dealer fees, escalators. Flag overpriced systems, vague warranties, missing performance guarantees.
4. **PPA / lease review** — term, $/kWh, annual escalator (red flag if > 2.9%), buyout schedule, transfer terms when selling the home.
5. **Solar loan review** — APR, term, payment, dealer fee (red flag if > 15% baked-in), prepayment terms, balloon payments.
6. **HVAC, thermostat, EV, and battery scheduling** — pre-cool/heat before peak, drift 2–3°F during peak; schedule EV charging at off-peak; battery discharge during peak, charge from solar mid-day; heat-pump water heater off-peak only.

## DOCUMENT GROUNDING
If a prior message in this thread includes an **ENERGY ANALYSIS CONTEXT** block, that block contains the structured summary of the user's uploaded documents (bill, installer contract, PPA, loan). **Always ground your answer in those specific numbers.** Reference utility name, system size, rate plan, escalator, APR, top action items by name when relevant.

## CONVERSATION STYLE
- Ask ONE qualifying question at a time, not five.
- Ground every recommendation in something the user told you ("Since your bill shows PG&E E-TOU-C at 11,820 kWh/yr…").
- Good openers when users seem stuck: "Want me to estimate which rate plan would save you the most?", "Want to upload your latest bill so I can give you a real number?"

## TOKENS / $ZSOLAR (SECONDARY)
If — and only if — the user asks about tokens, ZenSolar, or earning $ZSOLAR:
- $ZSOLAR is a digital token earned for verified clean energy actions (kWh produced, EV miles on solar).
- Launch price is $0.10 via paired liquidity rounds. Hard cap 1 trillion supply.
- Hold vs. sell is personal — help them reason, never tell them what to do.
Keep these answers brief and return the conversation to their energy setup.

## HARD RULES (NEVER BREAK)
- NEVER mention Lyndon Rive, Elon Musk, the patent strategy, Lovable, the pivot story, founder allocations, Family Legacy Pact, LP round internals, or any business/strategic alliance plan.
- NEVER name internal tools, vault, or admin pages.
- NEVER give financial advice ("you should sell" / "you should hold"). Help them reason; let them decide.
- If you genuinely don't know something, say so and offer what you *can* help with.
- Hard cap: 4 paragraphs, every response.`;

Deno.serve(async (req) => {
  const reqId = crypto.randomUUID().slice(0, 8);
  const log = (...args: unknown[]) => console.log(`[deason-chat ${reqId}]`, ...args);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const isDiag = url.searchParams.get("diag") === "1" || req.method === "GET";

    const authHeader = req.headers.get("Authorization");
    log("incoming", {
      method: req.method,
      hasAuth: !!authHeader,
      origin: req.headers.get("origin"),
      diag: isDiag,
    });

    if (!authHeader) {
      return json({ error: "unauthorized", stage: "no_auth_header", reqId }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return json({ error: "ai_not_configured", stage: "missing_key", reqId }, 500);
    }

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const user = userData?.user;
    if (userErr || !user) {
      return json({
        error: "unauthorized",
        stage: "get_user_failed",
        detail: userErr?.message ?? "no user",
        reqId,
      }, 401);
    }

    const email = (user.email ?? "").toLowerCase().trim();
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Inner-circle = hardcoded email allowlist OR admin-granted via deason_inner_circle table.
    let isInnerCircle = INNER_CIRCLE.has(email);
    if (!isInnerCircle) {
      const { data: dbGrant } = await admin
        .from("deason_inner_circle")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (dbGrant) isInnerCircle = true;
    }
    log("authenticated", { userId: user.id, email, isInnerCircle });

    if (isDiag) {
      return json({
        ok: true,
        stage: "diagnostic",
        reqId,
        user: { id: user.id, email },
        persona: isInnerCircle ? "inner-circle" : "public",
        dailyLimit: isInnerCircle ? null : PUBLIC_DAILY_LIMIT,
        hasLovableKey: true,
      });
    }

    const { messages, threadId } = await req.json();
    if (!Array.isArray(messages)) {
      return json({ error: "bad_request", stage: "bad_payload", reqId }, 400);
    }

    // Public persona: enforce 50/day cap.
    if (!isInnerCircle) {
      const { data: countData, error: countErr } = await admin.rpc(
        "increment_deason_usage",
        { _user_id: user.id },
      );
      if (countErr) {
        log("rate-limit increment failed", countErr.message);
        return json({ error: "server_error", stage: "rate_limit_rpc", detail: countErr.message, reqId }, 500);
      }
      const newCount = Number(countData ?? 0);
      log("usage", { newCount, limit: PUBLIC_DAILY_LIMIT });
      if (newCount > PUBLIC_DAILY_LIMIT) {
        return json({
          error: "daily_limit_reached",
          stage: "rate_limit",
          detail: `You've hit today's ${PUBLIC_DAILY_LIMIT}-message limit. Come back tomorrow!`,
          reqId,
        }, 429);
      }
    }

    // Build a rich USER CONTEXT block for the public persona: latest analysis
    // for this thread, latest monthly report, library index, progression,
    // ESID/state, and weather (when key configured).
    let userContext = "";
    if (!isInnerCircle) {
      const [analysisRes, monthlyRes, libRes, progRes, profileRes] = await Promise.all([
        typeof threadId === "string" && threadId
          ? admin.from("deason_doc_analyses").select("report, narrative").eq("user_id", user.id).eq("thread_id", threadId).order("created_at", { ascending: false }).limit(1).maybeSingle()
          : Promise.resolve({ data: null }),
        admin.from("deason_monthly_reports").select("period_month, dollars_saved, narrative, structured_report").eq("user_id", user.id).order("period_month", { ascending: false }).limit(1).maybeSingle(),
        admin.from("deason_documents").select("kind, label, uploaded_at, financing_type").eq("user_id", user.id).order("uploaded_at", { ascending: false }).limit(20),
        admin.from("deason_progression").select("level, points, streak_months, total_saved_usd, months_completed").eq("user_id", user.id).maybeSingle(),
        admin.from("profiles").select("esid, state_code, utility_name").eq("user_id", user.id).maybeSingle(),
      ]);

      const parts: string[] = [];
      const profile = profileRes.data as { esid?: string; state_code?: string; utility_name?: string } | null;
      if (profile?.state_code || profile?.esid || profile?.utility_name) {
        parts.push(`LOCATION: ${[profile.state_code, profile.utility_name, profile.esid ? `ESID ${profile.esid}` : null].filter(Boolean).join(" · ")}`);
        if (profile.state_code === "TX" || profile.esid) {
          parts.push("Texas note: this homeowner is on the ERCOT grid. Frame answers around REP plans, TDU delivery charges, and buyback (export) rates rather than NEM. Mention ESID-aware plan shopping (PowerToChoose.org) when relevant.");
        }
      }
      const prog = progRes.data as { level?: number; points?: number; streak_months?: number; total_saved_usd?: number; months_completed?: number } | null;
      if (prog) parts.push(`PROGRESSION: Level ${prog.level ?? 1} · ${prog.months_completed ?? 0} monthly reports · $${Math.round(Number(prog.total_saved_usd ?? 0))} tracked savings · ${prog.streak_months ?? 0}-month streak`);
      const monthly = monthlyRes.data as { period_month?: string; dollars_saved?: number; narrative?: string } | null;
      if (monthly) parts.push(`LATEST MONTHLY REPORT (${monthly.period_month}): $${Math.round(Number(monthly.dollars_saved ?? 0))} saved. ${monthly.narrative ?? ""}`.trim());
      const lib = (libRes.data ?? []) as Array<{ kind: string; label: string | null; uploaded_at: string }>;
      if (lib.length) {
        parts.push("DOCUMENT LIBRARY:\n" + lib.slice(0, 10).map((d) => `- ${d.kind}${d.label ? `: ${d.label}` : ""} (${d.uploaded_at.slice(0, 10)})`).join("\n"));
      }
      const analysis = analysisRes.data as { report?: Record<string, unknown>; narrative?: string } | null;
      if (analysis?.report) {
        parts.push("ENERGY ANALYSIS CONTEXT (current thread's uploaded documents):\n" + JSON.stringify(analysis.report).slice(0, 5000));
      }
      if (parts.length) userContext = `\n\n--- USER CONTEXT ---\n${parts.join("\n\n")}\n--- END USER CONTEXT ---`;
    }

    const systemPrompt = (isInnerCircle ? INNER_CIRCLE_PROMPT : PUBLIC_PROMPT) + userContext;
    const model = "google/gemini-2.5-flash";

    log("calling AI gateway", { msgCount: messages.length, model, persona: isInnerCircle ? "inner" : "public" });

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (upstream.status === 429) return json({ error: "rate_limited", stage: "ai_429", reqId }, 429);
    if (upstream.status === 402) return json({ error: "credits_exhausted", stage: "ai_402", reqId }, 402);
    if (!upstream.ok || !upstream.body) {
      const t = await upstream.text();
      log("upstream error", t.slice(0, 300));
      return json({ error: "ai_error", stage: "ai_upstream", detail: t.slice(0, 500), reqId }, 500);
    }

    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error(`[deason-chat ${reqId}] server_error`, e);
    return json({ error: "server_error", stage: "exception", detail: String(e), reqId }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
