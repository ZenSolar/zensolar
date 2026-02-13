import { ReactNode, lazy, Suspense, useState, useEffect, createContext, useContext } from 'react';

// Lazy load the heavy Web3 dependencies
const Web3Provider = lazy(() => 
  import('./Web3Provider').then(module => ({ default: module.Web3Provider }))
);

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

/**
 * Deferred Web3Provider: renders children IMMEDIATELY, then wraps them in
 * Web3Provider once the chunk has loaded (after a short idle delay).
 * This prevents the ~400KB Web3/AppKit bundle from blocking FCP/LCP.
 */
export function LazyWeb3Provider({ children }: LazyWeb3ProviderProps) {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Defer Web3 loading until after initial paint
    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(() => setShouldLoad(true), { timeout: 3000 });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const timer = setTimeout(() => setShouldLoad(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!shouldLoad) {
    // Render children immediately without Web3 - app is usable
    // Web3ReadyContext stays false so wagmi hooks are guarded
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<>{children}</>}>
      <Web3Provider>
        <Web3ReadyGate>{children}</Web3ReadyGate>
      </Web3Provider>
    </Suspense>
  );
}
