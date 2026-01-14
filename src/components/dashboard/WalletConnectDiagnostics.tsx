import { useMemo } from 'react';
import { Button } from '@/components/ui/button';

export type WalletDiagEvents = {
  connectButtonTap?: number;
  deepLinkMetaMaskTap?: number;
  deepLinkCoinbaseTap?: number;
  deepLinkTrustTap?: number;
  disconnectTap?: number;
  resetTap?: number;
  walletConnectedDetected?: number;
  walletDisconnectedDetected?: number;
};

interface WalletConnectDiagnosticsProps {
  isMobile: boolean;
  isStandalone: boolean;
  userAgent: string;
  isConnected: boolean;
  wagmiAddress: string | undefined;
  chainId: number | undefined;
  profileWalletAddress: string | null;
  lastSaveError: string | null;
  events: WalletDiagEvents;
  onReset: () => Promise<void> | void;
}

function formatTs(ts?: number) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return String(ts);
  }
}

export function WalletConnectDiagnostics({
  isMobile,
  isStandalone,
  userAgent,
  isConnected,
  wagmiAddress,
  chainId,
  profileWalletAddress,
  lastSaveError,
  events,
  onReset,
}: WalletConnectDiagnosticsProps) {
  const storageInfo = useMemo(() => {
    if (typeof window === 'undefined') return null;

    try {
      const keys = Object.keys(window.localStorage ?? {});
      const match = (k: string) =>
        /^wagmi/i.test(k) ||
        /^rk-/i.test(k) ||
        /^wc@2:/i.test(k) ||
        /walletconnect/i.test(k);

      const matchedKeys = keys.filter(match);
      return {
        total: keys.length,
        matched: matchedKeys.length,
        sample: matchedKeys.slice(0, 6),
      };
    } catch {
      return null;
    }
  }, [events.resetTap]);

  return (
    <details className="mt-3 rounded-md border border-border bg-muted/30 p-3">
      <summary className="cursor-pointer select-none text-xs font-medium text-foreground">
        Wallet connect diagnostics
      </summary>

      <div className="mt-3 space-y-3">
        <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
          <div className="rounded-md border border-border bg-background p-2">
            <p className="text-muted-foreground">Device</p>
            <p className="mt-1">mobile: <span className="font-mono">{String(isMobile)}</span></p>
            <p>pwa: <span className="font-mono">{String(isStandalone)}</span></p>
          </div>

          <div className="rounded-md border border-border bg-background p-2">
            <p className="text-muted-foreground">Wallet state</p>
            <p className="mt-1">wagmi connected: <span className="font-mono">{String(isConnected)}</span></p>
            <p>wagmi address: <span className="font-mono break-all">{wagmiAddress ?? '—'}</span></p>
            <p>chainId: <span className="font-mono">{chainId ?? '—'}</span></p>
            <p>profile wallet: <span className="font-mono break-all">{profileWalletAddress ?? '—'}</span></p>
          </div>
        </div>

        <div className="rounded-md border border-border bg-background p-2 text-xs">
          <p className="text-muted-foreground">Last taps</p>
          <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
            <p>Connect: <span className="font-mono">{formatTs(events.connectButtonTap)}</span></p>
            <p>MetaMask link: <span className="font-mono">{formatTs(events.deepLinkMetaMaskTap)}</span></p>
            <p>Coinbase link: <span className="font-mono">{formatTs(events.deepLinkCoinbaseTap)}</span></p>
            <p>Trust link: <span className="font-mono">{formatTs(events.deepLinkTrustTap)}</span></p>
            <p>Disconnect: <span className="font-mono">{formatTs(events.disconnectTap)}</span></p>
            <p>Reset: <span className="font-mono">{formatTs(events.resetTap)}</span></p>
            <p>Detected connect: <span className="font-mono">{formatTs(events.walletConnectedDetected)}</span></p>
            <p>Detected disconnect: <span className="font-mono">{formatTs(events.walletDisconnectedDetected)}</span></p>
          </div>
        </div>

        {lastSaveError && (
          <div className="rounded-md border border-border bg-background p-2 text-xs">
            <p className="text-muted-foreground">Last save error</p>
            <p className="mt-1 font-mono break-all">{lastSaveError}</p>
          </div>
        )}

        {storageInfo && (
          <div className="rounded-md border border-border bg-background p-2 text-xs">
            <p className="text-muted-foreground">Storage</p>
            <p className="mt-1">
              localStorage keys: <span className="font-mono">{storageInfo.total}</span> • wallet-related: <span className="font-mono">{storageInfo.matched}</span>
            </p>
            {storageInfo.sample.length > 0 && (
              <p className="mt-1 font-mono break-all">sample: {storageInfo.sample.join(', ')}</p>
            )}
          </div>
        )}

        <div className="rounded-md border border-border bg-background p-2 text-xs">
          <p className="text-muted-foreground">User agent</p>
          <p className="mt-1 font-mono break-all">{userAgent || '—'}</p>
        </div>

        <Button variant="destructive" size="sm" className="w-full" onClick={() => void onReset()}>
          Reset wallet connection (clear cache + saved wallet)
        </Button>
      </div>
    </details>
  );
}
