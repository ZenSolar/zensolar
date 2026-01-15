import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check } from 'lucide-react';
import { hardResetWalletStorage, getWalletStorageStats } from '@/lib/walletStorage';

export type WalletDiagEvents = {
  connectButtonTap?: number;
  reconnectButtonTap?: number;
  deepLinkMetaMaskTap?: number;
  deepLinkCoinbaseTap?: number;
  deepLinkTrustTap?: number;
  deepLinkRainbowTap?: number;
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
  const [isResetting, setIsResetting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastResetResult, setLastResetResult] = useState<{
    localStorage: number;
    sessionStorage: number;
    indexedDB: number;
  } | null>(null);

  const storageStats = useMemo(() => {
    return getWalletStorageStats();
  }, [events.resetTap, lastResetResult]);

  const handleHardReset = async () => {
    setIsResetting(true);
    try {
      const result = await hardResetWalletStorage();
      setLastResetResult(result);
      await onReset();
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopyDiagnostics = async () => {
    const diagnostics = {
      device: { isMobile, isStandalone },
      walletState: { 
        wagmiConnected: isConnected, 
        wagmiAddress, 
        chainId, 
        profileWallet: profileWalletAddress 
      },
      events,
      storage: storageStats,
      lastSaveError,
      userAgent,
      timestamp: new Date().toISOString(),
    };
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy diagnostics');
    }
  };

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
            <p>MetaMask: <span className="font-mono">{formatTs(events.deepLinkMetaMaskTap)}</span></p>
            <p>Coinbase: <span className="font-mono">{formatTs(events.deepLinkCoinbaseTap)}</span></p>
            <p>Trust: <span className="font-mono">{formatTs(events.deepLinkTrustTap)}</span></p>
            <p>Rainbow: <span className="font-mono">{formatTs(events.deepLinkRainbowTap)}</span></p>
            <p>Disconnect: <span className="font-mono">{formatTs(events.disconnectTap)}</span></p>
            <p>Reset: <span className="font-mono">{formatTs(events.resetTap)}</span></p>
            <p>Detected connect: <span className="font-mono">{formatTs(events.walletConnectedDetected)}</span></p>
            <p>Detected disconnect: <span className="font-mono">{formatTs(events.walletDisconnectedDetected)}</span></p>
          </div>
        </div>

        {lastSaveError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs">
            <p className="text-destructive font-medium">Last save error</p>
            <p className="mt-1 font-mono break-all">{lastSaveError}</p>
          </div>
        )}

        <div className="rounded-md border border-border bg-background p-2 text-xs">
          <p className="text-muted-foreground">Storage (wallet-related keys)</p>
          <p className="mt-1">
            localStorage: <span className="font-mono">{storageStats.totalLocalStorage}</span> • 
            sessionStorage: <span className="font-mono">{storageStats.totalSessionStorage}</span>
          </p>
          {storageStats.localStorageKeys.length > 0 && (
            <p className="mt-1 font-mono break-all text-[10px]">
              {storageStats.localStorageKeys.slice(0, 5).join(', ')}
              {storageStats.localStorageKeys.length > 5 && ` +${storageStats.localStorageKeys.length - 5} more`}
            </p>
          )}
          {lastResetResult && (
            <p className="mt-2 text-green-600 dark:text-green-400">
              Last reset cleared: {lastResetResult.localStorage} local, {lastResetResult.sessionStorage} session, {lastResetResult.indexedDB} IndexedDB
            </p>
          )}
        </div>

        <div className="rounded-md border border-border bg-background p-2 text-xs">
          <p className="text-muted-foreground">User agent</p>
          <p className="mt-1 font-mono break-all text-[10px]">{userAgent || '—'}</p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs"
            onClick={handleCopyDiagnostics}
          >
            {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
            {copied ? 'Copied!' : 'Copy diagnostics'}
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            className="flex-1 text-xs" 
            onClick={handleHardReset}
            disabled={isResetting}
          >
            {isResetting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            Hard reset (all caches)
          </Button>
        </div>
      </div>
    </details>
  );
}
