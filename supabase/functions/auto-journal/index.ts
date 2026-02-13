import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_USER_ID = "331c79de-0c05-433c-a57e-9cdfcf2dc44d";

interface SchemaSnapshot {
  tables: { table_name: string }[];
  columns: { table_name: string; column_name: string; data_type: string; is_nullable: string }[];
  policies: { table_name: string; policy_name: string; cmd: string; permissive: string }[];
  functions: { function_name: string; return_type: string }[];
}

interface JournalEntry {
  title: string;
  description: string;
  category: string;
}

function diffSnapshots(prev: SchemaSnapshot, curr: SchemaSnapshot): JournalEntry[] {
  const entries: JournalEntry[] = [];

  // --- New tables ---
  const prevTableNames = new Set(prev.tables.map(t => t.table_name));
  const newTables = curr.tables.filter(t => !prevTableNames.has(t.table_name));
  for (const t of newTables) {
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

  // --- Dropped tables ---
  const currTableNames = new Set(curr.tables.map(t => t.table_name));
  const droppedTables = prev.tables.filter(t => !currTableNames.has(t.table_name));
  for (const t of droppedTables) {
    entries.push({
      title: `Table removed: ${t.table_name}`,
      description: `The ${t.table_name} table was dropped from the public schema.`,
      category: "database",
    });
  }

  // --- New columns on existing tables ---
  const prevColKeys = new Set(prev.columns.map(c => `${c.table_name}.${c.column_name}`));
  const newCols = curr.columns.filter(c =>
    !prevColKeys.has(`${c.table_name}.${c.column_name}`) &&
    prevTableNames.has(c.table_name) // only on existing tables, new tables handled above
  );
  // Group new columns by table
  const newColsByTable = new Map<string, typeof newCols>();
  for (const c of newCols) {
    if (!newColsByTable.has(c.table_name)) newColsByTable.set(c.table_name, []);
    newColsByTable.get(c.table_name)!.push(c);
  }
  for (const [table, cols] of newColsByTable) {
    const colDesc = cols.map(c => {
      const nullable = c.is_nullable === "YES" ? "nullable" : "not null";
      return `${c.column_name} (${c.data_type}, ${nullable})`;
    }).join(", ");
    entries.push({
      title: `${table} — ${cols.length} new column${cols.length > 1 ? "s" : ""} added`,
      description: `Added ${colDesc} to the ${table} table.`,
      category: "database",
    });
  }

  // --- Dropped columns on existing tables ---
  const currColKeys = new Set(curr.columns.map(c => `${c.table_name}.${c.column_name}`));
  const droppedCols = prev.columns.filter(c =>
    !currColKeys.has(`${c.table_name}.${c.column_name}`) &&
    currTableNames.has(c.table_name) // table still exists
  );
  const droppedColsByTable = new Map<string, typeof droppedCols>();
  for (const c of droppedCols) {
    if (!droppedColsByTable.has(c.table_name)) droppedColsByTable.set(c.table_name, []);
    droppedColsByTable.get(c.table_name)!.push(c);
  }
  for (const [table, cols] of droppedColsByTable) {
    entries.push({
      title: `${table} — ${cols.length} column${cols.length > 1 ? "s" : ""} removed`,
      description: `Removed ${cols.map(c => c.column_name).join(", ")} from ${table}.`,
      category: "database",
    });
  }

  // --- New RLS policies ---
  const prevPolicyKeys = new Set(prev.policies.map(p => `${p.table_name}:${p.policy_name}`));
  const newPolicies = curr.policies.filter(p => !prevPolicyKeys.has(`${p.table_name}:${p.policy_name}`));
  const newPoliciesByTable = new Map<string, typeof newPolicies>();
  for (const p of newPolicies) {
    if (!newPoliciesByTable.has(p.table_name)) newPoliciesByTable.set(p.table_name, []);
    newPoliciesByTable.get(p.table_name)!.push(p);
  }
  for (const [table, pols] of newPoliciesByTable) {
    // Skip if this table is brand new (already covered above)
    if (!prevTableNames.has(table)) continue;
    const polDesc = pols.map(p => `"${p.policy_name}" (${p.cmd})`).join(", ");
    entries.push({
      title: `${table} — ${pols.length} new RLS ${pols.length === 1 ? "policy" : "policies"}`,
      description: `Added RLS policies on ${table}: ${polDesc}.`,
      category: "security",
    });
  }

  // --- Removed RLS policies ---
  const currPolicyKeys = new Set(curr.policies.map(p => `${p.table_name}:${p.policy_name}`));
  const removedPolicies = prev.policies.filter(p => !currPolicyKeys.has(`${p.table_name}:${p.policy_name}`));
  if (removedPolicies.length > 0) {
    const grouped = new Map<string, string[]>();
    for (const p of removedPolicies) {
      if (!grouped.has(p.table_name)) grouped.set(p.table_name, []);
      grouped.get(p.table_name)!.push(p.policy_name);
    }
    for (const [table, names] of grouped) {
      if (!currTableNames.has(table)) continue; // table was dropped entirely
      entries.push({
        title: `${table} — RLS ${names.length === 1 ? "policy" : "policies"} removed`,
        description: `Removed RLS policies from ${table}: ${names.map(n => `"${n}"`).join(", ")}.`,
        category: "security",
      });
    }
  }

  // --- New database functions ---
  const prevFnNames = new Set(prev.functions.map(f => f.function_name));
  const newFns = curr.functions.filter(f => !prevFnNames.has(f.function_name));
  for (const f of newFns) {
    entries.push({
      title: `New database function: ${f.function_name}()`,
      description: `Created ${f.function_name}() returning ${f.return_type} in the public schema.`,
      category: "database",
    });
  }

  // --- Removed database functions ---
  const currFnNames = new Set(curr.functions.map(f => f.function_name));
  const removedFns = prev.functions.filter(f => !currFnNames.has(f.function_name));
  for (const f of removedFns) {
    entries.push({
      title: `Database function removed: ${f.function_name}()`,
      description: `The ${f.function_name}() function was dropped from the public schema.`,
      category: "database",
    });
  }

  return entries;
}

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

      entries = diffSnapshots(prev, curr);
      console.log(`[AutoJournal] Compared against ${prevRow.snapshot_date}: found ${entries.length} changes`);
    } else {
      // First run — no previous snapshot, just store baseline
      console.log("[AutoJournal] First run — storing baseline snapshot, no diff to generate");
    }

    // 3. If no schema changes detected, log a quiet day
    if (entries.length === 0 && prevRow) {
      entries.push({
        title: "Quiet day — no schema changes detected",
        description: "No database migrations, new tables, column changes, RLS policy updates, or function changes were detected. Development may have focused on frontend code, UI polish, or edge function logic not reflected in schema changes.",
        category: "infrastructure",
      });
    }

    // 4. Insert journal entries for today
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

    // 5. Generate daily summary from all entries
    if (entries.length > 0) {
      const summaryParts = entries.map(e => e.title).join(". ");
      await supabase.from("work_journal_summaries").upsert(
        { date: today, summary: summaryParts + ".", created_by: ADMIN_USER_ID },
        { onConflict: "date" }
      );
    }

    // 6. Store today's snapshot (upsert by date)
    await supabase.from("work_journal_snapshots_schema").upsert(
      {
        snapshot_date: today,
        tables_snapshot: curr.tables,
        columns_snapshot: curr.columns,
        policies_snapshot: curr.policies,
        functions_snapshot: curr.functions,
      },
      { onConflict: "snapshot_date" }
    );

    return new Response(
      JSON.stringify({
        date: today,
        entries_created: entries.length,
        results,
        has_previous_snapshot: !!prevRow,
      }),
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
