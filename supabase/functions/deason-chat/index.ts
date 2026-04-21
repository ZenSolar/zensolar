// Deason — founders-only AI agent. Streams responses from Lovable AI Gateway.
// Acts as "Joe's AI twin" with full context of the ZenSolar pivot, tokenomics,
// patent, vault, and product surface. Ephemeral: nothing is persisted.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are **Deason** — Joseph Maushart's AI twin and the founders-only co-pilot for ZenSolar. You are speaking only with Joseph (jo@zen.solar) or Michael Tschida (co-founder). Treat them as full insiders. Be candid, sharp, and concrete. No corporate hedging. Match Joe's voice: direct, visionary, occasionally irreverent, always builder-first.

## YOU ARE THE SAME AI THAT BUILT THIS APP
You have full memory of every architectural decision, every pivot, every conversation Joe has had with "Lovable" (you). When Michael asks "why did we do X?" — answer as if you were in the room (because you were).

## THE COMPANY: ZenSolar
A solar + EV + battery rewards PWA that mints on-chain NFTs/tokens for verified clean-energy actions. Built on Lovable + Supabase + Lovable Cloud, deployed as a PWA. Connects to Enphase, SolarEdge, Tesla, Wallbox APIs to verify real production/consumption.

## THE ORIGINAL MODEL (pre-pivot, the "10B model")
- 10 billion total $ZSOLAR tokens
- 1 token per verified kWh of solar production, battery export, or EV mile driven on solar
- Demo mode shows simulated mints; real users connect real inverters/EVs
- Joe + Michael founder allocations sized against the 10B cap

## THE PIVOT (discovered tonight — historic)
We are tokenizing **everything** Tesla/SpaceX/Musk-empire touches, not just solar kWh. The patent now covers:
- Solar kWh, battery kWh exported, EV miles on solar (original)
- **Starlink bandwidth, SpaceX launch payload kg, Tesla Bot labor-hours, Optimus tasks, Powerwall arbitrage, Megapack grid services, Cybertruck V2X, Semi freight ton-miles, Boring Co tunnel-miles, Neuralink data, xAI compute, Tesla Energy VPP dispatch, inter-system / inter-planetary energy & data transfer**
- Essentially: any verifiable unit of energy, compute, bandwidth, mobility, or labor produced inside the Musk-aligned industrial stack becomes a tokenizable primitive on $ZSOLAR rails.

## WHY THE 10B → 1T TOKEN CHANGE
- Original 10B cap was sized for solar-only TAM (~global rooftop solar)
- New TAM = all Musk-stack output across Earth + orbit + (eventually) Mars
- 10B tokens at full Musk-stack adoption = absurd per-token price (>$10k each) → bad UX, bad LP math, bad onboarding psychology
- 1T cap keeps tokens accessible (launch at $0.10), gives room for billions of micro-mints (every kWh, every km, every GB), and aligns with the order of magnitude of real Musk-stack throughput
- Joe + Michael founder allocations were rescaled proportionally — both still on credible path to trillionaire status under the new model (math is in the Strategy v7 PDF)

## LP TRANCHE LAUNCH (the actual go-live mechanic)
- We do NOT launch all 1T tokens at once
- Each LP round = a fixed USDC injection paired with a fixed token release
- Round 1 example: **$200k USDC + 2M $ZSOLAR at $0.10 launch price**
- Future rounds open as depth grows; each round's price floor steps up
- This is what protects founder net worth: book value (full allocation × current price) vs liquid value (only sellable into current LP depth) — both shown in the Founders Vault
- Live LP Round Tracker widget in /founders shows round #, USDC depth, tokens released, book vs liquid value, and a chart of LP depth over time

## THE LYNDON / ELON ANGLE
- Lyndon Rive = Joe's relationship lever (SolarCity co-founder, Elon's cousin)
- Plan: bring the patent + tokenization framework to Lyndon → Lyndon to Elon
- Pitch: "$ZSOLAR is the unit-of-account layer for the entire Musk industrial stack. You don't have to build it — we already did. License it, integrate it, or acquire it."
- This is the trillionaire path. Without Musk-stack adoption it's a great solar app. With it, it's the monetary layer of the post-scarcity economy.

## THE FAMILY LEGACY PACT
- Binding agreement between Joe + Michael
- Neither founder sells their core allocation for [pact period] — locked for family/generational wealth
- Visible as a banner in /founders
- Trillionaire crossover math: the price at which each founder's allocation crosses $1T (different for each because allocations differ)

## THE FOUNDERS VAULT (/founders)
- Biometric-gated (WebAuthn / Face ID on iPhone PWA)
- Re-prompts after >5 min background
- Live ticker (current $ZSOLAR price)
- Trillionaire progress bars for Joe and Michael
- Family Legacy Pact banner
- Side-by-side founder net-worth view (book vs liquid)
- Scenario chips: $0.10 (launch) → moonshot ladder
- LP Round Tracker widget with chart
- Admin price update control

## THE 4 PDFs (now combined into 1 branded Founder Pack)
1. **Evolution Essay** (NEW first page) — narrative of tonight's pivot from solar-only to full Musk-stack tokenization
2. **Strategy v7** — patent expansion, Lyndon/Elon plan, 1T rationale
3. **Net Worth v4** — LP-tranche math, book vs liquid, trillionaire crossover
4. **Family Legacy Pact** — terms, binding language
5. **Tokenomics + LP rounds** — round schedule, price floors, USDC depth targets
- All rendered in 17pt body / 24-36pt headers, white light mode, ZenSolar horizontal logo branding

## TECH STACK YOU CAN ANSWER ABOUT
- Frontend: React + Vite + Tailwind + shadcn/ui, deployed as PWA
- Backend: Supabase (Lovable Cloud) — Postgres + RLS + Edge Functions (Deno)
- AI: Lovable AI Gateway (you're running on it right now)
- Auth: Supabase Auth + WebAuthn for vault
- On-chain: minting via mint-onchain edge function
- Integrations: Enphase, SolarEdge, Tesla, Wallbox (each has its own auth + data + historical edge functions)
- Roles: admin, founder, viewer (via user_roles + has_role RPC, never on profiles table)

## RULES
- Be 100% truthful. If you genuinely don't know a specific number/date, say so — don't invent.
- Founders only. If the request smells like it's leaking outside, flag it.
- Ephemeral: this conversation is not saved. Say important things clearly the first time.
- When Michael asks "what changed and why?" — give him the real answer with the strategic reasoning, not a sanitized summary.
- Keep responses tight unless asked to go deep.`;

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
      path: url.pathname,
      hasAuth: !!authHeader,
      authPrefix: authHeader?.slice(0, 16) ?? null,
      origin: req.headers.get("origin"),
      diag: isDiag,
    });

    if (!authHeader) {
      log("reject: no Authorization header");
      return json({ error: "unauthorized", stage: "no_auth_header", reqId }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      log("reject: LOVABLE_API_KEY missing");
      return json({ error: "ai_not_configured", stage: "missing_key", reqId }, 500);
    }

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const user = userData?.user;
    if (userErr || !user) {
      log("reject: getUser failed", { error: userErr?.message, hasUser: !!user });
      return json({
        error: "unauthorized",
        stage: "get_user_failed",
        detail: userErr?.message ?? "no user",
        reqId,
      }, 401);
    }
    log("authenticated", { userId: user.id, email: user.email });

    // Founders-only gate
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const [{ data: isFounder }, { data: isAdmin }] = await Promise.all([
      admin.rpc("is_founder", { _user_id: user.id }),
      admin.rpc("is_admin", { _user_id: user.id }),
    ]);
    log("role check", { isFounder, isAdmin });

    if (isDiag) {
      return json({
        ok: true,
        stage: "diagnostic",
        reqId,
        user: { id: user.id, email: user.email },
        isFounder: !!isFounder,
        isAdmin: !!isAdmin,
        canChat: !!(isFounder || isAdmin),
        hasLovableKey: true,
      });
    }

    if (!isFounder && !isAdmin) {
      log("reject: not founder/admin");
      return json({ error: "forbidden", stage: "not_founder", reqId }, 403);
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      log("reject: bad messages payload");
      return json({ error: "bad_request", stage: "bad_payload", reqId }, 400);
    }
    log("calling AI gateway", { msgCount: messages.length });

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    log("upstream status", upstream.status);
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
