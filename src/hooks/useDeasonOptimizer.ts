import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface OptimizerRecommendation {
  id: string;
  rule_id: string;
  title: string;
  action: string;
  rationale: string;
  sources: string[];
  est_monthly_savings_usd: number;
  confidence: number;
  priority: number;
  severity: "low" | "medium" | "high";
}

export interface OptimizerScheduleSlot {
  hour: number;
  action?: string;
  battery_kw?: number;
  ev_kw?: number;
  grid_import_kw?: number;
  grid_export_kw?: number;
  solar_kw?: number;
  load_kw?: number;
  price_usd_per_kwh?: number;
  [k: string]: unknown;
}

export interface OptimizerSchedule {
  schedule: OptimizerScheduleSlot[];
  totals: {
    cost_usd?: number;
    savings_usd?: number;
    self_consumption_pct?: number;
    zsolar_tokens?: number;
    solar_kwh?: number;
    [k: string]: unknown;
  } | null;
  explanations: string[];
  params?: Record<string, unknown>;
}

export interface OptimizerResult {
  generated_at: string;
  recommendations: OptimizerRecommendation[];
  summary: {
    est_monthly_savings_usd: number;
    est_annual_savings_usd: number;
    confidence: number;
  };
  schedule: OptimizerSchedule | null;
  forecast: any | null;
  documents?: { count: number; by_kind: Record<string, number>; insights?: any[] };
  rate_plan?: any;
}

export interface ConciergeAnswer {
  question: string;
  detected_intents: string[];
  summary: string;
  answer: {
    recommendations: OptimizerRecommendation[];
    scheduler_hints: string[];
    document_citations: Array<{ doc_id: string; kind: string; label: string | null; key_fields?: any; risk_flags?: any[] }>;
    rate_plan: any;
    telemetry_coverage: { battery: boolean; ev: boolean; solar: boolean };
  };
  sources: string[];
  grounded: boolean;
}

type Mode = "both" | "recommend" | "schedule" | "monthly_report" | "concierge" | "document_insights";

export function useDeasonOptimizer() {
  const { user } = useAuth();
  const [data, setData] = useState<OptimizerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (opts?: { mode?: Mode; question?: string; horizon_hours?: 24 | 48 }) => {
    if (!user) return null;
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: err } = await supabase.functions.invoke("deason-optimizer", {
        body: {
          userId: user.id,
          mode: opts?.mode ?? "both",
          question: opts?.question,
          horizon_hours: opts?.horizon_hours ?? 24,
        },
      });
      if (err) throw err;
      if (opts?.mode === "concierge" || opts?.mode === "monthly_report" || opts?.mode === "document_insights") {
        return res as any;
      }
      setData(res as OptimizerResult);
      return res as OptimizerResult;
    } catch (e: any) {
      setError(e?.message ?? "Optimizer failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Auto-load summary once.
  useEffect(() => { if (user && !data && !loading) void run({ mode: "both" }); /* eslint-disable-line */ }, [user]);

  const askConcierge = useCallback(async (question: string): Promise<ConciergeAnswer | null> => {
    const res = await run({ mode: "concierge", question });
    return (res as any)?.concierge ?? null;
  }, [run]);

  return { data, loading, error, run, askConcierge };
}
