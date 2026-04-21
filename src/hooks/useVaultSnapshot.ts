import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VaultSnapshot {
  viewer: { user_id: string; email: string; display_name: string };
  state: {
    current_price_usd: number;
    total_supply: number;
    family_legacy_pact_active: boolean;
    pact_start_date: string;
    pact_days_active: number;
    chapter_two_days: number;
    updated_at: string;
  };
  founders: {
    joseph: FounderSnapshot;
    michael: FounderSnapshot;
  };
  all_founders: { email: string; display_name: string; user_id: string }[];
  moonshot_targets: { price: number; label: string }[];
  generated_at: string;
}

export interface FounderSnapshot {
  name: string;
  email: string;
  allocation: number;
  net_worth: number;
  trillionaire_price: number;
  progress_to_trillion: number;
}

export function useVaultSnapshot(enabled: boolean) {
  const [snapshot, setSnapshot] = useState<VaultSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSnapshot = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "founders-vault-snapshot",
      );
      if (invokeError) throw invokeError;
      setSnapshot(data as VaultSnapshot);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load vault");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchSnapshot();
    const id = setInterval(fetchSnapshot, 30_000); // refresh every 30s
    return () => clearInterval(id);
  }, [enabled, fetchSnapshot]);

  return { snapshot, loading, error, refresh: fetchSnapshot };
}
