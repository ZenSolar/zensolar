/**
 * Safe wagmi hook wrappers that return sensible defaults when
 * WagmiProvider is not yet mounted (during LazyWeb3Provider deferred load).
 * This prevents the "No QueryClient set" crash on PWA cold start.
 */
import { useWeb3Ready } from '@/components/providers/LazyWeb3Provider';
import { useAccount, useWalletClient, useWatchAsset } from 'wagmi';

// When Web3 isn't ready, return the fallback. When it is, call the real hook.
// The conditional is stable per render (context value doesn't flip mid-render).
function useSafeHook<T>(hookFn: () => T, fallback: NoInfer<T>): T {
  const ready = useWeb3Ready();
  if (!ready) return fallback;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return hookFn();
}

const ACCOUNT_FALLBACK = {
  address: undefined,
  isConnected: false,
  connector: undefined,
  chain: undefined,
  chainId: undefined,
  status: 'disconnected' as const,
  addresses: undefined,
  isConnecting: false,
  isDisconnected: true,
  isReconnecting: false,
} as ReturnType<typeof useAccount>;

export function useSafeAccount() {
  return useSafeHook(() => useAccount(), ACCOUNT_FALLBACK);
}

export function useSafeWalletClient(): ReturnType<typeof useWalletClient> {
  return useSafeHook(
    () => useWalletClient(),
    { data: undefined } as any,
  );
}

export function useSafeWatchAsset() {
  return useSafeHook(
    () => useWatchAsset(),
    { watchAssetAsync: undefined } as any as ReturnType<typeof useWatchAsset>,
  );
}
