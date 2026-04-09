import { useSwitchChain } from 'wagmi';
import { useMemo, useCallback } from 'react';
import { CHAIN_ID } from '@/lib/wagmi';
import { baseSepolia } from 'viem/chains';
import { useWeb3Ready } from '@/components/providers/LazyWeb3Provider';
import { useSafeAccount } from '@/hooks/useSafeWagmi';

export type WalletType = 'metamask' | 'coinbase' | 'walletconnect' | 'unknown';

interface WalletInfo {
  type: WalletType;
  name: string;
  supportsWatchAsset: boolean;
  supportsNetworkSwitch: boolean;
  deepLinkBase: string | null;
  appStoreUrl: string | null;
}

/**
 * Hook to detect which wallet type is connected.
 * Safe to call before WagmiProvider is mounted — returns disconnected defaults.
 */
export function useWalletType(): WalletInfo & {
  switchToBaseSepolia: () => Promise<boolean>;
  isOnCorrectNetwork: boolean;
} {
  const web3Ready = useWeb3Ready();
  const { connector, isConnected, chainId } = useSafeAccount();

  // useSwitchChain will throw without WagmiProvider, so we need a safe wrapper
  let switchChainAsync: ReturnType<typeof useSwitchChain>['switchChainAsync'] | undefined;
  if (web3Ready) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    ({ switchChainAsync } = useSwitchChain());
  }

  const walletInfo = useMemo((): WalletInfo => {
    if (!isConnected || !connector) {
      return {
        type: 'unknown',
        name: 'Wallet',
        supportsWatchAsset: false,
        supportsNetworkSwitch: false,
        deepLinkBase: null,
        appStoreUrl: null,
      };
    }

    const connectorId = connector.id?.toLowerCase() ?? '';
    const connectorName = connector.name?.toLowerCase() ?? '';

    // MetaMask detection
    if (
      connectorId.includes('metamask') ||
      connectorName.includes('metamask')
    ) {
      return {
        type: 'metamask',
        name: 'MetaMask',
        supportsWatchAsset: true,
        supportsNetworkSwitch: true,
        deepLinkBase: 'metamask://',
        appStoreUrl: 'https://metamask.io/download/',
      };
    }

    // Coinbase Wallet / Base Wallet detection
    if (
      connectorId.includes('coinbase') ||
      connectorName.includes('coinbase') ||
      connectorName.includes('base wallet')
    ) {
      return {
        type: 'coinbase',
        name: 'Base Wallet',
        supportsWatchAsset: false,
        supportsNetworkSwitch: true,
        deepLinkBase: 'cbwallet://',
        appStoreUrl: 'https://www.coinbase.com/wallet/downloads',
      };
    }

    // WalletConnect (generic)
    if (
      connectorId.includes('walletconnect') ||
      connectorName.includes('walletconnect')
    ) {
      return {
        type: 'walletconnect',
        name: connector.name || 'WalletConnect',
        supportsWatchAsset: false,
        supportsNetworkSwitch: true,
        deepLinkBase: null,
        appStoreUrl: null,
      };
    }

    // Unknown wallet
    return {
      type: 'unknown',
      name: connector.name || 'Wallet',
      supportsWatchAsset: false,
      supportsNetworkSwitch: false,
      deepLinkBase: null,
      appStoreUrl: null,
    };
  }, [isConnected, connector]);

  const isOnCorrectNetwork = chainId === CHAIN_ID;

  /**
   * Attempt to switch to Base Sepolia network
   * Returns true if successful or already on correct network
   */
  const switchToBaseSepolia = useCallback(async (): Promise<boolean> => {
    // Already on correct network
    if (isOnCorrectNetwork) {
      console.log('Already on Base Sepolia network');
      return true;
    }

    // Try wagmi's switchChain first (works with most connectors)
    if (switchChainAsync) {
      try {
        console.log('Attempting to switch to Base Sepolia via wagmi...');
        await switchChainAsync({ chainId: CHAIN_ID });
        console.log('Successfully switched to Base Sepolia');
        return true;
      } catch (error) {
        console.log('wagmi switchChain failed:', error);
        // Fall through to try direct provider method for MetaMask
      }
    }

    // For MetaMask, try direct provider method as fallback
    if (walletInfo.type === 'metamask' && walletInfo.supportsNetworkSwitch) {
      const ethereum = (window as unknown as { ethereum?: {
        request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      } }).ethereum;
      
      if (ethereum?.request) {
        try {
          console.log('Attempting direct wallet_switchEthereumChain for MetaMask...');
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
          });
          console.log('Successfully switched to Base Sepolia via direct call');
          return true;
        } catch (switchError: unknown) {
          // Chain not added - try to add it
          if ((switchError as { code?: number })?.code === 4902) {
            try {
              console.log('Base Sepolia not found, adding chain...');
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${CHAIN_ID.toString(16)}`,
                  chainName: baseSepolia.name,
                  nativeCurrency: baseSepolia.nativeCurrency,
                  rpcUrls: [baseSepolia.rpcUrls.default.http[0]],
                  blockExplorerUrls: [baseSepolia.blockExplorers.default.url],
                }],
              });
              console.log('Base Sepolia chain added successfully');
              return true;
            } catch (addError) {
              console.error('Failed to add Base Sepolia chain:', addError);
              return false;
            }
          }
          console.error('Failed to switch network:', switchError);
          return false;
        }
      }
    }

    console.log('Network switch not supported for this wallet type');
    return false;
  }, [isOnCorrectNetwork, switchChainAsync, walletInfo.type, walletInfo.supportsNetworkSwitch]);

  return {
    ...walletInfo,
    switchToBaseSepolia,
    isOnCorrectNetwork,
  };
}

/**
 * Generate a deep link to open the wallet app
 */
export function getWalletDeepLink(walletType: WalletType, action?: 'open' | 'assets'): string | null {
  switch (walletType) {
    case 'metamask':
      return 'metamask://';
    case 'coinbase':
      return 'cbwallet://';
    default:
      return null;
  }
}

/**
 * Attempt to open the wallet app using deep links
 */
export function openWalletApp(walletType: WalletType): boolean {
  const deepLink = getWalletDeepLink(walletType);
  
  if (!deepLink) {
    return false;
  }

  try {
    window.location.href = deepLink;
    return true;
  } catch (error) {
    console.error('Failed to open wallet deep link:', error);
    return false;
  }
}
