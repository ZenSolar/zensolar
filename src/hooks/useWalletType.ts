import { useAccount } from 'wagmi';
import { useMemo } from 'react';

export type WalletType = 'metamask' | 'coinbase' | 'walletconnect' | 'unknown';

interface WalletInfo {
  type: WalletType;
  name: string;
  supportsWatchAsset: boolean;
  deepLinkBase: string | null;
  appStoreUrl: string | null;
}

/**
 * Hook to detect which wallet type is connected
 * Uses wagmi's connector info to identify MetaMask, Coinbase/Base Wallet, etc.
 */
export function useWalletType(): WalletInfo {
  const { connector, isConnected } = useAccount();

  return useMemo(() => {
    if (!isConnected || !connector) {
      return {
        type: 'unknown',
        name: 'Wallet',
        supportsWatchAsset: false,
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
        deepLinkBase: null,
        appStoreUrl: null,
      };
    }

    // Unknown wallet
    return {
      type: 'unknown',
      name: connector.name || 'Wallet',
      supportsWatchAsset: false,
      deepLinkBase: null,
      appStoreUrl: null,
    };
  }, [isConnected, connector]);
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
