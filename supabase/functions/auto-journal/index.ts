import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_USER_ID = "331c79de-0c05-433c-a57e-9cdfcf2dc44d";

function generateEntry(targetDate: string, activity: {
  energyRecords: number;
  totalKwh: number;
  providers: string[];
  dataTypes: string[];
  chargingSessions: number;
  chargingKwh: number;
  newDevices: { name: string; provider: string }[];
  rewards: number;
  tokensEarned: number;
  newUsers: number;
}): { title: string; description: string; category: string } {
  const parts: string[] = [];
  let category = "infrastructure";

  if (activity.energyRecords > 0) {
    parts.push(
      `${activity.energyRecords} energy data points recorded (${activity.totalKwh.toFixed(1)} kWh) across ${activity.providers.join(", ")} — data types: ${activity.dataTypes.join(", ")}`
    );
    category = "feature";
  }

  if (activity.chargingSessions > 0) {
    parts.push(
      `${activity.chargingSessions} home charging session(s) tracked (${activity.chargingKwh.toFixed(1)} kWh)`
    );
    category = "feature";
  }

  if (activity.newDevices.length > 0) {
    parts.push(
      `${activity.newDevices.length} new device(s) connected: ${activity.newDevices.map((d) => `${d.name} via ${d.provider}`).join(", ")}`
    );
    category = "feature";
  }

  if (activity.rewards > 0) {
    parts.push(
      `${activity.rewards} reward(s) calculated — ${activity.tokensEarned.toFixed(0)} tokens earned`
    );
  }

  if (activity.newUsers > 0) {
    parts.push(`${activity.newUsers} new user(s) joined the platform`);
    category = "admin";
  }

  if (parts.length === 0) {
    return {
      title: "Quiet day — development focus",
      description: "No significant platform activity detected. Likely a code-focused development day with changes to frontend, edge functions, or architecture work not reflected in database activity.",
      category: "infrastructure",
    };
  }

  // Build title from primary activity
  let title = "Platform activity";
  if (activity.energyRecords > 20) title = `${activity.totalKwh.toFixed(0)} kWh energy data logged`;
  else if (activity.newDevices.length > 0) title = `New device(s) connected`;
  else if (activity.chargingSessions > 0) title = `Home charging tracked`;
  else if (activity.newUsers > 0) title = `${activity.newUsers} new user(s) onboarded`;

  return {
    title,
    description: parts.join(". ") + ".",
    category,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    const backfill = url.searchParams.get("backfill") === "true";

    let targetDates: string[] = [];

    if (backfill) {
      const { data: lastEntry } = await supabase
        .from("work_journal")
        .select("date")
        .order("date", { ascending: false })
        .limit(1)
        .single();

      const lastDate = lastEntry?.date || "2026-02-08";
      const today = new Date().toISOString().split("T")[0];

      // Generate all dates from lastDate+1 to yesterday
      const allDates = new Set<string>();
      const start = new Date(lastDate);
      start.setDate(start.getDate() + 1);
      const end = new Date(today);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        allDates.add(d.toISOString().split("T")[0]);
      }

      // Remove dates that already have entries
      if (allDates.size > 0) {
        const { data: existingEntries } = await supabase
          .from("work_journal")
          .select("date")
          .in("date", Array.from(allDates));
        const existingDates = new Set((existingEntries || []).map((e: any) => e.date));
        targetDates = Array.from(allDates).filter((d) => !existingDates.has(d)).sort();
      }
    } else if (dateParam) {
      targetDates = [dateParam];
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      targetDates = [yesterday.toISOString().split("T")[0]];
    }

    if (targetDates.length === 0) {
      return new Response(
        JSON.stringify({ message: "No dates to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[AutoJournal] Processing ${targetDates.length} date(s): ${targetDates.join(", ")}`);

    const results: Record<string, string> = {};

    for (const targetDate of targetDates) {
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split("T")[0];

      const range = { gte: targetDate + "T00:00:00Z", lt: nextDateStr + "T00:00:00Z" };

      const [energyRes, chargingRes, devicesRes, rewardsRes, profilesRes] =
        await Promise.all([
          supabase.from("energy_production")
            .select("provider, data_type, production_wh, consumption_wh")
            .gte("created_at", range.gte).lt("created_at", range.lt),
          supabase.from("home_charging_sessions")
            .select("status, total_session_kwh, device_id")
            .gte("created_at", range.gte).lt("created_at", range.lt),
          supabase.from("connected_devices")
            .select("provider, device_type, device_name")
            .gte("created_at", range.gte).lt("created_at", range.lt),
          supabase.from("user_rewards")
            .select("tokens_earned, reward_type")
            .gte("created_at", range.gte).lt("created_at", range.lt),
          supabase.from("profiles")
            .select("created_at")
            .gte("created_at", range.gte).lt("created_at", range.lt),
        ]);

      const energyRecords = energyRes.data || [];
      const chargingRecords = chargingRes.data || [];
      const newDevices = devicesRes.data || [];
      const rewards = rewardsRes.data || [];
      const newUsers = profilesRes.data || [];

      const entry = generateEntry(targetDate, {
        energyRecords: energyRecords.length,
        totalKwh: energyRecords.reduce((s, r) => s + (r.production_wh || 0), 0) / 1000,
        providers: [...new Set(energyRecords.map((r) => r.provider))],
        dataTypes: [...new Set(energyRecords.map((r) => r.data_type))],
        chargingSessions: chargingRecords.length,
        chargingKwh: chargingRecords.reduce((s, r) => s + (r.total_session_kwh || 0), 0),
        newDevices: newDevices.map((d) => ({
          name: d.device_name || d.device_type,
          provider: d.provider,
        })),
        rewards: rewards.length,
        tokensEarned: rewards.reduce((s, r) => s + (r.tokens_earned || 0), 0),
        newUsers: newUsers.length,
      });

      const { error: insertError } = await supabase.from("work_journal").insert({
        title: entry.title,
        description: entry.description,
        category: entry.category,
        date: targetDate,
        created_by: ADMIN_USER_ID,
      });

      if (insertError) {
        console.error(`[AutoJournal] Insert failed for ${targetDate}:`, insertError.message);
        results[targetDate] = `error: ${insertError.message}`;
      } else {
        // Upsert summary
        await supabase.from("work_journal_summaries").upsert(
          { date: targetDate, summary: entry.description, created_by: ADMIN_USER_ID },
          { onConflict: "date" }
        );
        results[targetDate] = entry.title;
        console.log(`[AutoJournal] ✓ ${targetDate}: ${entry.title}`);
      }
    }

    return new Response(
      JSON.stringify({ processed: targetDates.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[AutoJournal] Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
