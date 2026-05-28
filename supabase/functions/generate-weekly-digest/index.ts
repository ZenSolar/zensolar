// Weekly Energy Digest generator (beta).
// Pulls last 7 days of energy + minting data for a user, asks Lovable AI
// for a short narrative, then enqueues the `weekly-energy-digest` template
// via the existing `send-transactional-email` function.
//
// Auth: caller must be authenticated. A founder/admin can pass `userId` to
// generate for any user; non-founders can only generate for themselves.
// `dryRun: true` returns the rendered payload without sending.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions'
const NARRATIVE_MODEL = 'google/gemini-2.5-flash'

interface DigestPayload {
  firstName?: string
  weekLabel: string
  narrative?: string
  tokensThisWeek: string
  tokensLifetime: string
  co2KgThisWeek: string
  kpis: Array<{ label: string; value: string; sub?: string; accent?: string }>
  devices: Array<{ label: string; provider: string; metric: string; value: string; partial?: boolean }>
  hadPartialData: boolean
  quietWeek: boolean
}

function fmt(n: number, digits = 1): string {
  if (!isFinite(n)) return '0'
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

function providerLabel(p: string): string {
  switch (p?.toLowerCase()) {
    case 'tesla': return 'Tesla'
    case 'enphase': return 'Enphase'
    case 'solaredge': return 'SolarEdge'
    case 'wallbox': return 'Wallbox'
    default: return p || 'Device'
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const lovableKey = Deno.env.get('LOVABLE_API_KEY')
  const supabase = createClient(supabaseUrl, serviceKey)

  // --- Auth: identify caller from JWT
  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized: missing bearer token' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const jwt = authHeader.slice(7).trim()
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt)
  const callerId = userData?.user?.id
  if (userErr || !callerId) {
    console.error('auth.getUser failed', userErr)
    return new Response(JSON.stringify({ error: 'Unauthorized', detail: userErr?.message }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const caller = { id: callerId }



  let body: any = {}
  try { body = await req.json() } catch { /* empty body ok */ }
  const requestedUserId: string | undefined = body.userId
  const dryRun: boolean = !!body.dryRun

  // Founder check if generating for someone else
  let targetUserId = caller.id
  if (requestedUserId && requestedUserId !== caller.id) {
    const { data: roles } = await supabase
      .from('user_roles').select('role').eq('user_id', caller.id)
    const set = new Set((roles || []).map((r: any) => r.role))
    if (!set.has('founder') && !set.has('admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    targetUserId = requestedUserId
  }

  // --- Resolve recipient email + name
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

  // --- Window: last 7 full days (UTC)
  const now = new Date()
  const weekEnd = new Date(now)
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const weekStartIso = weekStart.toISOString()
  const weekEndIso = weekEnd.toISOString()
  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  // --- Pull energy data (production / consumption / battery)
  const { data: prodRows } = await supabase
    .from('energy_production')
    .select('provider, data_type, production_wh, consumption_wh')
    .eq('user_id', targetUserId)
    .gte('recorded_at', weekStartIso)
    .lte('recorded_at', weekEndIso)
    .limit(5000)

  let solarWh = 0
  let batteryWh = 0
  const perProviderSolar: Record<string, number> = {}
  const perProviderBattery: Record<string, number> = {}
  for (const r of prodRows || []) {
    const dt = (r.data_type || '').toLowerCase()
    const wh = Number(r.production_wh) || 0
    if (dt === 'solar' || dt === 'production' || dt === '') {
      solarWh += wh
      perProviderSolar[r.provider] = (perProviderSolar[r.provider] || 0) + wh
    } else if (dt === 'battery' || dt === 'battery_discharge') {
      batteryWh += wh
      perProviderBattery[r.provider] = (perProviderBattery[r.provider] || 0) + wh
    }
  }

  // --- Supercharger / public charging sessions
  const { data: scRows } = await supabase
    .from('charging_sessions')
    .select('energy_kwh, charging_type, provider')
    .eq('user_id', targetUserId)
    .gte('session_date', weekStart.toISOString().slice(0, 10))
    .lte('session_date', weekEnd.toISOString().slice(0, 10))
    .limit(2000)

  let superchargerKwh = 0
  let superchargerSessions = 0
  for (const s of scRows || []) {
    superchargerKwh += Number(s.energy_kwh) || 0
    superchargerSessions += 1
  }

  // --- Home charging sessions
  const { data: hcRows } = await supabase
    .from('home_charging_sessions')
    .select('total_session_kwh')
    .eq('user_id', targetUserId)
    .gte('start_time', weekStartIso)
    .lte('start_time', weekEndIso)
    .limit(2000)

  let homeChargingKwh = 0
  for (const h of hcRows || []) {
    homeChargingKwh += Number(h.total_session_kwh) || 0
  }

  // --- EV miles approx: 3.5 mi/kWh on EV-related energy. Use any device_type='ev' charging or fallback to home+super.
  const evKwh = homeChargingKwh + superchargerKwh
  const evMiles = evKwh * 3.5

  // --- Minting this week + lifetime
  const { data: mintWeek } = await supabase
    .from('mint_transactions')
    .select('tokens_minted')
    .eq('user_id', targetUserId).eq('status', 'success')
    .gte('created_at', weekStartIso)
    .lte('created_at', weekEndIso)
    .limit(500)
  const tokensThisWeek = (mintWeek || []).reduce((a: number, m: any) => a + (Number(m.tokens_minted) || 0), 0)

  const { data: mintLifetime } = await supabase
    .from('mint_transactions')
    .select('tokens_minted')
    .eq('user_id', targetUserId).eq('status', 'success')
    .limit(20000)
  const tokensLifetime = (mintLifetime || []).reduce((a: number, m: any) => a + (Number(m.tokens_minted) || 0), 0)

  // --- Connected devices
  const { data: devicesRows } = await supabase
    .from('connected_devices')
    .select('provider, device_type, device_name')
    .eq('user_id', targetUserId)
  const deviceMap = new Map<string, { label: string; provider: string }>()
  for (const d of devicesRows || []) {
    const key = `${d.provider}:${d.device_type}`
    if (!deviceMap.has(key)) {
      deviceMap.set(key, {
        label: d.device_name || `${providerLabel(d.provider)} ${d.device_type || 'device'}`,
        provider: d.provider,
      })
    }
  }

  // CO2: standard grid emission factor ~0.4 kg/kWh avoided per renewable kWh
  const co2Kg = (solarWh / 1000) * 0.4 + (batteryWh / 1000) * 0.2

  // --- Build KPI rows
  const kpis: DigestPayload['kpis'] = []
  if (solarWh > 0) kpis.push({ label: 'Solar produced', value: `${fmt(solarWh / 1000)} kWh`, accent: 'solar' })
  if (batteryWh > 0) kpis.push({ label: 'Battery exported', value: `${fmt(batteryWh / 1000)} kWh`, sub: 'Peak-hour offset', accent: 'battery' })
  if (evMiles > 0) kpis.push({ label: 'EV miles driven', value: `${fmtInt(evMiles)} mi`, sub: `${fmt(evKwh)} kWh consumed`, accent: 'ev' })
  if (homeChargingKwh > 0) kpis.push({ label: 'Home charging', value: `${fmt(homeChargingKwh)} kWh`, accent: 'home' })
  if (superchargerKwh > 0) kpis.push({ label: 'Supercharging', value: `${fmt(superchargerKwh)} kWh`, sub: `${superchargerSessions} session${superchargerSessions === 1 ? '' : 's'}`, accent: 'super' })

  // --- Per-device breakdown
  const devices: DigestPayload['devices'] = []
  for (const [, d] of deviceMap) {
    const provLower = d.provider?.toLowerCase()
    const solarFromThis = perProviderSolar[provLower] || 0
    const battFromThis = perProviderBattery[provLower] || 0
    if (solarFromThis > 0) devices.push({ label: d.label, provider: d.provider, metric: 'Solar produced', value: `${fmt(solarFromThis / 1000)} kWh` })
    if (battFromThis > 0) devices.push({ label: d.label, provider: d.provider, metric: 'Battery discharged', value: `${fmt(battFromThis / 1000)} kWh` })
  }
  if (homeChargingKwh > 0) devices.push({ label: 'Home charger', provider: 'wallbox', metric: 'Home charging', value: `${fmt(homeChargingKwh)} kWh` })
  if (superchargerKwh > 0) devices.push({ label: 'Public/Supercharger', provider: 'tesla', metric: 'Charging delivered', value: `${fmt(superchargerKwh)} kWh` })

  const quietWeek = kpis.length === 0 && tokensThisWeek === 0
  const hadPartialData = false // beta: keep false; future = compare expected device check-ins

  // --- Determine "device of the week" by kWh contribution
  type DeviceContribution = { label: string; provider: string; kind: string; kwh: number };
  const contributions: DeviceContribution[] = [];
  for (const [, d] of deviceMap) {
    const provLower = d.provider?.toLowerCase();
    const solar = (perProviderSolar[provLower] || 0) / 1000;
    const batt = (perProviderBattery[provLower] || 0) / 1000;
    if (solar > 0) contributions.push({ label: d.label, provider: d.provider, kind: 'solar', kwh: solar });
    if (batt > 0) contributions.push({ label: d.label, provider: d.provider, kind: 'battery', kwh: batt });
  }
  if (homeChargingKwh > 0) contributions.push({ label: 'Home charger', provider: 'wallbox', kind: 'home_charging', kwh: homeChargingKwh });
  if (superchargerKwh > 0) contributions.push({ label: 'Public/Supercharger', provider: 'tesla', kind: 'supercharging', kwh: superchargerKwh });
  contributions.sort((a, b) => b.kwh - a.kwh);
  const topDevice = contributions[0];

  // --- Tesla EV detail (for personalized driving/charging copy)
  const hasTeslaEV = Array.from(deviceMap.values()).some(
    (d) => d.provider?.toLowerCase() === 'tesla' && /ev|vehicle|car|model/i.test(d.label)
  );
  const teslaEV = hasTeslaEV
    ? {
        miles_driven: Math.round(evMiles),
        home_charging_kwh: +homeChargingKwh.toFixed(1),
        supercharging_kwh: +superchargerKwh.toFixed(1),
        supercharger_sessions: superchargerSessions,
        pct_from_home: evKwh > 0 ? Math.round((homeChargingKwh / evKwh) * 100) : 0,
      }
    : null;

  // --- AI narrative (Gemini 2.5 Flash via Lovable AI Gateway)
  let narrative: string | undefined
  if (!quietWeek && lovableKey) {
    try {
      const summary = {
        solar_kwh: +(solarWh / 1000).toFixed(1),
        battery_kwh: +(batteryWh / 1000).toFixed(1),
        ev_miles: Math.round(evMiles),
        home_charging_kwh: +homeChargingKwh.toFixed(1),
        supercharging_kwh: +superchargerKwh.toFixed(1),
        tokens_this_week: +tokensThisWeek.toFixed(1),
        tokens_lifetime: +tokensLifetime.toFixed(1),
        co2_kg: +co2Kg.toFixed(1),
        devices: Array.from(deviceMap.values()).map((d) => d.label),
        top_device: topDevice
          ? { label: topDevice.label, contribution: `${topDevice.kwh.toFixed(1)} kWh ${topDevice.kind.replace('_', ' ')}` }
          : null,
        tesla_ev: teslaEV,
      }
      const aiRes = await fetch(LOVABLE_AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${lovableKey}`,
        },
        body: JSON.stringify({
          model: NARRATIVE_MODEL,
          messages: [
            {
              role: 'system',
              content:
                'You are Deason, the ZenSolar copilot. Write the 2-4 sentence opening for a weekly energy digest email. Conversational, second person ("you / your"). Reference SPECIFIC numbers from the data. ' +
                'Rules: (1) Lead with the user\'s top_device — call it out by name as the device that did the most work this week and quote its contribution. ' +
                '(2) If tesla_ev is present, add one tight sentence about their driving and charging mix this week (miles + % from home solar vs supercharging). ' +
                '(3) Never use crypto jargon — say "$ZSOLAR earned" not "minted tokens". No emojis. No greetings. Just the body paragraph.',
            },
            { role: 'user', content: `Week data for ${firstName}: ${JSON.stringify(summary)}` },
          ],
        }),
      })
      if (aiRes.ok) {
        const j = await aiRes.json()
        narrative = j?.choices?.[0]?.message?.content?.trim()
      } else {
        console.warn('AI narrative failed', aiRes.status, await aiRes.text())
      }
    } catch (e) {
      console.error('AI narrative error', e)
    }
  }


  const payload: DigestPayload = {
    firstName,
    weekLabel,
    narrative,
    tokensThisWeek: fmt(tokensThisWeek),
    tokensLifetime: fmt(tokensLifetime),
    co2KgThisWeek: fmt(co2Kg),
    kpis,
    devices,
    hadPartialData,
    quietWeek,
  }

  if (dryRun) {
    return new Response(JSON.stringify({ success: true, dryRun: true, recipient: email, payload }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // --- Enqueue via send-transactional-email
  const idempotencyKey = `weekly-digest-${targetUserId}-${weekStart.toISOString().slice(0, 10)}`
  const sendRes = await supabase.functions.invoke('send-transactional-email', {
    body: {
      templateName: 'weekly-energy-digest',
      recipientEmail: email,
      idempotencyKey,
      templateData: payload,
    },
  })

  if (sendRes.error) {
    console.error('send-transactional-email failed', sendRes.error)
    return new Response(JSON.stringify({ error: 'Failed to enqueue digest', detail: sendRes.error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true, recipient: email, payload }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
