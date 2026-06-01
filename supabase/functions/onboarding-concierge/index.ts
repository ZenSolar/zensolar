// AI Setup Concierge - extracts a structured SetupProfile from natural-language
// description of the user's solar / battery / EV / charger setup using Lovable AI tool-calling.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const LOVABLE_API_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

const tool = {
  type: 'function',
  function: {
    name: 'extract_setup_profile',
    description: 'Extract the user\'s home energy setup as a structured profile.',
    parameters: {
      type: 'object',
      properties: {
        solar: {
          type: 'object',
          properties: {
            present: { type: 'boolean' },
            brand: {
              type: 'string',
              enum: ['tesla', 'enphase', 'solaredge', 'other', 'unknown'],
              description: 'Which OAuth provider to use for the solar inverter.',
            },
            notes: { type: 'string' },
          },
          required: ['present', 'brand'],
          additionalProperties: false,
        },
        battery: {
          type: 'object',
          properties: {
            present: { type: 'boolean' },
            brand: {
              type: 'string',
              enum: ['tesla', 'enphase', 'solaredge', 'other', 'unknown'],
              description: 'Tesla Powerwall, Enphase IQ Battery, SolarEdge Home Battery, etc.',
            },
            notes: { type: 'string' },
          },
          required: ['present', 'brand'],
          additionalProperties: false,
        },
        vehicle: {
          type: 'object',
          properties: {
            present: { type: 'boolean' },
            brand: {
              type: 'string',
              enum: ['tesla', 'other', 'unknown'],
              description: 'Only Tesla is supported for telemetry today; "other" = present but unsupported.',
            },
            model: { type: 'string', description: 'e.g. "Model Y", "Model 3"' },
          },
          required: ['present', 'brand'],
          additionalProperties: false,
        },
        home_charger: {
          type: 'object',
          properties: {
            present: { type: 'boolean' },
            brand: {
              type: 'string',
              enum: ['tesla_wall_connector', 'wallbox', 'enphase', 'solaredge', 'chargepoint', 'other', 'vehicle_telemetry', 'none', 'unknown'],
              description: 'tesla_wall_connector/wallbox/enphase/solaredge connect via their own OAuth. chargepoint/other/vehicle_telemetry means we rely on EV onboard telemetry. none = no home charging.',
            },
            custom_label: { type: 'string', description: 'Free-text display label like "ChargePoint Home Flex" or "Apartment Shared L2"' },
          },
          required: ['present', 'brand'],
          additionalProperties: false,
        },
        living_situation: {
          type: 'string',
          enum: ['house', 'apartment_private', 'apartment_shared', 'other', 'unknown'],
        },
        confidence: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'How confident the extraction is. low = ask user to confirm/edit.',
        },
        summary: {
          type: 'string',
          description: 'One short sentence summarizing the plan back to the user in plain English.',
        },
      },
      required: ['solar', 'battery', 'vehicle', 'home_charger', 'living_situation', 'confidence', 'summary'],
      additionalProperties: false,
    },
  },
};

const SYSTEM_PROMPT = `You are the ZenSolar Setup Concierge. The user is onboarding and describes their home energy gear (solar panels, battery, EV, home charger) in plain English.

Your only job: call the extract_setup_profile tool with the best structured interpretation.

Rules:
- Map brand names to enums precisely. "Powerwall" => battery.brand=tesla. "IQ Battery" / "IQ8" => enphase. "Home Battery" + SolarEdge context => solaredge.
- Enphase and SolarEdge both sell L2 home chargers — if the user mentions one, set home_charger.brand accordingly.
- If user says "I plug into a regular outlet" or "garage outlet" or "Level 1" => home_charger.present=true, brand=vehicle_telemetry (we read kWh from the car).
- If user says "ChargePoint", "Grizzl-E", "Juicebox", etc. => brand=chargepoint or other + brand=vehicle_telemetry fallback. Put exact name in custom_label.
- Apartment + shared garage L2 => living_situation=apartment_shared, home_charger.brand=vehicle_telemetry.
- If something isn't mentioned, set present=false and brand=unknown — do NOT invent gear.
- summary: friendly one-liner like "Got it — Enphase solar + IQ Battery, Tesla Model Y, garage outlet. Connecting now."
- confidence=low if the description is vague or ambiguous; high if every field is clear.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Require authenticated user — prevents anonymous AI credit abuse
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const body = await req.json().catch(() => ({}));
    const description = String(body?.description ?? '').trim();
    if (!description || description.length < 3) {
      return new Response(JSON.stringify({ error: 'description is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (description.length > 2000) {
      return new Response(JSON.stringify({ error: 'description too long' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResp = await fetch(LOVABLE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: description },
        ],
        tools: [tool],
        tool_choice: { type: 'function', function: { name: 'extract_setup_profile' } },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limited, try again in a moment.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error('AI gateway error', aiResp.status, t);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: 'No structured output' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let profile: unknown;
    try {
      profile = JSON.parse(toolCall.function.arguments);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid extraction JSON' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ profile }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('concierge error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
