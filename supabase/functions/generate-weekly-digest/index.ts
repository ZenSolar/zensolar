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

  // --- Fresh Tesla sync for target user (if connected). This makes "preview with real data"
  // actually reflect the latest readings instead of whatever was last cached. We do a best-effort
  // sync and continue even on failure — stale data is better than no preview.
  const { data: teslaTok } = await supabase
    .from('energy_tokens').select('user_id')
    .eq('user_id', targetUserId).eq('provider', 'tesla').maybeSingle()
  if (teslaTok) {
    try {
      const syncResp = await fetch(`${supabaseUrl}/functions/v1/tesla-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: serviceKey,
          Authorization: `Bearer ${jwt}`,
          'X-Target-User-Id': targetUserId,
        },
        body: JSON.stringify({}),
      })
      if (!syncResp.ok) {
        const detail = await syncResp.text().catch(() => '')
        console.warn('tesla-data pre-sync failed', syncResp.status, detail.slice(0, 200))
      } else {
        console.log('tesla-data pre-sync ok for', targetUserId)
      }
    } catch (e) {
      console.warn('tesla-data pre-sync threw', (e as Error).message)
    }

    try {
      const historyResp = await fetch(`${supabaseUrl}/functions/v1/tesla-historical`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: serviceKey,
          Authorization: `Bearer ${jwt}`,
          'X-Target-User-Id': targetUserId,
        },
        body: JSON.stringify({ days: 14 }),
      })
      if (!historyResp.ok) {
        const detail = await historyResp.text().catch(() => '')
        console.warn('tesla-historical weekly backfill failed', historyResp.status, detail.slice(0, 200))
      } else {
        console.log('tesla-historical weekly backfill ok for', targetUserId)
      }
    } catch (e) {
      console.warn('tesla-historical weekly backfill threw', (e as Error).message)
    }
  }

  // --- Window: last 7 days. Pull 14 days for cumulative counters so we can chain deltas.
  const now = new Date()
  const weekEnd = new Date(now)
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const leadStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const weekStartIso = weekStart.toISOString()
  const weekEndIso = weekEnd.toISOString()
  const leadStartIso = leadStart.toISOString()
  const weekStartDay = weekStart.toISOString().slice(0, 10)
  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  // --- Connected devices (canonical OEM source) — pulls the same baseline_data the dashboard uses
  const { data: devicesRows } = await supabase
    .from('connected_devices')
    .select('provider, device_type, device_name, device_id, baseline_data, lifetime_totals')
    .eq('user_id', targetUserId)

  // Classify each device into a canonical kind so per-device breakdown only shows the
  // metric the hardware actually produces (e.g., an EV never shows "battery discharged").
  const classifyKind = (dt: string): 'solar' | 'battery' | 'vehicle' | 'charger' | 'unknown' => {
    const t = (dt || '').toLowerCase()
    if (['solar', 'solar_system', 'pv_system', 'inverter'].includes(t)) return 'solar'
    if (['battery', 'powerwall', 'energy_site', 'energy_storage', 'storage'].includes(t)) return 'battery'
    if (['vehicle', 'ev', 'car', 'fsd_supervised_vehicle', 'fsd_unsupervised_vehicle', 'autopilot_vehicle', 'fsd_supervised', 'fsd_unsupervised', 'autonomous', 'robotaxi'].includes(t)) return 'vehicle'
    if (['wall_connector', 'charger', 'home_charger', 'evse'].includes(t)) return 'charger'
    return 'unknown'
  }

  type DeviceInfo = { label: string; provider: string; device_id: string; device_type: string; kind: ReturnType<typeof classifyKind> }
  const deviceMap = new Map<string, DeviceInfo>()
  for (const d of devicesRows || []) {
    const key = `${d.provider}:${d.device_id || d.device_type}`
    if (!deviceMap.has(key)) {
      deviceMap.set(key, {
        label: d.device_name || `${providerLabel(d.provider)} ${d.device_type || 'device'}`,
        provider: d.provider,
        device_id: d.device_id || '',
        device_type: d.device_type || '',
        kind: classifyKind(d.device_type || ''),
      })
    }
  }

  // Capability source-of-truth: if a dedicated non-Tesla solar provider (Enphase/SolarEdge) is
  // connected, that's the single OEM for solar — Tesla's solar readings are dropped to avoid
  // double-counting. Same rule for battery (a non-Tesla battery provider, if ever present, wins).
  const devicesArr = Array.from(deviceMap.values())
  const hasDedicatedSolar = devicesArr.some((d) => d.kind === 'solar' && d.provider?.toLowerCase() !== 'tesla')
  const hasDedicatedBattery = devicesArr.some((d) => d.kind === 'battery' && d.provider?.toLowerCase() !== 'tesla')


  // --- Pull 14d window of raw event rows (we'll normalize cumulative counters per-device per-day)
  const { data: prodRows } = await supabase
    .from('energy_production')
    .select('provider, data_type, production_wh, device_id, recorded_at')
    .eq('user_id', targetUserId)
    .gte('recorded_at', leadStartIso)
    .lte('recorded_at', weekEndIso)
    .limit(20000)

  // Per (deviceKey, dataType) → per-day MAX(production_wh) over the 14d window
  type DayMap = Map<string, number>
  const counterDay = new Map<string, DayMap>() // key: provider|deviceId|dataType
  const incrementalDay = new Map<string, DayMap>() // historical/incremental rows summed per day

  const isCumulativeCounter = (provider: string, dataType: string) => {
    const p = (provider || '').toLowerCase()
    // tesla / enphase / solaredge write running/lifetime cumulative values; *_historical and wallbox write incremental
    if (p.endsWith('_historical')) return false
    if (p === 'wallbox') return false
    if (p === 'tesla' || p === 'enphase' || p === 'solaredge') return true
    return false
  }

  for (const r of prodRows || []) {
    const dt = (r.data_type || '').toLowerCase()
    if (!dt) continue
    const wh = Number(r.production_wh) || 0
    if (!isFinite(wh)) continue
    const day = String(r.recorded_at).slice(0, 10)
    const key = `${r.provider}|${r.device_id || ''}|${dt}`
    if (isCumulativeCounter(r.provider, dt)) {
      let dm = counterDay.get(key)
      if (!dm) { dm = new Map(); counterDay.set(key, dm) }
      const prev = dm.get(day) ?? -Infinity
      if (wh > prev) dm.set(day, wh)
    } else {
      let dm = incrementalDay.get(key)
      if (!dm) { dm = new Map(); incrementalDay.set(key, dm) }
      dm.set(day, (dm.get(day) || 0) + wh)
    }
  }

  // Chain cumulative counters: delta[day] = max(0, max[day] - max[prevSampledDay]).
  // Sum only deltas whose day falls within the last 7 days.
  type MetricBuckets = { total: number; perProvider: Record<string, number>; perDevice: Record<string, number> }
  const buckets: Record<string, MetricBuckets> = {
    solar: { total: 0, perProvider: {}, perDevice: {} },
    battery: { total: 0, perProvider: {}, perDevice: {} },
    ev_miles: { total: 0, perProvider: {}, perDevice: {} },
    ev_charging: { total: 0, perProvider: {}, perDevice: {} },
  }
  const metricFor = (dt: string): keyof typeof buckets | null => {
    if (dt === 'solar') return 'solar'
    if (dt === 'battery_discharge' || dt === 'battery') return 'battery'
    if (dt === 'ev_miles') return 'ev_miles'
    if (dt === 'ev_charging') return 'ev_charging'
    return null
  }

  for (const [key, dm] of counterDay) {
    const [provider, deviceId, dt] = key.split('|')
    const metric = metricFor(dt)
    if (!metric) continue
    const days = Array.from(dm.keys()).sort()
    let prev: number | null = null
    for (const day of days) {
      const cur = dm.get(day)!
      if (prev !== null) {
        const delta = Math.max(0, cur - prev)
        if (day >= weekStartDay && delta > 0) {
          buckets[metric].total += delta
          buckets[metric].perProvider[provider.toLowerCase()] = (buckets[metric].perProvider[provider.toLowerCase()] || 0) + delta
          const devKey = `${provider}|${deviceId}`
          buckets[metric].perDevice[devKey] = (buckets[metric].perDevice[devKey] || 0) + delta
        }
      }
      prev = cur
    }
  }
  // Incremental rows: just sum the ones in the last 7 days
  for (const [key, dm] of incrementalDay) {
    const [provider, deviceId, dt] = key.split('|')
    const metric = metricFor(dt)
    if (!metric) continue
    for (const [day, val] of dm) {
      if (day < weekStartDay) continue
      buckets[metric].total += val
      buckets[metric].perProvider[provider.toLowerCase()] = (buckets[metric].perProvider[provider.toLowerCase()] || 0) + val
      const devKey = `${provider}|${deviceId}`
      buckets[metric].perDevice[devKey] = (buckets[metric].perDevice[devKey] || 0) + val
    }
  }

  // --- Capability dedup: one OEM per capability (matches Clean Energy Center rule).
  // If the user connected a dedicated solar provider (Enphase/SolarEdge), drop any
  // Tesla solar readings — Tesla Powerwalls with solar CTs would otherwise double-count.
  // Same rule for battery.
  const stripProvider = (metric: 'solar' | 'battery', provider: string) => {
    const p = provider.toLowerCase()
    const removed = buckets[metric].perProvider[p] || 0
    if (removed > 0) buckets[metric].total = Math.max(0, buckets[metric].total - removed)
    delete buckets[metric].perProvider[p]
    for (const k of Object.keys(buckets[metric].perDevice)) {
      if (k.toLowerCase().startsWith(`${p}|`)) delete buckets[metric].perDevice[k]
    }
  }
  if (hasDedicatedSolar) stripProvider('solar', 'tesla')
  if (hasDedicatedBattery) stripProvider('battery', 'tesla')

  const solarWh = buckets.solar.total
  const batteryWh = buckets.battery.total
  const teslaEvChargingWh = buckets.ev_charging.total // Wh on Tesla EV charging counter


  // --- EV miles: SAME source as the Clean Energy Center KPI.
  // The dashboard reads odometer from connected_devices (Tesla vehicle API). For a 7-day
  // window we use the snapshot history of THAT SAME field (energy_production rows of type
  // 'ev_miles'), restricted to provider='tesla' AND only the vehicle device_ids that are
  // registered in this user's connected_devices. Delta = max(within week) − max(just before
  // week start). No fallbacks, no cross-source estimates.
  const teslaVehicleIds = new Set(
    devicesArr
      .filter((d) => d.kind === 'vehicle' && d.provider?.toLowerCase() === 'tesla' && d.device_id)
      .map((d) => d.device_id),
  )
  let evMiles = 0
  let evDaysDriven = 0
  const evMilesPerDevice: Record<string, number> = {}
  for (const deviceId of teslaVehicleIds) {
    // Pull the latest odometer reading WITHIN the week from energy_production
    const { data: latestRows } = await supabase
      .from('energy_production')
      .select('production_wh, recorded_at')
      .eq('user_id', targetUserId)
      .eq('provider', 'tesla')
      .eq('data_type', 'ev_miles')
      .eq('device_id', deviceId)
      .gte('recorded_at', weekStartIso)
      .lte('recorded_at', weekEndIso)
      .order('recorded_at', { ascending: false })
      .limit(1)
    const latest = latestRows && latestRows[0] ? Number(latestRows[0].production_wh) : null

    // Baseline = MOST RECENT odometer snapshot strictly BEFORE the week start.
    // Tesla doesn't expose historical odometer, so we accept whatever prior sample exists
    // (could be weeks old). Without this fallback, users who synced less than weekly show 0 mi.
    const { data: priorRows } = await supabase
      .from('energy_production')
      .select('production_wh, recorded_at')
      .eq('user_id', targetUserId)
      .eq('provider', 'tesla')
      .eq('data_type', 'ev_miles')
      .eq('device_id', deviceId)
      .lt('recorded_at', weekStartIso)
      .order('recorded_at', { ascending: false })
      .limit(1)
    const baseline = priorRows && priorRows[0] ? Number(priorRows[0].production_wh) : null

    if (baseline !== null && latest !== null) {
      const delta = Math.max(0, latest - baseline)
      evMiles += delta
      evMilesPerDevice[`tesla|${deviceId}`] = delta
      if (delta > 0.1) evDaysDriven += 1
    }
  }



  // --- Home charging sessions (kWh) for the week — same source the dashboard uses
  const { data: hcRows } = await supabase
    .from('home_charging_sessions')
    .select('total_session_kwh, start_time')
    .eq('user_id', targetUserId)
    .gte('start_time', weekStartIso)
    .lte('start_time', weekEndIso)
    .limit(5000)
  let homeChargingKwh = 0
  let homeChargingSessions = 0
  for (const h of hcRows || []) {
    homeChargingKwh += Number(h.total_session_kwh) || 0
    homeChargingSessions += 1
  }

  // --- Supercharging / public charging (non-home) for the week
  const { data: scRows } = await supabase
    .from('charging_sessions')
    .select('energy_kwh, charging_type, provider')
    .eq('user_id', targetUserId)
    .gte('session_date', weekStartDay)
    .lte('session_date', weekEnd.toISOString().slice(0, 10))
    .limit(5000)
  let superchargerKwh = 0
  let superchargerSessions = 0
  for (const s of scRows || []) {
    if ((s.charging_type || '').toLowerCase() === 'home') continue
    superchargerKwh += Number(s.energy_kwh) || 0
    superchargerSessions += 1
  }

  // Tracked vehicle kWh consumed (for the KPI sub-line)
  const evKwh = homeChargingKwh + superchargerKwh + (teslaEvChargingWh / 1000)



  // --- Minting this week + lifetime (actual on-chain mints)
  const { data: mintWeek } = await supabase
    .from('mint_transactions')
    .select('tokens_minted')
    .eq('user_id', targetUserId).eq('status', 'success')
    .gte('created_at', weekStartIso)
    .lte('created_at', weekEndIso)
    .limit(500)
  const actualMintedThisWeek = (mintWeek || []).reduce((a: number, m: any) => a + (Number(m.tokens_minted) || 0), 0)

  const { data: mintLifetime } = await supabase
    .from('mint_transactions')
    .select('tokens_minted')
    .eq('user_id', targetUserId).eq('status', 'success')
    .limit(20000)
  const actualMintedLifetime = (mintLifetime || []).reduce((a: number, m: any) => a + (Number(m.tokens_minted) || 0), 0)

  // Tokens earned this week = GROSS 1:1 sum of every per-device number shown in the email
  // (1 kWh = 1 $ZSOLAR, 1 mi = 1 $ZSOLAR). Per tokenomics v3.0 — no multiplier, no splits.
  const weeklyActivityUnits =
    (solarWh / 1000) + (batteryWh / 1000) + evMiles + homeChargingKwh + superchargerKwh
  const tokensThisWeek = Math.floor(weeklyActivityUnits)
  const tokensLifetime = actualMintedLifetime + tokensThisWeek




  // Per-provider summaries used downstream (top-device + per-device breakdown)
  const perProviderSolar: Record<string, number> = buckets.solar.perProvider
  const perProviderBattery: Record<string, number> = buckets.battery.perProvider

  // CO2: standard grid emission factor ~0.4 kg/kWh avoided per renewable kWh
  const co2Kg = (solarWh / 1000) * 0.4 + (batteryWh / 1000) * 0.2

  // --- Build KPI rows
  const kpis: DigestPayload['kpis'] = []
  if (solarWh > 0) kpis.push({ label: 'Solar produced', value: `${fmt(solarWh / 1000)} kWh`, sub: 'Generated this week', accent: 'solar' })
  if (batteryWh > 0) kpis.push({ label: 'Battery exported', value: `${fmt(batteryWh / 1000)} kWh`, sub: 'Discharged to home', accent: 'battery' })
  if (evMiles > 0) kpis.push({ label: 'EV miles driven', value: `${fmtInt(evMiles)} mi`, sub: `${evDaysDriven} day${evDaysDriven === 1 ? '' : 's'} driven`, accent: 'ev' })
  if (homeChargingKwh > 0) kpis.push({ label: 'Home charging', value: `${fmt(homeChargingKwh)} kWh`, sub: `${homeChargingSessions} session${homeChargingSessions === 1 ? '' : 's'}`, accent: 'home' })
  if (superchargerKwh > 0) kpis.push({ label: 'Tesla Supercharging', value: `${fmt(superchargerKwh)} kWh`, sub: `${superchargerSessions} session${superchargerSessions === 1 ? '' : 's'}`, accent: 'super' })

  // --- Per-device breakdown — emit ONLY the metric the hardware actually produces.
  // A Tesla EV (vehicle) never shows "Battery discharged"; a Powerwall never shows
  // a solar line if a dedicated solar provider already owns that capability.
  const devices: DigestPayload['devices'] = []
  for (const [, d] of deviceMap) {
    const provLower = d.provider?.toLowerCase()
    if (d.kind === 'solar') {
      const solarFromThis = perProviderSolar[provLower] || 0
      if (solarFromThis > 0) devices.push({ label: d.label, provider: d.provider, metric: 'Solar produced', value: `${fmt(solarFromThis / 1000)} kWh` })
    } else if (d.kind === 'battery') {
      const battFromThis = perProviderBattery[provLower] || 0
      if (battFromThis > 0) devices.push({ label: d.label, provider: d.provider, metric: 'Battery discharged', value: `${fmt(battFromThis / 1000)} kWh` })
    }
    // vehicles + chargers are summarized via Home/Supercharging rows below
  }
  if (homeChargingKwh > 0) devices.push({ label: 'Home charger', provider: 'wallbox', metric: 'Home charging', value: `${fmt(homeChargingKwh)} kWh` })
  if (superchargerKwh > 0) devices.push({ label: 'Tesla Supercharging', provider: 'tesla', metric: 'Charging delivered', value: `${fmt(superchargerKwh)} kWh` })



  const quietWeek = kpis.length === 0 && tokensThisWeek === 0
  const hadPartialData = false // beta: keep false; future = compare expected device check-ins

  // --- Determine "device of the week" by kWh contribution (kind-aware)
  type DeviceContribution = { label: string; provider: string; kind: string; kwh: number };
  const contributions: DeviceContribution[] = [];
  for (const [, d] of deviceMap) {
    const provLower = d.provider?.toLowerCase();
    if (d.kind === 'solar') {
      const solar = (perProviderSolar[provLower] || 0) / 1000;
      if (solar > 0) contributions.push({ label: d.label, provider: d.provider, kind: 'solar', kwh: solar });
    } else if (d.kind === 'battery') {
      const batt = (perProviderBattery[provLower] || 0) / 1000;
      if (batt > 0) contributions.push({ label: d.label, provider: d.provider, kind: 'battery', kwh: batt });
    }
  }
  if (homeChargingKwh > 0) contributions.push({ label: 'Home charger', provider: 'wallbox', kind: 'home_charging', kwh: homeChargingKwh });
  if (superchargerKwh > 0) contributions.push({ label: 'Tesla Supercharging', provider: 'tesla', kind: 'supercharging', kwh: superchargerKwh });
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
  // send-transactional-email has verify_jwt = true, so we must forward the
  // caller's user JWT (admin is logged in). The service-role key is an
  // `sb_secret_…` (not a JWT) under the new signing-keys system and the
  // publishable/anon key is `sb_publishable_…` — both fail JWT validation.
  const idempotencyKey = `weekly-digest-${targetUserId}-${weekStart.toISOString().slice(0, 10)}`
  const sendResp = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      templateName: 'weekly-energy-digest',
      recipientEmail: email,
      idempotencyKey,
      templateData: payload,
    }),
  })

  if (!sendResp.ok) {
    const detail = await sendResp.text().catch(() => '')
    console.error('send-transactional-email failed', sendResp.status, detail)
    return new Response(JSON.stringify({ error: 'Failed to enqueue digest', detail: `${sendResp.status}: ${detail}` }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }


  return new Response(JSON.stringify({ success: true, recipient: email, payload }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
