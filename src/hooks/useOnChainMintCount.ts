import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface OnChainMintStats {
  mintCount: number;
  totalMinted: number;
  uniqueMinters: number;
  firstMintAt: Date | null;
  isLoading: boolean;
  error: string | null;
}

const INITIAL: OnChainMintStats = {
  mintCount: 0,
  totalMinted: 0,
  uniqueMinters: 0,
  firstMintAt: null,
  isLoading: true,
  error: null,
};

/**
 * Counts every confirmed on-chain mint with a tx_hash on Base L2.
 * Intentionally does NOT filter on is_beta_mint — early mints predate that flag.
 */
export function useOnChainMintCount(autoRefreshInterval = 30000) {
  const [stats, setStats] = useState<OnChainMintStats>(INITIAL);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("mint_transactions")
        .select("tokens_minted, user_id, created_at, tx_hash, status")
        .eq("status", "confirmed")
        .not("tx_hash", "is", null);

      if (error) throw error;

      const rows = (data ?? []).filter((r) => r.tx_hash && r.tx_hash !== "");
      const totalMinted = rows.reduce((sum, r) => sum + (r.tokens_minted || 0), 0);
      const uniqueMinters = new Set(rows.map((r) => r.user_id)).size;
      const firstMintAt = rows.length
        ? new Date(rows.map((r) => r.created_at).sort()[0])
        : null;

      setStats({
        mintCount: rows.length,
        totalMinted,
        uniqueMinters,
        firstMintAt,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setStats((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to fetch mint stats",
      }));
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const id = setInterval(fetchStats, autoRefreshInterval);
    return () => clearInterval(id);
  }, [autoRefreshInterval, fetchStats]);

  return { stats, refresh: fetchStats };
}
