import { useState, useCallback } from 'react';
import { useConnect, useAccount, useDisconnect } from 'wagmi';
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
 * Uses wagmi's coinbaseWallet connector configured for Smart Wallet.
 */
export function useCoinbaseSmartWallet(): UseCoinbaseSmartWalletResult {
  const [step, setStep] = useState<SmartWalletStep>('idle');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { connectAsync, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnectAsync } = useDisconnect();

  const reset = useCallback(() => {
    setStep('idle');
    setWalletAddress(null);
    setError(null);
  }, []);

  const createWallet = useCallback(async (): Promise<string | null> => {
    try {
      setError(null);
      setStep('connecting');

      // If already connected, use the existing address
      if (isConnected && address) {
        setWalletAddress(address);
        setStep('success');
        return address;
      }

      // Disconnect any existing connection first
      try {
        await disconnectAsync();
      } catch {
        // Ignore disconnect errors
      }

      setStep('authenticating');

      // Find Coinbase Wallet connector from existing connectors
      // The Web3Provider configures AppKit with coinbasePreference: 'all'
      // which enables Smart Wallet functionality
      const cbConnector = connectors.find(
        c => c.id === 'coinbaseWalletSDK' || 
             c.id === 'coinbaseWallet' || 
             c.id === 'com.coinbase.wallet' ||
             c.name.toLowerCase().includes('coinbase')
      );

      if (!cbConnector) {
        // If no Coinbase connector found, try the first available connector
        // In AppKit, this might be configured differently
        console.warn('[useCoinbaseSmartWallet] Coinbase connector not found, available:', 
          connectors.map(c => ({ id: c.id, name: c.name }))
        );
        
        throw new Error('Coinbase Wallet connector not available. Please ensure wallet extension is installed or use WalletConnect.');
      }

      // Connect using the Coinbase Wallet connector
      const result = await connectAsync({
        connector: cbConnector,
        chainId: baseSepolia.id,
      });

      if (result.accounts && result.accounts.length > 0) {
        const connectedAddress = result.accounts[0];
        setWalletAddress(connectedAddress);
        setStep('success');
        return connectedAddress;
      }

      throw new Error('No accounts returned from wallet connection');
    } catch (err) {
      console.error('[useCoinbaseSmartWallet] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create wallet';
      
      // Handle user rejection gracefully
      if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
        setError('Wallet creation was cancelled');
      } else if (errorMessage.includes('Connector not found') || errorMessage.includes('not available')) {
        setError('Coinbase Wallet not available. Try installing the Coinbase Wallet extension or app.');
      } else {
        setError(errorMessage);
      }
      
      setStep('error');
      return null;
    }
  }, [connectAsync, connectors, isConnected, address, disconnectAsync]);

  return {
    step,
    walletAddress,
    error,
    isConnecting: step === 'connecting' || step === 'authenticating',
    createWallet,
    reset,
  };
}
