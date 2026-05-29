import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type EnergyDocKind = "utility_bill" | "installer_contract" | "ppa" | "loan";

export interface EnergyDocInput {
  kind: EnergyDocKind;
  dataUrl: string;
  filename: string;
}

export interface EnergyReportPreview {
  headline_savings_usd_per_year: number;
  executive_summary: string;
  top_insight: string;
  top_risk_flag: string;
  confidence: "high" | "medium" | "low";
}

export interface EnergyReportFull {
  roi_payback?: {
    system_cost_usd?: number;
    annual_production_kwh?: number;
    annual_savings_usd?: number;
    simple_payback_years?: number;
    net_roi_25yr_usd?: number;
    notes?: string;
  };
  rate_plan?: {
    current_plan?: string;
    recommended_plan?: string;
    projected_annual_savings_usd?: number;
    reasoning?: string;
  };
  tou_shifting?: Array<{ load: string; recommended_window: string; estimated_monthly_savings_usd?: number }>;
  system_performance?: {
    expected_annual_kwh?: number;
    actual_annual_kwh?: number;
    performance_pct?: number;
    verdict?: string;
  };
  battery_ev_strategy?: string;
  contract_risk_flags?: Array<{ flag: string; severity: "high" | "medium" | "low"; explanation: string }>;
  action_items: Array<{
    title: string;
    estimated_annual_impact_usd: number;
    difficulty: "easy" | "moderate" | "hard";
    steps: string;
  }>;
}

export interface EnergyReportResult {
  reportId: string;
  preview: EnergyReportPreview;
  full: EnergyReportFull | null;
  entitled: boolean;
}

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-energy-report`;

export function useEnergyReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EnergyReportResult | null>(null);

  const generate = useCallback(async (docs: EnergyDocInput[], threadId?: string | null) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in to generate your report.");

      // Upload each doc to private storage in parallel for audit + future re-runs.
      const uploads = await Promise.all(
        docs.map(async (d) => {
          const path = `${session.user.id}/${Date.now()}-${d.kind}-${d.filename.replace(/[^a-z0-9.\-]/gi, "_")}`;
          const blob = dataUrlToBlob(d.dataUrl);
          const { error: upErr } = await supabase.storage
            .from("energy-docs")
            .upload(path, blob, { contentType: blob.type, upsert: false });
          return { ...d, storagePath: upErr ? undefined : path };
        })
      );

      const res = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ docs: uploads, threadId: threadId ?? null }),
      });
      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          detail = j.detail ?? j.error ?? detail;
          if (j.error === "rate_limited") detail = "Slow down a moment and try again.";
          if (j.error === "credits_exhausted") detail = "AI credits exhausted — try again later.";
        } catch { /* */ }
        throw new Error(detail);
      }
      const payload = await res.json() as EnergyReportResult & { ok: true };
      setResult(payload);
      return payload;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generate, loading, error, result, reset: () => { setResult(null); setError(null); } };
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(meta)?.[1] ?? "application/octet-stream";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
