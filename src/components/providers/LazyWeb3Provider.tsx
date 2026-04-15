import { type ComponentType, type ReactNode, useState, useEffect, createContext, useContext, useRef } from 'react';

// Context so any component can check if wagmi hooks are safe to call
const Web3ReadyContext = createContext(false);

/** Returns true when WagmiProvider is mounted and wagmi hooks are safe to call. */
export function useWeb3Ready() {
  return useContext(Web3ReadyContext);
}

/** Inner wrapper that signals Web3 is ready */
function Web3ReadyGate({ children }: { children: ReactNode }) {
  return (
    <Web3ReadyContext.Provider value={true}>
      {children}
    </Web3ReadyContext.Provider>
  );
}

interface LazyWeb3ProviderProps {
  children: ReactNode;
}

type LoadedWeb3Provider = ComponentType<{ children: ReactNode }>;

/**
 * Deferred Web3Provider: renders children immediately, then loads the heavy
 * Web3/AppKit layer after first paint. If that chunk fails, keep the app usable
 * instead of crashing the whole tree.
 */
export function LazyWeb3Provider({ children }: LazyWeb3ProviderProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [LoadedProvider, setLoadedProvider] = useState<LoadedWeb3Provider | null>(null);
  const loadAttemptedRef = useRef(false);

  useEffect(() => {
    // Defer Web3 loading until after initial paint
    if ('requestIdleCallback' in window) {
      const id = (window as Window & typeof globalThis & { requestIdleCallback: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number; cancelIdleCallback: (handle: number) => void; }).requestIdleCallback(() => setShouldLoad(true), { timeout: 3000 });
      return () => (window as Window & typeof globalThis & { cancelIdleCallback: (handle: number) => void; }).cancelIdleCallback(id);
    }

    const timer = window.setTimeout(() => setShouldLoad(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!shouldLoad || loadAttemptedRef.current) return;

    let cancelled = false;
    loadAttemptedRef.current = true;

    import('./Web3Provider')
      .then((module) => {
        if (cancelled) return;
        setLoadedProvider(() => module.Web3Provider);
      })
      .catch((error) => {
        console.error('[LazyWeb3Provider] Failed to load Web3 provider chunk:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [shouldLoad]);

  if (!shouldLoad || !LoadedProvider) {
    // Render children immediately without Web3 - app is usable.
    // Web3ReadyContext stays false so wagmi hooks are guarded.
    return <>{children}</>;
  }

  return (
    <LoadedProvider>
      <Web3ReadyGate>{children}</Web3ReadyGate>
    </LoadedProvider>
  );
}
