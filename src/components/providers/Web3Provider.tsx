import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config, wagmiAdapter, networks, metadata, WALLETCONNECT_PROJECT_ID, HAS_WALLETCONNECT_PROJECT_ID } from '@/lib/wagmi';
import { ReactNode, useEffect, useState, createContext, useContext } from 'react';
import { createAppKit } from '@reown/appkit/react';

const queryClient = new QueryClient();

// Context to share AppKit initialization state
interface AppKitContextValue {
  isInitialized: boolean;
  /** Whether WalletConnect is configured (env/localStorage). */
  hasProjectId: boolean;
}

const AppKitContext = createContext<AppKitContextValue>({ isInitialized: false, hasProjectId: false });

export function useAppKitInitialized() {
  return useContext(AppKitContext);
}

interface Web3ProviderProps {
  children: ReactNode;
}

// Module-level flag to track initialization
let appKitInitialized = false;
let appKitInitAttempted = false;

// Initialize AppKit at module load time (before any React render)
// This ensures createAppKit is called before useAppKit hooks
function initializeAppKit() {
  if (appKitInitialized) return true;
  if (appKitInitAttempted) return false;
  if (typeof window === 'undefined') return false;
  
  // Skip AppKit initialization if project ID is invalid
  if (!HAS_WALLETCONNECT_PROJECT_ID) {
    console.log('[Web3Provider] Skipping AppKit initialization - no valid WalletConnect Project ID');
    appKitInitAttempted = true;
    return false;
  }
  
  try {
    appKitInitAttempted = true;
    createAppKit({
      adapters: [wagmiAdapter],
      networks,
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        ...metadata,
        icons: ['/zs-icon-192.png'],
      },
      features: {
        analytics: true,
        email: false,
        socials: false,
      },
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': 'hsl(142, 76%, 36%)', // ZenSolar primary green
        '--w3m-color-mix': 'hsl(142, 76%, 36%)',
        '--w3m-color-mix-strength': 15,
        '--w3m-border-radius-master': '12px',
        '--w3m-font-family': 'Inter, system-ui, sans-serif',
        '--w3m-z-index': 1000,
      },
      // Feature MetaMask and Base Wallet (Coinbase) prominently
      featuredWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
        'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet / Base Wallet
      ],
      enableCoinbase: true,
      coinbasePreference: 'all',
    });
    console.log('[Web3Provider] AppKit initialized at module load');
    appKitInitialized = true;
    return true;
  } catch (error) {
    console.error('[Web3Provider] AppKit initialization failed:', error);
    // Don't mark initialized; keep it false so components never call useAppKit.
    return false;
  }
}

// Initialize immediately when module loads
initializeAppKit();

export function Web3Provider({ children }: Web3ProviderProps) {
  const [isInitialized, setIsInitialized] = useState(appKitInitialized);
  const [hasProjectId, setHasProjectId] = useState(HAS_WALLETCONNECT_PROJECT_ID);
  
  useEffect(() => {
    // Double-check initialization and update state
    setHasProjectId(HAS_WALLETCONNECT_PROJECT_ID);

    const didInit = initializeAppKit();
    // Small delay to ensure AppKit internal state is fully ready
    const timer = setTimeout(() => setIsInitialized(didInit && appKitInitialized), 50);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <AppKitContext.Provider value={{ isInitialized, hasProjectId }}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </AppKitContext.Provider>
  );
}
