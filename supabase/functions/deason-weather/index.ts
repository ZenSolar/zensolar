// Deason weather outlook. Returns placeholder when OPENWEATHER_API_KEY is
// absent so the hub UI can render a "coming soon" card without breaking.
// When the key is present, fetches OpenWeather One Call 3.0, caches 6h per
// user/lat/lon in deason_weather_cache.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY");

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "unauthorized" }, 401);

    // No key configured → placeholder. Always 200 so the client can render gracefully.
    if (!OPENWEATHER_API_KEY) {
      return json({
        status: "placeholder",
        message: "Weather forecast coming soon",
        hint: "An admin can enable live weather by adding the OpenWeather API key.",
      });
    }

    const { lat, lon } = await req.json().catch(() => ({ lat: null, lon: null }));
    if (typeof lat !== "number" || typeof lon !== "number") {
      return json({ status: "placeholder", message: "Weather forecast coming soon", reason: "no_location" });
    }

    const admin = createClient(SUPABASE_URL, SERVICE);

    // Cache lookup (round coords so nearby refreshes hit the cache).
    const rlat = Math.round(lat * 100) / 100;
    const rlon = Math.round(lon * 100) / 100;
    const { data: cached } = await admin
      .from("deason_weather_cache")
      .select("payload, fetched_at")
      .eq("user_id", user.id)
      .eq("lat", rlat)
      .eq("lon", rlon)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
      return json({ status: "ready", ...cached.payload, cached: true });
    }

    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${rlat}&lon=${rlon}&exclude=minutely,hourly,alerts&units=imperial&appid=${OPENWEATHER_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      return json({ status: "placeholder", message: "Weather temporarily unavailable", reason: `upstream_${res.status}` });
    }
    const raw = await res.json();
    const today = raw?.current
      ? { temp: raw.current.temp, condition: raw.current.weather?.[0]?.main, icon: raw.current.weather?.[0]?.icon }
      : null;
    const threeDay = (raw?.daily ?? []).slice(0, 3).map((d: Record<string, unknown>) => {
      const w = d as { dt: number; temp: { min: number; max: number }; weather: Array<{ main: string; icon: string }>; pop: number };
      return {
        date: new Date(w.dt * 1000).toISOString().slice(0, 10),
        tempMin: w.temp.min,
        tempMax: w.temp.max,
        condition: w.weather?.[0]?.main,
        icon: w.weather?.[0]?.icon,
        pop: w.pop,
      };
    });
    const payload = { today, threeDay };
    await admin.from("deason_weather_cache").insert({ user_id: user.id, lat: rlat, lon: rlon, payload });
    return json({ status: "ready", ...payload, cached: false });
  } catch (e) {
    return json({ status: "placeholder", message: "Weather forecast coming soon", reason: "exception", detail: String(e) });
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
