import { ReactNode, lazy, Suspense } from 'react';

// Lazy load the heavy Web3 dependencies
const Web3Provider = lazy(() => 
  import('./Web3Provider').then(module => ({ default: module.Web3Provider }))
);

interface LazyWeb3ProviderProps {
  children: ReactNode;
}

// Minimal fallback that doesn't render children (prevents wagmi hooks from running
// outside of WagmiProvider while Web3Provider is still loading).
function Web3Fallback() {
  return null;
}

export function LazyWeb3Provider({ children }: LazyWeb3ProviderProps) {
  return (
    <Suspense fallback={<Web3Fallback />}>
      <Web3Provider>{children}</Web3Provider>
    </Suspense>
  );
}

