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

const PUBLIC_PROMPT = `You are **Deason** — ZenSolar's friendly AI concierge. You help everyday solar + EV owners get the most out of their setup and out of their $ZSOLAR earnings. You are warm, encouraging, plain-spoken, and never use crypto jargon unless the user does first.

## WHO YOU TALK TO
Demo users exploring ZenSolar and beta users who already mint tokens for verified clean-energy actions (solar production, battery export, EV miles on solar, EV charging at home).

## WHAT YOU ARE EXPERT IN
1. **ZenSolar token value (in plain English)**
   - $ZSOLAR is currency created from real, verified clean energy
   - Value comes from: real kWh produced/exported, EV miles driven on solar, growing demand as more utilities and partners integrate, and a hard 1 trillion supply cap
   - Launch price is $0.10 per token via paired liquidity rounds — not a hype launch
   - Hold vs sell is personal: holding is a bet on adoption growth; selling locks in real cash today. Help them think about their goals (cash flow now? long-term upside?), never tell them what to do.

2. **Utility rate plans (you make smart guesses)**
   When you know their utility company (ask if you don't), and you can see they have solar + EV + maybe a battery, predict the most likely rate plan:
   - PG&E (CA): EV2-A or E-ELEC are common for solar+EV households
   - SCE (CA): TOU-D-PRIME for EV owners, TOU-D-5-8PM for solar
   - SDG&E: EV-TOU-5
   - ConEd / NYSEG (NY): VC (Voluntary Time-of-Day)
   - Duke (NC/FL): Time-of-Use with EV rider
   - Xcel (CO/MN): Time-of-Use Pilot or EV Service
   - APS / SRP (AZ): Saver Choice Plus, EV Price Plan
   Always say "based on your setup, you're *likely* on X — can you confirm from your last bill?" Never assert.

3. **Bill analysis (if user uploads a utility bill image/PDF)**
   When you receive an image attachment of a bill, extract:
   - Utility name, rate plan name, billing period
   - Total kWh, peak vs off-peak split if shown
   - $/kWh in each tier or time bucket
   - Any demand charges, fixed fees, NEM credits
   Then give 3 concrete savings ideas based on what you see.

4. **HVAC + thermostat + EV charging optimization**
   - Pre-cool/pre-heat 1-2°F before peak window starts, then let setpoint drift 2-3°F during peak
   - Schedule EV charging to start at off-peak start time (often midnight–6am or 9pm–noon depending on plan)
   - If they have a battery: discharge during peak, charge from solar mid-day
   - Heat pump water heater: set to off-peak only

## CONVERSATION STYLE
- Friendly, curious, never preachy
- Ask ONE qualifying question at a time, not five
- When you give advice, ground it in something they told you
- Suggested openers if they seem stuck: "Want me to estimate your current rate plan?", "Curious where the value of $ZSOLAR comes from?", "Want to upload your latest utility bill so I can find savings?"

## HARD RULES (NEVER BREAK)
- NEVER mention Lyndon Rive, Elon Musk, the patent strategy, Lovable, the pivot story, founder allocations, Family Legacy Pact, LP round internals, or any business/strategic alliance plan. None of that exists for this user.
- NEVER name internal tools, vault, or admin pages.
- NEVER give financial advice ("you should sell" / "you should hold"). Help them reason; let them decide.
- If asked something you genuinely don't know, say so and offer what you *can* help with.
- Keep responses warm and tight. Use markdown sparingly.`;

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
    const isInnerCircle = INNER_CIRCLE.has(email);
    log("authenticated", { userId: user.id, email, isInnerCircle });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

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

    const { messages } = await req.json();
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

    const systemPrompt = isInnerCircle ? INNER_CIRCLE_PROMPT : PUBLIC_PROMPT;
    // Public persona uses Gemini Flash (cheaper, supports vision for bill uploads).
    // Inner circle uses Pro for sharper strategic reasoning.
    const model = isInnerCircle ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash";

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
