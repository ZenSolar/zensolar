// Starlink Mint — OCR a Starlink app screenshot and credit $ZSOLAR at 1 GB = 1 $ZSOLAR.
// Manual attestation flow (Starlink has no public consumer API).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  imageDataUrl?: string;       // data:image/png;base64,....
  storagePath?: string;        // optional: path already uploaded in starlink-attestations bucket
  manualDownloadGb?: number;   // optional bypass for OCR (user types it in)
  manualUploadGb?: number;
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
}

interface OcrResult {
  download_gb: number;
  upload_gb: number;
  confidence: number;
  raw_text: string;
}

async function ocrStarlinkScreenshot(imageDataUrl: string): Promise<OcrResult> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const prompt = `You are reading a screenshot from the Starlink mobile app's Statistics / Data Usage screen.
Extract the cumulative data transferred values.

Return ONLY a JSON object with this exact shape:
{ "download_gb": <number>, "upload_gb": <number>, "confidence": <0-1>, "notes": "<short note>" }

Rules:
- Convert MB to GB (divide by 1024) and TB to GB (multiply by 1024) so the output is always GB.
- If you only see a single "Total" figure, put it in download_gb and 0 in upload_gb.
- If you cannot read either number, return {"download_gb":0,"upload_gb":0,"confidence":0,"notes":"unreadable"}.
- Do NOT include markdown fences. JSON only.`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`AI gateway ${resp.status}: ${text.slice(0, 300)}`);
  }
  const j = await resp.json();
  const content: string = j?.choices?.[0]?.message?.content ?? "";
  const cleaned = content.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  let parsed: any = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`OCR returned non-JSON: ${content.slice(0, 200)}`);
  }
  return {
    download_gb: Number(parsed.download_gb) || 0,
    upload_gb: Number(parsed.upload_gb) || 0,
    confidence: Number(parsed.confidence) || 0,
    raw_text: content,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body: Body = await req.json().catch(() => ({} as Body));

    // 1) Get reading — either OCR a screenshot or accept manual values
    let download_gb = 0;
    let upload_gb = 0;
    let confidence = 1;
    let raw_text: string | null = null;

    if (typeof body.manualDownloadGb === "number") {
      download_gb = body.manualDownloadGb;
      upload_gb = body.manualUploadGb ?? 0;
      raw_text = "manual entry";
    } else if (body.imageDataUrl) {
      const ocr = await ocrStarlinkScreenshot(body.imageDataUrl);
      download_gb = ocr.download_gb;
      upload_gb = ocr.upload_gb;
      confidence = ocr.confidence;
      raw_text = ocr.raw_text;
    } else {
      return new Response(JSON.stringify({ error: "Provide imageDataUrl or manualDownloadGb" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const total_gb = download_gb + upload_gb;
    if (total_gb <= 0) {
      return new Response(
        JSON.stringify({ error: "Could not read any GB value from the screenshot. Try a clearer crop or enter the value manually.", ocrRawText: raw_text, confidence }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2) Get prior total to compute delta (cumulative reading model)
    const { data: prev } = await supabase
      .from("starlink_attestations")
      .select("reading_download_gb,reading_upload_gb")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const previous_total_gb = prev
      ? (Number(prev.reading_download_gb) || 0) + (Number(prev.reading_upload_gb) || 0)
      : 0;

    let delta_gb = Math.max(0, total_gb - previous_total_gb);
    // First-ever reading: credit the full reading (cap at 200 GB to avoid surprise mega-credit)
    if (!prev) delta_gb = Math.min(total_gb, 200);

    const tokens_credited = delta_gb; // 1 GB = 1 $ZSOLAR (UI 1:1 framing)

    // 3) Persist
    const { data: row, error: insertErr } = await supabase
      .from("starlink_attestations")
      .insert({
        user_id: userId,
        screenshot_path: body.storagePath ?? null,
        ocr_raw_text: raw_text,
        ocr_confidence: confidence,
        reading_download_gb: download_gb,
        reading_upload_gb: upload_gb,
        previous_total_gb,
        delta_gb,
        tokens_credited,
        reading_period_start: body.periodStart ?? null,
        reading_period_end: body.periodEnd ?? null,
        notes: body.notes ?? null,
        status: "credited",
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({
        ok: true,
        attestation: row,
        summary: {
          download_gb,
          upload_gb,
          total_gb,
          previous_total_gb,
          delta_gb,
          tokens_credited,
          confidence,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[starlink-mint] error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
