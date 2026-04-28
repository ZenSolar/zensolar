// One-click Cheetah PDF export.
// 1. Re-computes the 50/50 split model server-side.
// 2. Verifies the client-supplied summary matches (refuses to render if drift).
// 3. Generates a minimal, dependency-free PDF.
// 4. Uploads to public `cheetah-exports` bucket and returns a shareable URL.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  buildWaveMath,
  diffSummaries,
  summarizeModel,
  type ModelSummary,
} from "./model.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ---------- helpers ----------
const fmtUsd = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(0)}K`
    : `$${n.toFixed(0)}`;

const fmtFloor = (n: number) => (n < 1 ? `$${n.toFixed(3)}` : `$${n.toFixed(2)}`);

const fmtUsers = (n: number) =>
  n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1_000 ? `${n / 1_000}K` : `${n}`;

// ---------- minimal PDF writer (no deps) ----------
// Letter @ 72dpi = 612 x 792
function buildPdf(rows: ReturnType<typeof buildWaveMath>): Uint8Array {
  const lines: string[] = [];
  const push = (s: string) => lines.push(s);

  // Layout helpers — PDF y-axis grows upward
  const W = 612, H = 792;
  const M = 48;
  let y = H - M;

  const text = (
    s: string,
    x: number,
    yy: number,
    size = 10,
    bold = false,
    rgb: [number, number, number] = [0.06, 0.09, 0.16],
  ) => {
    const font = bold ? "/F2" : "/F1";
    push(`${rgb[0]} ${rgb[1]} ${rgb[2]} rg`);
    push(`BT ${font} ${size} Tf ${x} ${yy} Td (${escape(s)}) Tj ET`);
  };

  const rect = (
    x: number, yy: number, w: number, h: number,
    fill: [number, number, number] | null,
    stroke: [number, number, number] | null = null,
  ) => {
    if (fill) push(`${fill[0]} ${fill[1]} ${fill[2]} rg`);
    if (stroke) push(`${stroke[0]} ${stroke[1]} ${stroke[2]} RG 0.5 w`);
    push(`${x} ${yy} ${w} ${h} re ${fill && stroke ? "B" : fill ? "f" : "S"}`);
  };

  const escape = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  // --- Title ---
  text("ZenSolar — Subscription Revenue Split", M, y, 18, true);
  y -= 22;
  text("Cheetah-ready handout · 50/50 split · 7 waves to 1M users",
       M, y, 10, false, [0.39, 0.45, 0.55]);
  y -= 24;

  // --- 50/50 hero blocks ---
  const blockW = (W - M * 2 - 10) / 2;
  rect(M, y - 70, blockW, 70, [0.93, 0.99, 0.96], [0.06, 0.73, 0.51]);
  rect(M + blockW + 10, y - 70, blockW, 70, [0.95, 0.96, 0.97], [0.8, 0.84, 0.88]);
  text("50% -> Liquidity Pool (USDC)", M + 10, y - 18, 9, true, [0.06, 0.73, 0.51]);
  text("$0.50", M + 10, y - 45, 22, true);
  text("Raises floor for every $ZSOLAR holder.", M + 10, y - 60, 8, false, [0.39, 0.45, 0.55]);
  text("50% -> Company Operations (Fiat)", M + blockW + 20, y - 18, 9, true);
  text("$0.50", M + blockW + 20, y - 45, 22, true);
  text("Eng, hardware, legal, gas sponsorship.", M + blockW + 20, y - 60, 8, false, [0.39, 0.45, 0.55]);
  y -= 90;

  // --- Schedule heading ---
  text("7-Wave Growth Schedule", M, y, 13, true);
  y -= 16;

  // --- Table ---
  const cols = [
    { h: "Wave", w: 38, align: "l" as const },
    { h: "Stage", w: 70, align: "l" as const },
    { h: "Subs", w: 55, align: "r" as const },
    { h: "Mo Rev", w: 65, align: "r" as const },
    { h: "ARR", w: 70, align: "r" as const },
    { h: "LP/yr", w: 75, align: "r" as const },
    { h: "Co/yr", w: 75, align: "r" as const },
    { h: "Floor", w: 68, align: "r" as const },
  ];
  const tableW = cols.reduce((s, c) => s + c.w, 0);
  const tableX = M;
  const rowH = 18;

  // Header row
  rect(tableX, y - rowH, tableW, rowH, [0.06, 0.09, 0.16]);
  let cx = tableX;
  for (const c of cols) {
    const tx = c.align === "r" ? cx + c.w - 6 - measure(c.h, 9) : cx + 6;
    push(`1 1 1 rg`);
    push(`BT /F2 9 Tf ${tx} ${y - rowH + 5} Td (${c.h}) Tj ET`);
    cx += c.w;
  }
  y -= rowH;

  // Data rows
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (i % 2 === 1) rect(tableX, y - rowH, tableW, rowH, [0.95, 0.96, 0.97]);
    const cells = [
      r.id, r.name, fmtUsers(r.users),
      fmtUsd(r.monthlyRev), fmtUsd(r.arr),
      fmtUsd(r.lpInjectYr), fmtUsd(r.companyYr),
      fmtFloor(r.floor),
    ];
    cx = tableX;
    for (let j = 0; j < cols.length; j++) {
      const c = cols[j];
      const v = cells[j];
      const isEmerald = j === 5 || j === 7;
      const tx = c.align === "r" ? cx + c.w - 6 - measure(v, 9) : cx + 6;
      const rgb: [number, number, number] = isEmerald
        ? [0.06, 0.73, 0.51] : [0.06, 0.09, 0.16];
      const font = isEmerald ? "/F2" : "/F1";
      push(`${rgb[0]} ${rgb[1]} ${rgb[2]} rg`);
      push(`BT ${font} 9 Tf ${tx} ${y - rowH + 5} Td (${escape(v)}) Tj ET`);
      cx += c.w;
    }
    y -= rowH;
  }

  // Grid lines
  push(`0.8 0.84 0.88 RG 0.4 w`);
  push(`${tableX} ${y} m ${tableX + tableW} ${y} l S`);

  y -= 24;

  // --- Big numbers @ 1M ---
  text("At Full Scale (1M Subscribers)", M, y, 13, true);
  y -= 16;
  const last = rows[rows.length - 1];
  const bigs = [
    { label: "ARR @ 1M", value: fmtUsd(last.arr), eco: false },
    { label: "LP Inject / yr", value: fmtUsd(last.lpInjectYr), eco: true },
    { label: "Company / yr", value: fmtUsd(last.companyYr), eco: false },
    { label: "Floor @ 1M", value: fmtFloor(last.floor), eco: true },
  ];
  const bw = (W - M * 2 - 18) / 4;
  for (let i = 0; i < bigs.length; i++) {
    const b = bigs[i];
    const x = M + i * (bw + 6);
    rect(x, y - 56, bw, 56, b.eco ? [0.93, 0.99, 0.96] : [0.97, 0.98, 0.99],
         [0.8, 0.84, 0.88]);
    text(b.label, x + 8, y - 16, 8, false, b.eco ? [0.06, 0.73, 0.51] : [0.39, 0.45, 0.55]);
    text(b.value, x + 8, y - 42, 16, true, b.eco ? [0.06, 0.73, 0.51] : [0.06, 0.09, 0.16]);
  }
  y -= 76;

  // --- Footnotes ---
  text("Methodology", M, y, 11, true);
  y -= 14;
  const notes = [
    "Pricing: $9.99 Base + $19.99 Auto-Mint (30% attach) -> blended ARPU $12.99/mo.",
    "Split: 50% USDC into $ZSOLAR LP, 50% to company ops (eng, legal, gas sponsorship).",
    "LP tranches: $200K USDC + 2M $ZSOLAR seed; one tranche per wave at $0.10 launch price.",
    "Floor formula: cumulative USDC / cumulative LP-side $ZSOLAR. Conservative — subs-only.",
    "No VPP revenue, no token sale, no fees included. Source: live in-app transparency panel.",
  ];
  for (const n of notes) {
    text("- " + n, M, y, 9, false, [0.28, 0.33, 0.41]);
    y -= 12;
  }

  // --- Build PDF object table ---
  const stream = lines.join("\n");
  const objs: string[] = [];
  objs.push("<< /Type /Catalog /Pages 2 0 R >>");
  objs.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objs.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] ` +
    `/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,
  );
  objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  objs.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objs.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let i = 0; i < objs.length; i++) {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objs[i]}\nendobj\n`;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) {
    pdf += `${String(o).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

// Helvetica widths (rough estimation for right-alignment)
function measure(s: string, size: number): number {
  return s.length * size * 0.55;
}

// ---------- handler ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Auth: must be signed in
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user with the anon client + their JWT
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userResult, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userResult?.user) return json({ error: "unauthorized" }, 401);
    const userId = userResult.user.id;

    // Service client (bypass RLS for storage write)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Founder/admin gating — Cheetah handout is sensitive
    const [{ data: isFounder }, { data: isAdmin }] = await Promise.all([
      admin.rpc("is_founder", { _user_id: userId }),
      admin.rpc("is_admin", { _user_id: userId }),
    ]);
    if (!isFounder && !isAdmin) return json({ error: "forbidden" }, 403);

    // Parse body — client sends its computed summary for verification
    const body = await req.json().catch(() => ({}));
    const clientSummary = body?.clientSummary as ModelSummary | undefined;

    // Server recomputes from the SAME shared model
    const rows = buildWaveMath();
    const serverSummary = summarizeModel(rows);

    // ---- VERIFICATION STEP ----
    if (!clientSummary) {
      return json({ error: "missing_client_summary", serverSummary }, 400);
    }
    const issues = diffSummaries(clientSummary, serverSummary);
    if (issues.length > 0) {
      return json({
        error: "verification_failed",
        message: "Client and server model summaries diverge — PDF NOT generated.",
        issues,
        clientSummary,
        serverSummary,
      }, 422);
    }

    // ---- Generate PDF ----
    const pdf = buildPdf(rows);
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const path = `${userId}/ZenSolar_5050_Split_${ts}.pdf`;

    const { error: upErr } = await admin.storage
      .from("cheetah-exports")
      .upload(path, pdf, {
        contentType: "application/pdf",
        upsert: false,
        cacheControl: "31536000",
      });
    if (upErr) return json({ error: "upload_failed", detail: upErr.message }, 500);

    const { data: pub } = admin.storage.from("cheetah-exports").getPublicUrl(path);

    return json({
      ok: true,
      shareUrl: pub.publicUrl,
      path,
      verified: true,
      serverSummary,
      bytes: pdf.byteLength,
    });
  } catch (e) {
    return json({ error: "server_error", detail: String(e) }, 500);
  }
});
