import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface MonthlyReport {
  id: string;
  period_month: string;
  dollars_saved: number;
  bonus_tokens: number;
  narrative: string | null;
  structured_report: { preview?: Record<string, unknown>; full?: Record<string, unknown> };
  status: string;
}

export interface Progression {
  level: number;
  points: number;
  months_completed: number;
  total_saved_usd: number;
  total_bonus_tokens: number;
  streak_months: number;
  last_period_month: string | null;
}

export interface LibraryDoc {
  id: string;
  kind: "utility_bill" | "installer_contract" | "ppa" | "loan" | "other";
  label: string | null;
  storage_path: string;
  source: "upload" | "monthly_ritual";
  period_month: string | null;
  uploaded_at: string;
}

export interface Insight {
  id: string;
  kind: "savings" | "risk" | "opportunity" | "seasonal";
  title: string;
  body: string;
  severity: "info" | "warn" | "high";
  created_at: string;
}

export interface WeatherState {
  status: "placeholder" | "ready";
  message?: string;
  today?: { temp: number; condition: string; icon: string };
  threeDay?: Array<{ date: string; tempMin: number; tempMax: number; condition: string; icon: string; pop: number }>;
}

export interface ProfileCtx {
  state_code: string | null;
  esid: string | null;
  utility_name: string | null;
}

/**
 * Loads everything the Deason hub renders. Refreshes on mount and exposes a
 * manual refresh hook so callers can re-pull after running a monthly ritual.
 */
export function useDeasonHub() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [latestReport, setLatestReport] = useState<MonthlyReport | null>(null);
  const [pastReports, setPastReports] = useState<MonthlyReport[]>([]);
  const [progression, setProgression] = useState<Progression | null>(null);
  const [library, setLibrary] = useState<LibraryDoc[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [weather, setWeather] = useState<WeatherState>({ status: "placeholder", message: "Weather forecast coming soon" });
  const [profileCtx, setProfileCtx] = useState<ProfileCtx>({ state_code: null, esid: null, utility_name: null });

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [reports, prog, lib, ins, profile] = await Promise.all([
      supabase.from("deason_monthly_reports").select("*").eq("user_id", user.id).order("period_month", { ascending: false }).limit(12),
      supabase.from("deason_progression").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("deason_documents").select("*").eq("user_id", user.id).order("uploaded_at", { ascending: false }).limit(50),
      supabase.from("deason_insights").select("*").eq("user_id", user.id).is("dismissed_at", null).order("created_at", { ascending: false }).limit(6),
      (supabase.from("profiles") as unknown as { select: (cols: string) => { eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: ProfileCtx | null }> } } })
        .select("state_code, esid, utility_name").eq("user_id", user.id).maybeSingle(),
    ]);
    const rows = (reports.data ?? []) as MonthlyReport[];
    setLatestReport(rows[0] ?? null);
    setPastReports(rows.slice(1));
    setProgression((prog.data as Progression | null) ?? null);
    setLibrary((lib.data ?? []) as LibraryDoc[]);
    setInsights((ins.data ?? []) as Insight[]);
    const p = (profile?.data ?? null) as ProfileCtx | null;
    if (p) setProfileCtx({ state_code: p.state_code ?? null, esid: p.esid ?? null, utility_name: p.utility_name ?? null });
    setLoading(false);
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Best-effort weather fetch. Placeholder is the default response when no key.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        // Browser geolocation, fail-soft.
        const coords = await new Promise<{ lat: number; lon: number } | null>((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(
            (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
            () => resolve(null),
            { timeout: 4000, maximumAge: 60 * 60 * 1000 },
          );
        });
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deason-weather`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify(coords ?? {}),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setWeather(data);
      } catch { /* leave placeholder */ }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const dismissInsight = useCallback(async (id: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("deason_insights").update({ dismissed_at: new Date().toISOString() }).eq("id", id);
  }, []);

  return { loading, latestReport, pastReports, progression, library, insights, weather, refresh, dismissInsight };
}
