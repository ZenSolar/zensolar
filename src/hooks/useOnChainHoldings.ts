import { useReadContract, useReadContracts, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { ZSOLAR_TOKEN_ADDRESS, ZSOLAR_NFT_ADDRESS, ZSOLAR_TOKEN_DECIMALS } from '@/lib/wagmi';
import { useMemo } from 'react';

// Minimal ABI for reading balances
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const ERC1155_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOfBatch',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'accounts', type: 'address[]' },
      { name: 'ids', type: 'uint256[]' },
    ],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
] as const;

// Total NFT token IDs (0-41 = 42 total)
const NFT_TOKEN_IDS = Array.from({ length: 42 }, (_, i) => BigInt(i));

export interface OnChainHoldings {
  tokenBalance: string;
  tokenBalanceRaw: bigint;
  nftCount: number;
  nftTokenIds: number[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useOnChainHoldings(walletAddress?: string): OnChainHoldings {
  const { address: connectedAddress } = useAccount();
  const address = walletAddress || connectedAddress;

  // Log for debugging
  if (address) {
    console.log('[useOnChainHoldings] Reading on-chain data for:', address);
  }

  // Read $ZSOLAR token balance
  const {
    data: tokenBalanceData,
    isLoading: tokenLoading,
    isError: tokenError,
    error: tokenReadError,
    refetch: refetchToken,
  } = useReadContract({
    address: ZSOLAR_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 30000, // Refresh every 30 seconds
    },
  });

  // Log token balance for debugging
  if (tokenBalanceData !== undefined) {
    console.log('[useOnChainHoldings] Token balance raw:', tokenBalanceData?.toString());
  }
  if (tokenReadError) {
    console.error('[useOnChainHoldings] Token read error:', tokenReadError);
  }

  // Read NFT balances for all token IDs using balanceOfBatch
  const {
    data: nftBatchData,
    isLoading: nftLoading,
    isError: nftError,
    refetch: refetchNfts,
  } = useReadContract({
    address: ZSOLAR_NFT_ADDRESS,
    abi: ERC1155_ABI,
    functionName: 'balanceOfBatch',
    args: address
      ? [
          NFT_TOKEN_IDS.map(() => address as `0x${string}`),
          NFT_TOKEN_IDS,
        ]
      : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 30000,
    },
  });

  // Process NFT balances to get owned token IDs
  const { nftCount, nftTokenIds } = useMemo(() => {
    if (!nftBatchData) return { nftCount: 0, nftTokenIds: [] };
    
    const ownedIds: number[] = [];
    (nftBatchData as bigint[]).forEach((balance, index) => {
      if (balance > 0n) {
        ownedIds.push(index);
      }
    });
    
    return { nftCount: ownedIds.length, nftTokenIds: ownedIds };
  }, [nftBatchData]);

  // Format token balance
  const tokenBalance = tokenBalanceData
    ? formatUnits(tokenBalanceData as bigint, ZSOLAR_TOKEN_DECIMALS)
    : '0';

  const refetch = () => {
    refetchToken();
    refetchNfts();
  };

  return {
    tokenBalance,
    tokenBalanceRaw: (tokenBalanceData as bigint) || 0n,
    nftCount,
    nftTokenIds,
    isLoading: tokenLoading || nftLoading,
    isError: tokenError || nftError,
    refetch,
  };
}
