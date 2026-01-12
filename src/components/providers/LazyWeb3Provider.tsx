import { ReactNode, lazy, Suspense } from 'react';

// Lazy load the heavy Web3 dependencies
const Web3Provider = lazy(() => 
  import('./Web3Provider').then(module => ({ default: module.Web3Provider }))
);

interface LazyWeb3ProviderProps {
  children: ReactNode;
}

// Minimal fallback that doesn't block rendering
function Web3Fallback({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function LazyWeb3Provider({ children }: LazyWeb3ProviderProps) {
  return (
    <Suspense fallback={<Web3Fallback>{children}</Web3Fallback>}>
      <Web3Provider>{children}</Web3Provider>
    </Suspense>
  );
}
