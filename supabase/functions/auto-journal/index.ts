import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_USER_ID = "331c79de-0c05-433c-a57e-9cdfcf2dc44d";

// ─── Edge Function Manifest ───
// Update this list whenever edge functions are added/removed from the codebase.
// The auto-journal will detect additions/removals by diffing against the stored snapshot.
const EDGE_FUNCTION_MANIFEST = [
  { name: "auto-journal", description: "Daily dev journal — schema diff & edge function tracking" },
  { name: "calculate-rewards", description: "Calculate user energy rewards and token earnings" },
  { name: "enphase-data", description: "Fetch solar/battery data from Enphase API" },
  { name: "get-turnstile-site-key", description: "Return Cloudflare Turnstile site key for bot protection" },
  { name: "mint-onchain", description: "Mint tokens and NFTs on Base L2 blockchain" },
  { name: "tesla-charge-monitor", description: "Monitor Tesla vehicle charging state for home charging detection" },
  { name: "tesla-data", description: "Fetch solar, battery, EV data from Tesla API with proof-of-delta chains" },
];

// ─── Types ───

interface SchemaSnapshot {
  tables: { table_name: string }[];
  columns: { table_name: string; column_name: string; data_type: string; is_nullable: string }[];
  policies: { table_name: string; policy_name: string; cmd: string; permissive: string }[];
  functions: { function_name: string; return_type: string }[];
}

interface EdgeFnEntry { name: string; description: string }

interface JournalEntry {
  title: string;
  description: string;
  category: string;
}

// ─── Diff Logic ───

function diffEdgeFunctions(prev: EdgeFnEntry[], curr: EdgeFnEntry[]): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const prevNames = new Set(prev.map(f => f.name));
  const currNames = new Set(curr.map(f => f.name));

  for (const fn of curr) {
    if (!prevNames.has(fn.name)) {
      entries.push({
        title: `New edge function: ${fn.name}`,
        description: `Deployed new backend function "${fn.name}" — ${fn.description}.`,
        category: "feature",
      });
    }
  }

  for (const fn of prev) {
    if (!currNames.has(fn.name)) {
      entries.push({
        title: `Edge function removed: ${fn.name}`,
        description: `The "${fn.name}" backend function was removed — ${fn.description}.`,
        category: "infrastructure",
      });
    }
  }

  return entries;
}

function diffSchema(prev: SchemaSnapshot, curr: SchemaSnapshot): JournalEntry[] {
  const entries: JournalEntry[] = [];
  const prevTableNames = new Set(prev.tables.map(t => t.table_name));
  const currTableNames = new Set(curr.tables.map(t => t.table_name));

  // New tables
  for (const t of curr.tables) {
    if (!prevTableNames.has(t.table_name)) {
      const cols = curr.columns.filter(c => c.table_name === t.table_name);
      const colList = cols.map(c => `${c.column_name} (${c.data_type})`).join(", ");
      const policies = curr.policies.filter(p => p.table_name === t.table_name);
      const policyNote = policies.length > 0
        ? ` RLS enabled with ${policies.length} ${policies.length === 1 ? "policy" : "policies"}: ${policies.map(p => p.policy_name).join(", ")}.`
        : " No RLS policies configured yet.";
      entries.push({
        title: `New table: ${t.table_name}`,
        description: `Created ${t.table_name} table with ${cols.length} columns: ${colList}.${policyNote}`,
        category: "database",
      });
    }
  }

  // Dropped tables
  for (const t of prev.tables) {
    if (!currTableNames.has(t.table_name)) {
      entries.push({
        title: `Table removed: ${t.table_name}`,
        description: `The ${t.table_name} table was dropped from the public schema.`,
        category: "database",
      });
    }
  }

  // New columns on existing tables
  const prevColKeys = new Set(prev.columns.map(c => `${c.table_name}.${c.column_name}`));
  const newColsByTable = new Map<string, typeof curr.columns>();
  for (const c of curr.columns) {
    if (!prevColKeys.has(`${c.table_name}.${c.column_name}`) && prevTableNames.has(c.table_name)) {
      if (!newColsByTable.has(c.table_name)) newColsByTable.set(c.table_name, []);
      newColsByTable.get(c.table_name)!.push(c);
    }
  }
  for (const [table, cols] of newColsByTable) {
    const colDesc = cols.map(c => `${c.column_name} (${c.data_type}, ${c.is_nullable === "YES" ? "nullable" : "not null"})`).join(", ");
    entries.push({
      title: `${table} — ${cols.length} new column${cols.length > 1 ? "s" : ""} added`,
      description: `Added ${colDesc} to the ${table} table.`,
      category: "database",
    });
  }

  // Dropped columns
  const currColKeys = new Set(curr.columns.map(c => `${c.table_name}.${c.column_name}`));
  const droppedColsByTable = new Map<string, typeof prev.columns>();
  for (const c of prev.columns) {
    if (!currColKeys.has(`${c.table_name}.${c.column_name}`) && currTableNames.has(c.table_name)) {
      if (!droppedColsByTable.has(c.table_name)) droppedColsByTable.set(c.table_name, []);
      droppedColsByTable.get(c.table_name)!.push(c);
    }
  }
  for (const [table, cols] of droppedColsByTable) {
    entries.push({
      title: `${table} — ${cols.length} column${cols.length > 1 ? "s" : ""} removed`,
      description: `Removed ${cols.map(c => c.column_name).join(", ")} from ${table}.`,
      category: "database",
    });
  }

  // New RLS policies (on existing tables only)
  const prevPolicyKeys = new Set(prev.policies.map(p => `${p.table_name}:${p.policy_name}`));
  const newPoliciesByTable = new Map<string, typeof curr.policies>();
  for (const p of curr.policies) {
    if (!prevPolicyKeys.has(`${p.table_name}:${p.policy_name}`) && prevTableNames.has(p.table_name)) {
      if (!newPoliciesByTable.has(p.table_name)) newPoliciesByTable.set(p.table_name, []);
      newPoliciesByTable.get(p.table_name)!.push(p);
    }
  }
  for (const [table, pols] of newPoliciesByTable) {
    entries.push({
      title: `${table} — ${pols.length} new RLS ${pols.length === 1 ? "policy" : "policies"}`,
      description: `Added RLS policies on ${table}: ${pols.map(p => `"${p.policy_name}" (${p.cmd})`).join(", ")}.`,
      category: "security",
    });
  }

  // Removed RLS policies
  const currPolicyKeys = new Set(curr.policies.map(p => `${p.table_name}:${p.policy_name}`));
  const removedByTable = new Map<string, string[]>();
  for (const p of prev.policies) {
    if (!currPolicyKeys.has(`${p.table_name}:${p.policy_name}`) && currTableNames.has(p.table_name)) {
      if (!removedByTable.has(p.table_name)) removedByTable.set(p.table_name, []);
      removedByTable.get(p.table_name)!.push(p.policy_name);
    }
  }
  for (const [table, names] of removedByTable) {
    entries.push({
      title: `${table} — RLS ${names.length === 1 ? "policy" : "policies"} removed`,
      description: `Removed RLS policies from ${table}: ${names.map(n => `"${n}"`).join(", ")}.`,
      category: "security",
    });
  }

  // New database functions
  const prevFnNames = new Set(prev.functions.map(f => f.function_name));
  for (const f of curr.functions) {
    if (!prevFnNames.has(f.function_name)) {
      entries.push({
        title: `New database function: ${f.function_name}()`,
        description: `Created ${f.function_name}() returning ${f.return_type} in the public schema.`,
        category: "database",
      });
    }
  }

  // Removed database functions
  const currFnNames = new Set(curr.functions.map(f => f.function_name));
  for (const f of prev.functions) {
    if (!currFnNames.has(f.function_name)) {
      entries.push({
        title: `Database function removed: ${f.function_name}()`,
        description: `The ${f.function_name}() function was dropped from the public schema.`,
        category: "database",
      });
    }
  }

  return entries;
}

// ─── Handler ───

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const today = new Date().toISOString().split("T")[0];

    // 1. Get current schema snapshot via RPC
    const { data: currentSnapshot, error: rpcError } = await supabase.rpc("get_schema_snapshot");
    if (rpcError) throw new Error(`RPC error: ${rpcError.message}`);
    const curr = currentSnapshot as SchemaSnapshot;

    // 2. Get the most recent previous snapshot
    const { data: prevRow } = await supabase
      .from("work_journal_snapshots_schema")
      .select("*")
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .single();

    let entries: JournalEntry[] = [];

    if (prevRow) {
      const prev: SchemaSnapshot = {
        tables: prevRow.tables_snapshot as any,
        columns: prevRow.columns_snapshot as any,
        policies: prevRow.policies_snapshot as any,
        functions: prevRow.functions_snapshot as any,
      };
      const prevEdgeFns = (prevRow.edge_functions_snapshot || []) as EdgeFnEntry[];

      // Diff schema + edge functions
      entries = [
        ...diffSchema(prev, curr),
        ...diffEdgeFunctions(prevEdgeFns, EDGE_FUNCTION_MANIFEST),
      ];

      console.log(`[AutoJournal] Compared against ${prevRow.snapshot_date}: ${entries.length} changes`);
    } else {
      console.log("[AutoJournal] First run — storing baseline snapshot");
    }

    // 3. Quiet day fallback
    if (entries.length === 0 && prevRow) {
      entries.push({
        title: "Quiet day — no schema changes detected",
        description: "No database migrations, new tables, column changes, RLS policy updates, function changes, or edge function deploys were detected. Development may have focused on frontend code, UI polish, or logic changes not reflected in schema.",
        category: "infrastructure",
      });
    }

    // 4. Insert journal entries
    const results: string[] = [];
    for (const entry of entries) {
      const { error: insertError } = await supabase.from("work_journal").insert({
        title: entry.title,
        description: entry.description,
        category: entry.category,
        date: today,
        created_by: ADMIN_USER_ID,
      });
      if (insertError) {
        console.error(`[AutoJournal] Insert failed: ${insertError.message}`);
        results.push(`error: ${insertError.message}`);
      } else {
        results.push(entry.title);
        console.log(`[AutoJournal] ✓ ${entry.title}`);
      }
    }

    // 5. Daily summary
    if (entries.length > 0) {
      const summary = entries.map(e => e.title).join(". ") + ".";
      await supabase.from("work_journal_summaries").upsert(
        { date: today, summary, created_by: ADMIN_USER_ID },
        { onConflict: "date" }
      );
    }

    // 6. Store today's snapshot (schema + edge function manifest)
    await supabase.from("work_journal_snapshots_schema").upsert(
      {
        snapshot_date: today,
        tables_snapshot: curr.tables,
        columns_snapshot: curr.columns,
        policies_snapshot: curr.policies,
        functions_snapshot: curr.functions,
        edge_functions_snapshot: EDGE_FUNCTION_MANIFEST,
      },
      { onConflict: "snapshot_date" }
    );

    return new Response(
      JSON.stringify({ date: today, entries_created: entries.length, results, has_previous_snapshot: !!prevRow }),
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
