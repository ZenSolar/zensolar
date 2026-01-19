import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config, wagmiAdapter, networks, metadata, WALLETCONNECT_PROJECT_ID } from '@/lib/wagmi';
import { ReactNode, useEffect, useRef } from 'react';
import { createAppKit } from '@reown/appkit/react';

const queryClient = new QueryClient();

interface Web3ProviderProps {
  children: ReactNode;
}

// Initialize AppKit once when the provider mounts
function useInitAppKit() {
  const initialized = useRef(false);
  
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    // Create AppKit instance (must be done client-side)
    createAppKit({
      adapters: [wagmiAdapter],
      networks,
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata,
      features: {
        analytics: true,
        email: false,
        socials: false,
      },
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#22c55e', // ZenSolar green
        '--w3m-border-radius-master': '8px',
      },
      // Feature MetaMask and Base Wallet (Coinbase) prominently
      featuredWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
        'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet / Base Wallet
      ],
      enableCoinbase: true,
      coinbasePreference: 'all', // Show both smart wallet and regular wallet options
    });
  }, []);
}

export function Web3Provider({ children }: Web3ProviderProps) {
  useInitAppKit();
  
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
