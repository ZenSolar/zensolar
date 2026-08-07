import { type ComponentType, type ReactNode, useState, useEffect, createContext, useContext, useRef } from 'react';
import { isPublicMarketingPath } from '@/lib/hostRoles';

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
    // Public marketing / pre-auth surfaces never use wallets — keep the whole
    // Web3 stack off the wire for anonymous visitors. We re-check on history
    // changes so entering the app mounts it as soon as it's actually needed.
    const browserWindow = window as Window & typeof globalThis & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    let pollId: ReturnType<typeof setInterval> | undefined;

    const schedule = () => {
      if (typeof browserWindow.requestIdleCallback === 'function') {
        idleId = browserWindow.requestIdleCallback(() => setShouldLoad(true), { timeout: 3000 });
      } else {
        timerId = globalThis.setTimeout(() => setShouldLoad(true), 1500);
      }
    };

    if (!isPublicMarketingPath()) {
      schedule();
    } else {
      // Cheap poll (client-side routing emits no universal event) — stops as
      // soon as the visitor leaves a public route.
      pollId = globalThis.setInterval(() => {
        if (!isPublicMarketingPath()) {
          globalThis.clearInterval(pollId);
          pollId = undefined;
          schedule();
        }
      }, 800);
    }

    return () => {
      if (idleId !== undefined) browserWindow.cancelIdleCallback?.(idleId);
      if (timerId !== undefined) globalThis.clearTimeout(timerId);
      if (pollId !== undefined) globalThis.clearInterval(pollId);
    };
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
    // The `key` forces a fresh mount when Web3 becomes ready, so any
    // descendant using `useSafeHook` (which conditionally calls wagmi hooks
    // based on `useWeb3Ready()`) sees a stable hook count for its lifetime —
    // preventing "Rendered more/fewer hooks than during the previous render".
    return <div key="web3-pending" style={{ display: 'contents' }}>{children}</div>;
  }

  return (
    <LoadedProvider>
      <Web3ReadyGate>
        <div key="web3-ready" style={{ display: 'contents' }}>{children}</div>
      </Web3ReadyGate>
    </LoadedProvider>
  );
}
