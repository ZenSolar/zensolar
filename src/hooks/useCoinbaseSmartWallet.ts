import { useState, useCallback, useRef } from 'react';
import { createCoinbaseWalletSDK } from '@coinbase/wallet-sdk';
import { baseSepolia } from 'viem/chains';

export type SmartWalletStep = 'idle' | 'connecting' | 'authenticating' | 'success' | 'error';

interface UseCoinbaseSmartWalletResult {
  step: SmartWalletStep;
  walletAddress: string | null;
  error: string | null;
  isConnecting: boolean;
  createWallet: () => Promise<string | null>;
  reset: () => void;
}

/**
 * Hook to create/connect a Coinbase Smart Wallet with passkey authentication.
 * Uses the Coinbase Wallet SDK directly with smartWalletOnly preference.
 * This works without requiring the browser extension - uses passkeys via popup.
 */
export function useCoinbaseSmartWallet(): UseCoinbaseSmartWalletResult {
  const [step, setStep] = useState<SmartWalletStep>('idle');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const providerRef = useRef<ReturnType<ReturnType<typeof createCoinbaseWalletSDK>['getProvider']> | null>(null);

  const reset = useCallback(() => {
    setStep('idle');
    setWalletAddress(null);
    setError(null);
    // Clear cached wallet data so a fresh connection is attempted
    localStorage.removeItem('zensolar_wallet_type');
    localStorage.removeItem('zensolar_wallet_address');
  }, []);

  const createWallet = useCallback(async (): Promise<string | null> => {
    try {
      setError(null);
      setStep('connecting');

      // Clear any cached wallet data from previous sessions
      localStorage.removeItem('zensolar_wallet_type');
      localStorage.removeItem('zensolar_wallet_address');

      // Create Coinbase Wallet SDK with Smart Wallet preference
      const appUrl = window.location.hostname.includes('lovable.app') 
        ? 'https://zensolar.lovable.app' 
        : window.location.origin;
      
      const sdk = createCoinbaseWalletSDK({
        appName: 'ZenSolar',
        appLogoUrl: `${appUrl}/logos/zen-icon.png`,
        appChainIds: [baseSepolia.id],
        preference: {
          options: 'smartWalletOnly',
        },
      });

      const provider = sdk.getProvider();
      providerRef.current = provider;

      // Disconnect any existing session first so the user gets a fresh
      // passkey prompt and can choose to create a NEW passkey/wallet
      try {
        await provider.disconnect();
      } catch {
        // disconnect may throw if no session exists — that's fine
      }

      setStep('authenticating');

      // Request accounts — triggers Smart Wallet popup for passkey auth
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts && accounts.length > 0) {
        const connectedAddress = accounts[0];
        setWalletAddress(connectedAddress);
        setStep('success');
        
        localStorage.setItem('zensolar_wallet_type', 'coinbase_smart');
        localStorage.setItem('zensolar_wallet_address', connectedAddress);
        
        return connectedAddress;
      }

      throw new Error('No accounts returned from wallet connection');
    } catch (err) {
      console.error('[useCoinbaseSmartWallet] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create wallet';
      
      if (
        errorMessage.includes('User rejected') || 
        errorMessage.includes('user rejected') ||
        errorMessage.includes('User denied') ||
        errorMessage.includes('cancelled')
      ) {
        setError('Wallet creation was cancelled. You can try again when ready.');
      } else if (errorMessage.includes('popup')) {
        setError('Popup was blocked. Please allow popups and try again.');
      } else {
        setError(errorMessage);
      }
      
      setStep('error');
      return null;
    }
  }, []);

  return {
    step,
    walletAddress,
    error,
    isConnecting: step === 'connecting' || step === 'authenticating',
    createWallet,
    reset,
  };
}
