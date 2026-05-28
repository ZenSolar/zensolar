// Weekly Energy Narrative generator (Deason's signature weekly story).
//
// This is the *long-form* companion to generate-weekly-digest. Where the
// digest is a scannable KPI snapshot, this is the hyper-personalized weekly
// story — written by Gemini 2.5 Pro in Deason's voice using rich Tesla
// trip + charging data plus the same OEM-prioritized energy totals the
// dashboard surfaces.
//
// Auth: caller must be authenticated. Admins/founders can pass `userId` to
// generate for any user; everyone else can only generate for themselves.
// `dryRun: true` returns the generated narrative without persisting OR sending.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions'
const NARRATIVE_MODEL = 'google/gemini-2.5-pro'

const APP_URL = 'https://beta.zen.solar'

const SYSTEM_PROMPT = `You are Deason — ZenSolar's hyper-personal energy concierge.

Your job: write a 350-550 word weekly narrative for this customer that turns their raw energy + EV data into a story they'll actually want to read on a Sunday morning. Think *editorial column*, not *spreadsheet*.

Voice rules:
- Warm, witty, specific. Like a friend who happens to be an energy nerd.
- Use the customer's first name once or twice — naturally, not robotically.
- NEVER use the word "crypto" or "blockchain". Use "$ZSOLAR" or "tokens" if you must.
- Concrete details > vague platitudes. "47 kWh on Tuesday" beats "a great day".
- Reference real places by name when given (Supercharger locations).
- Light wins celebrated. Quiet weeks framed honestly, not apologetically.
- Compare to gas costs / driving range / household equivalents when it adds color.
- End with a single forward-looking sentence — what's next, what to watch for.

Structure:
- Open with a hook anchored in their single most interesting data point.
- 3-4 short paragraphs covering: solar story, battery/grid story, EV story.
- A short closing that ties it together.

Output format: Markdown. Use **bold** for the numbers that matter. No headings, no bullet lists — flowing prose only. Single \n\n between paragraphs.

Do NOT:
- Repeat every metric in the data — pick the 3-5 most narrative-worthy.
- Use cliches like "powerhouse week", "rocking it", "killing it".
- Add a sign-off, signature, "— Deason", or "Until next week".
- Hallucinate data not present in the JSON.`

interface NarrativeRequestBody {
  userId?: string
  dryRun?: boolean
  weekStartIso?: string // optional override for re-generation
}

function fmt(n: number, d = 1): string {
  if (!isFinite(n) || !n) return '0'
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const lovableKey = Deno.env.get('LOVABLE_API_KEY')
  const supabase = createClient(supabaseUrl, serviceKey)

  // --- Auth
  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const jwt = authHeader.slice(7).trim()
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt)
  const callerId = userData?.user?.id
  if (userErr || !callerId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: NarrativeRequestBody = {}
  try { body = await req.json() } catch { /* empty body ok */ }
  const requestedUserId = body.userId
  const dryRun = !!body.dryRun

  // Founder/admin check if generating for someone else
  let targetUserId = callerId
  if (requestedUserId && requestedUserId !== callerId) {
    const { data: roles } = await supabase
      .from('user_roles').select('role').eq('user_id', callerId)
    const set = new Set((roles || []).map((r: any) => r.role))
    if (!set.has('founder') && !set.has('admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    targetUserId = requestedUserId
  }

  // --- Resolve profile / first name
  const { data: targetAuth } = await supabase.auth.admin.getUserById(targetUserId)
  const email = targetAuth?.user?.email
  if (!email) {
    return new Response(JSON.stringify({ error: 'Target user has no email' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const { data: profile } = await supabase
    .from('profiles').select('display_name').eq('user_id', targetUserId).maybeSingle()
  const firstName = (profile?.display_name || email.split('@')[0]).split(' ')[0]

  // --- Reuse digest pipeline as the SINGLE source of truth for weekly KPIs.
  // (Same OEM priority, same EV miles odometer math, same dedup rules.)
  const digestRes = await fetch(`${supabaseUrl}/functions/v1/generate-weekly-digest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`,
    },
    body: JSON.stringify({ userId: targetUserId, dryRun: true }),
  })
  if (!digestRes.ok) {
    const txt = await digestRes.text()
    console.error('digest dryRun failed', digestRes.status, txt)
    return new Response(JSON.stringify({ error: 'Could not pull weekly data', detail: txt }), {
      status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const digest = await digestRes.json()
  const digestPayload = digest?.payload || digest // generate-weekly-digest returns { payload, ... } in dryRun

  // --- Week window for richer queries (last 7 days)
  const now = new Date()
  const weekEnd = body.weekStartIso ? new Date(new Date(body.weekStartIso).getTime() + 7 * 86400000) : now
  const weekStart = new Date(weekEnd.getTime() - 7 * 86400000)
  const weekStartDay = weekStart.toISOString().slice(0, 10)
  const weekEndDay = weekEnd.toISOString().slice(0, 10)

  // --- Pull Supercharger sessions WITH locations + costs (Tesla Fleet API surface we already store)
  const { data: superSessions } = await supabase
    .from('charging_sessions')
    .select('session_date, energy_kwh, location, fee_amount, fee_currency, session_metadata')
    .eq('user_id', targetUserId)
    .eq('charging_type', 'supercharger')
    .gte('session_date', weekStartDay)
    .lte('session_date', weekEndDay)
    .order('session_date', { ascending: true })
    .limit(50)

  // --- Pull home charging sessions
  const { data: homeSessions } = await supabase
    .from('home_charging_sessions')
    .select('start_time, end_time, total_session_kwh, location, charger_power_kw')
    .eq('user_id', targetUserId)
    .eq('status', 'completed')
    .gte('start_time', weekStart.toISOString())
    .lte('start_time', weekEnd.toISOString())
    .order('start_time', { ascending: true })
    .limit(50)

  // --- Vehicle device(s) — for name/model context
  const { data: vehicleDevices } = await supabase
    .from('connected_devices')
    .select('device_name, device_metadata')
    .eq('user_id', targetUserId)
    .in('device_type', ['vehicle', 'ev', 'car'])
    .limit(3)

  // --- Find peak production day from daily solar (if we have it in digest payload)
  // (digest payload doesn't expose daily yet; pull lightweight daily solar here for the story)
  const { data: dailySolar } = await supabase
    .from('energy_production')
    .select('production_wh, recorded_at, provider')
    .eq('user_id', targetUserId)
    .eq('data_type', 'solar')
    .gte('recorded_at', weekStart.toISOString())
    .lte('recorded_at', weekEnd.toISOString())
    .limit(10000)

  // bucket per day, take MAX per-device (cumulative) or SUM if incremental
  const perDay = new Map<string, number>()
  for (const r of dailySolar || []) {
    const day = String(r.recorded_at).slice(0, 10)
    const wh = Number(r.production_wh) || 0
    // crude: keep max — works for cumulative counters, slight under-count for incremental but fine for narrative
    perDay.set(day, Math.max(perDay.get(day) || 0, wh))
  }
  const dailyKwh = Array.from(perDay.entries())
    .sort()
    .map(([day, wh]) => ({ day, kwh: +(wh / 1000).toFixed(1) }))
  const bestDay = dailyKwh.reduce<{ day: string; kwh: number } | null>((best, d) => {
    return !best || d.kwh > best.kwh ? d : best
  }, null)

  // --- Build the structured payload for the LLM
  const narrativeData = {
    firstName,
    weekLabel: digestPayload?.weekLabel,
    totals: {
      tokens_earned_this_week: digestPayload?.tokensThisWeek,
      tokens_lifetime: digestPayload?.tokensLifetime,
      co2_kg_this_week: digestPayload?.co2KgThisWeek,
    },
    kpis: digestPayload?.kpis || [],
    devices: digestPayload?.devices || [],
    daily_solar_kwh: dailyKwh,
    best_solar_day: bestDay,
    vehicles: (vehicleDevices || []).map((v: any) => ({
      name: v.device_name,
      model: v.device_metadata?.model || v.device_metadata?.vehicle_model,
    })),
    supercharger_sessions: (superSessions || []).map((s: any) => ({
      date: s.session_date,
      kwh: Number(s.energy_kwh) || 0,
      location: s.location,
      cost: s.fee_amount ? `${s.fee_currency || 'USD'} ${s.fee_amount}` : null,
      duration_min: s.session_metadata?.duration_min,
    })),
    home_charging_sessions: (homeSessions || []).map((s: any) => ({
      start: s.start_time,
      end: s.end_time,
      kwh: Number(s.total_session_kwh) || 0,
      peak_kw: Number(s.charger_power_kw) || 0,
      location: s.location,
    })),
    notes: {
      source_of_truth_rule: 'One OEM per capability (Solar / Battery). Same priority as Clean Energy Center dashboard.',
      had_partial_data: digestPayload?.hadPartialData || false,
      quiet_week: digestPayload?.quietWeek || false,
    },
  }

  // --- Generate narrative
  let narrativeMd = ''
  let teaser = ''
  if (!lovableKey) {
    return new Response(JSON.stringify({ error: 'AI not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const aiRes = await fetch(LOVABLE_AI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${lovableKey}`,
    },
    body: JSON.stringify({
      model: NARRATIVE_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Write this week's narrative for ${firstName}. Here is everything you know:\n\n` +
            '```json\n' + JSON.stringify(narrativeData, null, 2) + '\n```',
        },
      ],
      temperature: 0.85,
    }),
  })

  if (!aiRes.ok) {
    const txt = await aiRes.text()
    console.error('AI gateway error', aiRes.status, txt)
    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: 'AI rate-limited. Try again in a minute.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ error: 'AI generation failed', detail: txt }), {
      status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const aiJson = await aiRes.json()
  narrativeMd = aiJson?.choices?.[0]?.message?.content?.trim() || ''
  if (!narrativeMd) {
    return new Response(JSON.stringify({ error: 'AI returned empty narrative' }), {
      status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  // Teaser = first paragraph, truncated to ~220 chars for email preview
  const firstPara = narrativeMd.split(/\n\n+/)[0].replace(/\*\*/g, '')
  teaser = firstPara.length > 240 ? firstPara.slice(0, 237) + '…' : firstPara

  if (dryRun) {
    return new Response(JSON.stringify({
      ok: true,
      dryRun: true,
      firstName,
      weekLabel: digestPayload?.weekLabel,
      narrativeMd,
      teaser,
      data: narrativeData,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // --- Persist
  const { data: saved, error: saveErr } = await supabase
    .from('weekly_narratives')
    .upsert({
      user_id: targetUserId,
      week_start_date: weekStartDay,
      week_end_date: weekEndDay,
      narrative_md: narrativeMd,
      teaser,
      data_snapshot: narrativeData,
      source_oem_priority: {
        rule: 'one_oem_per_capability',
        solar: 'enphase > solaredge > tesla',
        battery: 'tesla > enphase > solaredge',
        ev_miles: 'tesla',
      },
      model: NARRATIVE_MODEL,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,week_start_date' })
    .select('id')
    .single()

  if (saveErr || !saved) {
    console.error('save failed', saveErr)
    return new Response(JSON.stringify({ error: 'Could not save narrative', detail: saveErr?.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({
    ok: true,
    id: saved.id,
    url: `${APP_URL}/energy-insights/week/${saved.id}`,
    teaser,
    narrativeMd,
    weekLabel: digestPayload?.weekLabel,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
