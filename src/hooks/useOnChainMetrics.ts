import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LP_SEED, IS_LIVE_BETA, LIVE_BETA_CONFIG, MINT_DISTRIBUTION } from '@/lib/tokenomics';

export interface OnChainMetrics {
  // Token metrics
  totalSupply: number;
  lpBalance: number;
  treasuryBalance: number;
  controllerBalance: number;
  
  // Calculated metrics
  circulatingSupply: number;
  totalBurned: number;
  totalMinted: number;
  
  // LP pool metrics (test USDC)
  lpUsdcBalance: number;
  lpTokenBalance: number;
  estimatedPrice: number;
  
  // Transaction counts
  mintTransactionCount: number;
  totalTokensDistributed: number;
  
  // Contract addresses
  lpAddress: string | null;
  treasuryAddress: string | null;
  
  // Status
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const activeLPSeed = IS_LIVE_BETA ? LP_SEED.liveBeta : LP_SEED.mainnet;

const INITIAL_METRICS: OnChainMetrics = {
  totalSupply: 0,
  lpBalance: 0,
  treasuryBalance: 0,
  controllerBalance: 0,
  circulatingSupply: 0,
  totalBurned: 0,
  totalMinted: 0,
  lpUsdcBalance: activeLPSeed.usdcAmount,
  lpTokenBalance: activeLPSeed.tokenAmount,
  estimatedPrice: activeLPSeed.initialPrice,
  mintTransactionCount: 0,
  totalTokensDistributed: 0,
  lpAddress: null,
  treasuryAddress: null,
  isLoading: true,
  error: null,
  lastUpdated: null,
};

export function useOnChainMetrics(autoRefreshInterval = 30000) {
  const [metrics, setMetrics] = useState<OnChainMetrics>(INITIAL_METRICS);

  const fetchMetrics = useCallback(async () => {
    setMetrics(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Fetch mint transaction data from Supabase
      const { data: transactions, error: txError } = await supabase
        .from('mint_transactions')
        .select('tokens_minted, status, action, created_at')
        .order('created_at', { ascending: false });

      if (txError) throw txError;

      // Calculate totals from successful transactions
      const successfulMints = transactions?.filter(tx => tx.status === 'confirmed') || [];
      const totalMinted = successfulMints.reduce((sum, tx) => sum + (tx.tokens_minted || 0), 0);
      
      // Apply mint distribution rates
      const burnRate = MINT_DISTRIBUTION.burn / 100;
      const lpRate = MINT_DISTRIBUTION.lp / 100;
      const treasuryRate = MINT_DISTRIBUTION.treasury / 100;
      
      const totalBurned = totalMinted * burnRate;
      const lpBalance = totalMinted * lpRate;
      const treasuryBalance = totalMinted * treasuryRate;
      const circulatingSupply = totalMinted * (MINT_DISTRIBUTION.user / 100);
      
      // Calculate LP depth (initial seed + accumulated)
      const lpUsdcBalance = activeLPSeed.usdcAmount;
      const lpTokenBalance = activeLPSeed.tokenAmount + lpBalance;
      
      // Price estimate from ratio
      const estimatedPrice = lpTokenBalance > 0 
        ? lpUsdcBalance / lpTokenBalance 
        : activeLPSeed.initialPrice;

      setMetrics({
        totalSupply: totalMinted - totalBurned,
        lpBalance,
        treasuryBalance,
        controllerBalance: 0,
        circulatingSupply,
        totalBurned,
        totalMinted,
        lpUsdcBalance,
        lpTokenBalance,
        estimatedPrice,
        mintTransactionCount: successfulMints.length,
        totalTokensDistributed: circulatingSupply,
        lpAddress: LIVE_BETA_CONFIG.testUSDCContract,
        treasuryAddress: null,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (err) {
      console.error('Failed to fetch on-chain metrics:', err);
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
