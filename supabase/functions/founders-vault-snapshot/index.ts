// Founders Vault — server-side snapshot endpoint.
// Computes net worth for both founders, never trusting client input for allocations or price.
// Only returns data when the caller is on the founder whitelist.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VaultStateRow {
  current_price_usd: number;
  total_supply: number;
  joseph_allocation: number;
  michael_allocation: number;
  joseph_trillionaire_price: number;
  michael_trillionaire_price: number;
  family_legacy_pact_active: boolean;
  pact_start_date: string;
  updated_at: string;
}

interface AccessRow {
  email: string;
  display_name: string;
  user_id: string | null;
  is_active?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller via JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return json({ error: "unauthorized" }, 401);
    }
    const user = userData.user;

    // Service-role client for trusted reads
    const admin = createClient(supabaseUrl, serviceKey);

    // 1. Confirm caller is whitelisted founder — match by user_id OR by email (auto-link)
    let { data: accessRow } = await admin
      .from("founder_vault_access")
      .select("email, display_name, user_id, is_active")
      .eq("user_id", user.id)
      .maybeSingle();

    // Self-heal: if no row by user_id, try matching by email and link it
    if (!accessRow && user.email) {
      const { data: emailRow } = await admin
        .from("founder_vault_access")
        .select("email, display_name, user_id, is_active")
        .ilike("email", user.email)
        .maybeSingle();

      if (emailRow && emailRow.is_active) {
        await admin
          .from("founder_vault_access")
          .update({ user_id: user.id })
          .ilike("email", user.email);

        // Also grant founder role
        await admin
          .from("user_roles")
          .upsert(
            { user_id: user.id, role: "founder" },
            { onConflict: "user_id,role", ignoreDuplicates: true },
          );

        accessRow = { ...emailRow, user_id: user.id };
      }
    }

    if (!accessRow || !accessRow.is_active) {
      const { data: adminRole } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (adminRole) {
        accessRow = {
          email: user.email ?? "",
          display_name:
            (user.user_metadata?.display_name as string | undefined) ??
            user.email ??
            "Admin",
          user_id: user.id,
          is_active: true,
        };
      }
    }

    if (!accessRow || !accessRow.is_active) {
      // Log denial
      await admin.from("vault_access_log").insert({
        user_id: user.id,
        event_type: "snapshot_denied",
        success: false,
        ip_address: req.headers.get("x-forwarded-for"),
        user_agent: req.headers.get("user-agent"),
      });
      return json({ error: "forbidden" }, 403);
    }

    // 2. Read vault state
    const { data: state, error: stateError } = await admin
      .from("vault_state")
      .select("*")
      .eq("id", 1)
      .maybeSingle<VaultStateRow>();

    if (stateError || !state) {
      return json({ error: "vault_uninitialized" }, 500);
    }

    // 3. All founder access rows (for side-by-side display)
    const { data: allFounders } = await admin
      .from("founder_vault_access")
      .select("email, display_name, user_id")
      .eq("is_active", true);

    // 4. Compute net worths
    const price = Number(state.current_price_usd);
    const joseph = {
      name: "Joseph Maushart",
      email: "jo@zen.solar",
      allocation: Number(state.joseph_allocation),
      net_worth: Number(state.joseph_allocation) * price,
      trillionaire_price: Number(state.joseph_trillionaire_price),
      progress_to_trillion: Math.min(
        1,
        price / Number(state.joseph_trillionaire_price),
      ),
    };
    const michael = {
      name: "Michael Tschida",
      email: "mjcheets@gmail.com",
      allocation: Number(state.michael_allocation),
      net_worth: Number(state.michael_allocation) * price,
      trillionaire_price: Number(state.michael_trillionaire_price),
      progress_to_trillion: Math.min(
        1,
        price / Number(state.michael_trillionaire_price),
      ),
    };

    const pactStart = new Date(state.pact_start_date);
    const pactDays = Math.floor(
      (Date.now() - pactStart.getTime()) / (1000 * 60 * 60 * 24),
    );

    // SolarCity → Tesla acquisition closed Nov 21, 2016
    const chapterTwoDays = Math.floor(
      (Date.now() - new Date("2016-11-21").getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // Log success
    await admin.from("vault_access_log").insert({
      user_id: user.id,
      event_type: "snapshot_read",
      success: true,
      ip_address: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });

    return json({
      viewer: {
        user_id: user.id,
        email: user.email,
        display_name: accessRow.display_name,
      },
      state: {
        current_price_usd: price,
        total_supply: Number(state.total_supply),
        family_legacy_pact_active: state.family_legacy_pact_active,
        pact_start_date: state.pact_start_date,
        pact_days_active: pactDays,
        chapter_two_days: chapterTwoDays,
        updated_at: state.updated_at,
      },
      founders: { joseph, michael },
      all_founders: allFounders ?? [],
      moonshot_targets: [
        { price: 0.10, label: "Launch (LP)" },
        { price: 1, label: "10x Launch" },
        { price: 5, label: "Top-3 Wealth" },
        { price: 6.67, label: "Joseph $1T" },
        { price: 10, label: "> Elon Today" },
        { price: 20, label: "Michael $1T" },
        { price: 50, label: "Multi-Trillionaires" },
        { price: 100, label: "Planetary" },
      ],
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[founders-vault-snapshot]", e);
    return json({ error: "internal" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
