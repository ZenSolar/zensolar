import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MINT_DISTRIBUTION } from '@/lib/tokenomics';

export interface BetaMetrics {
  // User activity (beta mints only)
  totalMinted: number;
  totalBurned: number;
  circulatingSupply: number;
  mintTransactionCount: number;
  
  // Loading state
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const INITIAL_METRICS: BetaMetrics = {
  totalMinted: 0,
  totalBurned: 0,
  circulatingSupply: 0,
  mintTransactionCount: 0,
  isLoading: true,
  error: null,
  lastUpdated: null,
};

export function useBetaMetrics(autoRefreshInterval = 30000) {
  const [metrics, setMetrics] = useState<BetaMetrics>(INITIAL_METRICS);

  const fetchMetrics = useCallback(async () => {
    setMetrics(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Fetch ONLY beta mint transactions
      const { data: transactions, error: txError } = await supabase
        .from('mint_transactions')
        .select('tokens_minted, status, is_beta_mint')
        .eq('is_beta_mint', true)
        .eq('status', 'confirmed');

      if (txError) throw txError;

      // Calculate totals from beta-only transactions
      const totalMinted = transactions?.reduce((sum, tx) => sum + (tx.tokens_minted || 0), 0) || 0;
      
      // Apply mint distribution rates
      const burnRate = MINT_DISTRIBUTION.burn / 100;
      const totalBurned = totalMinted * burnRate;
      const circulatingSupply = totalMinted * (MINT_DISTRIBUTION.user / 100);

      setMetrics({
        totalMinted,
        totalBurned,
        circulatingSupply,
        mintTransactionCount: transactions?.length || 0,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (err) {
      console.error('Failed to fetch beta metrics:', err);
      setMetrics(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch metrics',
        lastUpdated: new Date(),
      }));
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    
    const interval = setInterval(fetchMetrics, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchMetrics]);

  return { metrics, refresh: fetchMetrics };
}
