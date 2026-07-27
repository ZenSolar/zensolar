// Admin-only: temporarily release a device claim for beta onboarding
// testing, then restore it with original baselines intact.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Mode = "snapshot_and_release" | "restore";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return json(401, { error: "no_auth" });

    const { data: userRes, error: uErr } = await admin.auth.getUser(auth.replace("Bearer ", ""));
    if (uErr || !userRes.user) return json(401, { error: "unauthorized" });
    const adminUserId = userRes.user.id;

    // Enforce admin role
    const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: adminUserId });
    if (isAdmin !== true) return json(403, { error: "admin_only" });

    const body = await req.json().catch(() => ({}));
    const provider: string | undefined = body?.provider;
    const device_id: string | undefined = body?.device_id;
    const mode: Mode | undefined = body?.mode;
    const notes: string | null = body?.notes ?? null;

    if (!provider || !device_id || !mode) return json(400, { error: "missing_fields" });
    if (!["snapshot_and_release", "restore"].includes(mode)) return json(400, { error: "bad_mode" });

    if (mode === "snapshot_and_release") {
      // Load device belonging to this admin
      const { data: dev, error: dErr } = await admin
        .from("connected_devices")
        .select("*")
        .eq("provider", provider)
        .eq("device_id", device_id)
        .eq("user_id", adminUserId)
        .maybeSingle();
      if (dErr) return json(500, { error: "load_failed", detail: dErr.message });
      if (!dev) return json(404, { error: "device_not_found_or_not_yours" });

      // Refuse if already released and not restored
      const { data: openSnap } = await admin
        .from("admin_device_snapshots")
        .select("id")
        .eq("provider", provider)
        .eq("device_id", device_id)
        .is("restored_at", null)
        .maybeSingle();
      if (openSnap) return json(409, { error: "already_released", snapshot_id: openSnap.id });

      // Insert snapshot capturing everything we need to restore
      const { data: snap, error: sErr } = await admin
        .from("admin_device_snapshots")
        .insert({
          admin_user_id: adminUserId,
          provider,
          device_id,
          device_type: dev.device_type,
          device_name: dev.device_name,
          device_metadata: dev.device_metadata,
          baseline_data: dev.baseline_data,
          lifetime_totals: dev.lifetime_totals,
          last_known_state: dev.last_known_state,
          home_charging_source: dev.home_charging_source,
          home_charger_brand: dev.home_charger_brand,
          home_setup_type: dev.home_setup_type,
          home_location: dev.home_location,
          notes,
        })
        .select("id")
        .single();
      if (sErr) return json(500, { error: "snapshot_failed", detail: sErr.message });

      // Delete the claim so a burner account can claim during testing.
      // (_device_release_capture trigger also archives this; additive.)
      const { error: delErr } = await admin
        .from("connected_devices")
        .delete()
        .eq("provider", provider)
        .eq("device_id", device_id)
        .eq("user_id", adminUserId);
      if (delErr) return json(500, { error: "delete_failed", detail: delErr.message });

      // Flip profile flag off only if no other device of same provider remains
      const { count } = await admin
        .from("connected_devices")
        .select("id", { count: "exact", head: true })
        .eq("user_id", adminUserId)
        .eq("provider", provider);
      if ((count ?? 0) === 0) {
        const col = `${provider}_connected`;
        await admin.from("profiles").update({ [col]: false }).eq("user_id", adminUserId);
      }

      return json(200, { ok: true, mode, snapshot_id: snap.id });
    }

    // mode === "restore"
    const { data: snap, error: sErr } = await admin
      .from("admin_device_snapshots")
      .select("*")
      .eq("provider", provider)
      .eq("device_id", device_id)
      .eq("admin_user_id", adminUserId)
      .is("restored_at", null)
      .order("released_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sErr) return json(500, { error: "snapshot_load_failed", detail: sErr.message });
    if (!snap) return json(404, { error: "no_active_snapshot" });

    // Identify any burner user who claimed this device during the test window
    const { data: current } = await admin
      .from("connected_devices")
      .select("user_id")
      .eq("provider", provider)
      .eq("device_id", device_id)
      .maybeSingle();
    const burnerUserId = current?.user_id ?? null;

    // Purge burner artifacts scoped to this device_id
    if (burnerUserId && burnerUserId !== adminUserId) {
      await admin
        .from("connected_devices")
        .delete()
        .eq("provider", provider)
        .eq("device_id", device_id)
        .eq("user_id", burnerUserId);
      await admin
        .from("energy_tokens")
        .delete()
        .eq("provider", provider)
        .eq("user_id", burnerUserId);
      // Only purge energy_production rows for this device created after release
      await admin
        .from("energy_production")
        .delete()
        .eq("provider", provider)
        .eq("device_id", device_id)
        .eq("user_id", burnerUserId)
        .gte("created_at", snap.released_at);
    } else if (current) {
      // Same admin still owns it (never got claimed by burner) — just remove so we can re-insert cleanly with original baseline.
      await admin
        .from("connected_devices")
        .delete()
        .eq("provider", provider)
        .eq("device_id", device_id);
    }

    // Re-insert with original baselines preserved
    const { error: iErr } = await admin.from("connected_devices").insert({
      user_id: adminUserId,
      provider,
      device_id,
      device_type: snap.device_type,
      device_name: snap.device_name,
      device_metadata: snap.device_metadata,
      baseline_data: snap.baseline_data ?? {},
      lifetime_totals: snap.lifetime_totals ?? {},
      last_known_state: snap.last_known_state ?? {},
      home_charging_source: snap.home_charging_source,
      home_charger_brand: snap.home_charger_brand,
      home_setup_type: snap.home_setup_type,
      home_location: snap.home_location,
      paused_for_testing: false,
    });
    if (iErr) return json(500, { error: "restore_insert_failed", detail: iErr.message });

    const col = `${provider}_connected`;
    await admin.from("profiles").update({ [col]: true }).eq("user_id", adminUserId);

    await admin
      .from("admin_device_snapshots")
      .update({ restored_at: new Date().toISOString() })
      .eq("id", snap.id);

    return json(200, {
      ok: true,
      mode,
      snapshot_id: snap.id,
      purged_burner_user_id: burnerUserId && burnerUserId !== adminUserId ? burnerUserId : null,
    });
  } catch (e) {
    return json(500, { error: "unhandled", detail: String((e as Error).message ?? e) });
  }
});
