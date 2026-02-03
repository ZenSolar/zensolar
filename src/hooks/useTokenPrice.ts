import { useMemo } from 'react';
import { CHAIN_ID } from '@/lib/wagmi';
import { baseSepolia } from '@reown/appkit/networks';

/**
 * Token price hook for $ZSOLAR
 * 
 * For testnet (Base Sepolia): Uses placeholder price of $0.10 (launch floor target)
 * For mainnet: Will query Uniswap V3 LP or price oracle when deployed
 */

// Placeholder price for testnet - matches tokenomics launch floor target
const TESTNET_PLACEHOLDER_PRICE = 0.10;

// Flag to indicate if we're on testnet
const IS_TESTNET = CHAIN_ID === baseSepolia.id;

export interface TokenPrice {
  price: number;
  priceFormatted: string;
  isPlaceholder: boolean;
  isLoading: boolean;
  source: 'placeholder' | 'lp' | 'oracle';
}

export function useTokenPrice(): TokenPrice {
  // For now, we use a placeholder price since we're on testnet
  // When mainnet LP is deployed, this will query real on-chain data
  
  const priceData = useMemo(() => {
    if (IS_TESTNET) {
      return {
        price: TESTNET_PLACEHOLDER_PRICE,
        priceFormatted: `$${TESTNET_PLACEHOLDER_PRICE.toFixed(2)}`,
        isPlaceholder: true,
        isLoading: false,
        source: 'placeholder' as const,
      };
    }
    
    // TODO: Implement mainnet LP price query
    // This would use Uniswap V3 SDK or a price oracle
    return {
      price: TESTNET_PLACEHOLDER_PRICE,
      priceFormatted: `$${TESTNET_PLACEHOLDER_PRICE.toFixed(2)}`,
      isPlaceholder: true,
      isLoading: false,
      source: 'placeholder' as const,
    };
  }, []);

  return priceData;
}

/**
 * Calculate USD value from token amount and price
 */
export function calculateUsdValue(tokenAmount: string | number, price: number): string {
  const amount = typeof tokenAmount === 'string' ? parseFloat(tokenAmount) : tokenAmount;
  if (isNaN(amount) || amount === 0) return '$0.00';
  
  const usdValue = amount * price;
  
  // Format based on value size
  if (usdValue >= 1000000) {
    return `$${(usdValue / 1000000).toFixed(2)}M`;
  } else if (usdValue >= 1000) {
    return `$${(usdValue / 1000).toFixed(2)}K`;
  } else if (usdValue >= 1) {
    return `$${usdValue.toFixed(2)}`;
  } else if (usdValue >= 0.01) {
    return `$${usdValue.toFixed(2)}`;
  } else {
    return '<$0.01';
  }
}
