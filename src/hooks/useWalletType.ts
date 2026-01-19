import { useAccount, useSwitchChain } from 'wagmi';
import { useMemo, useCallback } from 'react';
import { CHAIN_ID } from '@/lib/wagmi';
import { baseSepolia } from 'viem/chains';

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
 * Hook to detect which wallet type is connected
 * Uses wagmi's connector info to identify MetaMask, Coinbase/Base Wallet, etc.
 */
export function useWalletType(): WalletInfo & {
  switchToBaseSepolia: () => Promise<boolean>;
  isOnCorrectNetwork: boolean;
} {
  const { connector, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

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
        supportsNetworkSwitch: true, // MetaMask supports wallet_switchEthereumChain
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
        supportsWatchAsset: false, // Base Wallet doesn't support wallet_watchAsset via WalletConnect
        supportsNetworkSwitch: false, // Network switch often fails via WalletConnect
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
        name: connector.name || 'Wallet',
        supportsWatchAsset: false, // Most WalletConnect wallets don't support it reliably
        supportsNetworkSwitch: false,
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
 * Useful after minting to let users easily check their wallet
 */
export function getWalletDeepLink(walletType: WalletType, action?: 'open' | 'assets'): string | null {
  switch (walletType) {
    case 'metamask':
      // MetaMask deep link to open the app
      return 'metamask://';
    
    case 'coinbase':
      // Coinbase/Base Wallet deep link
      // cbwallet://dapp opens the dApp browser, we just want to open the app
      return 'cbwallet://';
    
    default:
      return null;
  }
}

/**
 * Attempt to open the wallet app using deep links
 * Returns true if deep link was attempted, false if not possible
 */
export function openWalletApp(walletType: WalletType): boolean {
  const deepLink = getWalletDeepLink(walletType);
  
  if (!deepLink) {
    return false;
  }

  try {
    // Use location.href for maximum compatibility on mobile
    window.location.href = deepLink;
    return true;
  } catch (error) {
    console.error('Failed to open wallet deep link:', error);
    return false;
  }
}
