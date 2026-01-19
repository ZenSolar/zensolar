import { useAppKit, useAppKitAccount, useAppKitState } from '@reown/appkit/react';
import { useChainId, useSwitchChain, useDisconnect } from 'wagmi';
import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Wallet, CheckCircle2, LogOut, AlertTriangle, Link2, Coins, ExternalLink } from 'lucide-react';
import { CHAIN_ID, HAS_WALLETCONNECT_PROJECT_ID } from '@/lib/wagmi';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrandedSpinner } from '@/components/ui/branded-spinner';
import { WalletConnectDiagnostics, type WalletDiagEvents } from './WalletConnectDiagnostics';
import { hardResetWalletStorage } from '@/lib/walletStorage';
import { autoPromptAddToken, resetTokenPromptFlag } from '@/lib/walletAssets';
import { useAppKitInitialized } from '@/components/providers/Web3Provider';

interface ConnectWalletProps {
  walletAddress: string | null;
  onConnect: (address: string) => Promise<void>;
  onDisconnect?: () => Promise<void>;
  onMintTokens?: () => void;
  isDemo?: boolean;
  showDiagnostics?: boolean;
}

function normalizeAddress(addr?: string | null) {
  return (addr ?? '').toLowerCase();
}

export function ConnectWallet({ walletAddress, onConnect, onDisconnect, onMintTokens, isDemo = false, showDiagnostics = false }: ConnectWalletProps) {
  // AppKit initialization state
  const { isInitialized } = useAppKitInitialized();
  
  // AppKit hooks
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { open: isModalOpen } = useAppKitState();
  
  // Wagmi hooks
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();

  const hasHandledConnection = useRef(false);
  const prevConnectedRef = useRef(false);

  const [events, setEvents] = useState<WalletDiagEvents>({});
  const [lastSaveError, setLastSaveError] = useState<string | null>(null);
  const [wcProjectIdDraft, setWcProjectIdDraft] = useState('');

  const mark = useCallback((key: keyof WalletDiagEvents) => {
    setEvents((prev) => ({ ...prev, [key]: Date.now() }));
  }, []);

  const device = useMemo(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);

    const isStandalone = (() => {
      if (typeof window === 'undefined') return false;
      const iosStandalone = (navigator as any)?.standalone === true;
      const displayModeStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches === true;
      return iosStandalone || displayModeStandalone;
    })();

    return {
      userAgent: ua,
      isMobile,
      isStandalone,
      showDeepLinks: isMobile && isStandalone,
    };
  }, []);

  const isWalletSaved = useMemo(() => {
    if (!address) return false;
    if (!walletAddress) return false;
    return normalizeAddress(address) === normalizeAddress(walletAddress);
  }, [address, walletAddress]);

  // Auto-switch to Base Sepolia when wallet connects on wrong network
  const ensureCorrectNetwork = useCallback(async () => {
    if (isConnected && chainId !== CHAIN_ID) {
      toast.info('Switching to Base Sepolia network...', { duration: 3000 });
      try {
        await switchChain({ chainId: CHAIN_ID });
        toast.success('Switched to Base Sepolia!');
      } catch (error: any) {
        console.error('Network switch error:', error);
        if (error?.code === 4902 || error?.message?.includes('Unrecognized chain')) {
          toast.error('Please add Base Sepolia manually in your wallet', { duration: 5000 });
        } else {
          toast.error('Network switch declined - please switch manually');
        }
      }
    }
  }, [isConnected, chainId, switchChain]);

  // Detect connect/disconnect transitions and auto-save to profile
  useEffect(() => {
    const justConnected = isConnected && !prevConnectedRef.current;
    const justDisconnected = !isConnected && prevConnectedRef.current;

    prevConnectedRef.current = isConnected;

    if (justConnected) {
      mark('walletConnectedDetected');
      if (address) {
        console.log('[ConnectWallet] Wallet connected:', address);
      }

      // Auto-save wallet to profile if not already saved
      if (address && !hasHandledConnection.current) {
        const alreadySaved = normalizeAddress(address) === normalizeAddress(walletAddress);
        if (!alreadySaved) {
          hasHandledConnection.current = true;
          console.log('[ConnectWallet] Auto-linking wallet to profile...');
          onConnect(address)
            .then(() => {
              toast.success('Wallet linked to your profile!');
              // Auto-prompt to add ZSOLAR token after successful connection
              autoPromptAddToken();
            })
            .catch((err) => {
              console.error('[ConnectWallet] Auto-link failed:', err);
              const msg = err instanceof Error ? err.message : String(err);
              setLastSaveError(msg);
              // Reset so user can retry manually
              hasHandledConnection.current = false;
            });
        } else {
          // Already saved, still prompt to add token
          autoPromptAddToken();
        }
      }
    }

    if (justDisconnected) {
      mark('walletDisconnectedDetected');
      console.log('[ConnectWallet] Wallet disconnected');
      hasHandledConnection.current = false;
      resetTokenPromptFlag();
    }
  }, [isConnected, address, mark, walletAddress, onConnect]);

  // Handler to open the mint tokens dialog
  const handleAddToken = useCallback(() => {
    if (onMintTokens) {
      onMintTokens();
    } else {
      toast.info('Mint tokens from the Reward Actions section');
    }
  }, [onMintTokens]);

  const handleReset = useCallback(async () => {
    mark('resetTap');

    try {
      disconnect();
    } catch {
      // ignore
    }

    try {
      if (onDisconnect) {
        await onDisconnect();
      }
    } catch (err) {
      console.error('[ConnectWallet] Failed to clear saved wallet:', err);
    }

    await hardResetWalletStorage();

    // allow a clean retry
    hasHandledConnection.current = false;
    prevConnectedRef.current = false;

    toast.success('Wallet state cleared. Try connecting again.');
  }, [disconnect, onDisconnect, mark]);


  // Handle disconnect (soft)
  const handleDisconnect = useCallback(async () => {
    mark('disconnectTap');

    try {
      disconnect();

      if (onDisconnect) {
        await onDisconnect();
      }

      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect wallet');
    }
  }, [disconnect, onDisconnect, mark]);

  const handleSaveWallet = useCallback(async () => {
    if (!address) return;

    setLastSaveError(null);

    try {
      await onConnect(address);
      toast.success('Wallet linked to your profile');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLastSaveError(msg);
      toast.error('Failed to link wallet to your profile');
    }
  }, [address, onConnect]);

  const handleOpenConnect = useCallback(() => {
    mark('connectButtonTap');
    open({ view: 'Connect' });
  }, [open, mark]);

  const handleOpenAccount = useCallback(() => {
    open({ view: 'Account' });
  }, [open]);

  if (isDemo) {
    // Generate a fake wallet address for demo
    const fakeWalletAddress = walletAddress || '0x7a3F...8E4d';
    const isConnectedDemo = Boolean(walletAddress);
    
    return (
      <div className={`rounded-lg border p-4 ${isConnectedDemo ? 'border-primary/30 bg-card' : 'border-border bg-card'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isConnectedDemo ? 'bg-primary/10' : 'bg-muted'}`}>
            {isConnectedDemo ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <Wallet className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {isConnectedDemo ? 'Wallet Connected!' : 'Connect Wallet'}
            </p>
            {isConnectedDemo ? (
              <p className="text-xs text-muted-foreground font-mono">{fakeWalletAddress}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Demo mode</p>
            )}
          </div>
        </div>
        
        {isConnectedDemo ? (
          <div className="flex flex-col gap-2">
            {/* Base Sepolia indicator */}
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 rounded-lg text-sm text-primary font-medium">
              <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">B</div>
              Base Sepolia
            </div>
            
            <Button
              variant="secondary"
              size="sm"
              type="button"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => {
                if (onMintTokens) {
                  onMintTokens();
                } else {
                  toast.info('Demo: Navigate to mint tokens from the actions below');
                }
              }}
            >
              <Coins className="h-4 w-4" />
              Add $ZSOLAR to Wallet
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                if (onDisconnect) {
                  onDisconnect();
                }
              }}
              className="w-full flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Disconnect Wallet
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              // Generate a fake wallet address
              const fakeAddr = '0x7a3F' + Math.random().toString(16).slice(2, 6).toUpperCase() + '...8E4d';
              onConnect(fakeAddr);
            }}
          >
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet (Demo)
          </Button>
        )}
      </div>
    );
  }

  // Show saved wallet from profile even if wagmi isn't actively connected
  // This handles PWA standalone mode where wagmi state doesn't persist across app restarts
  const hasSavedWallet = Boolean(walletAddress);
  const showAsConnected = isConnected && address;
  const showAsSavedButNotLive = !isConnected && hasSavedWallet;

  // Connected in wallet (wagmi). We render a disconnect + diagnostics even if not yet saved to profile.
  if (showAsConnected) {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
      <div className={`rounded-lg border p-4 ${isWalletSaved ? 'border-border bg-card' : 'border-border bg-card'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isWalletSaved ? 'bg-primary/10' : 'bg-muted'}`}>
            {isWalletSaved ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {isWalletSaved ? 'Wallet Connected!' : 'Wallet Connected (not linked)'}
            </p>
            <p className="text-xs text-muted-foreground font-mono">{shortAddress}</p>
          </div>
        </div>

        {!isWalletSaved && (
          <div className="mb-3 rounded-md border border-border bg-muted/30 p-3 text-xs">
            <p className="text-foreground font-medium flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Your wallet is connected, but it hasn't been saved to your profile yet.
            </p>
            <p className="mt-1 text-muted-foreground">
              This is the most common reason the "Disconnect Wallet" button appears to be missing.
            </p>
            <div className="mt-2 flex flex-col gap-2">
              <Button type="button" variant="secondary" size="sm" className="w-full" onClick={() => void handleSaveWallet()}>
                Link wallet to profile
              </Button>
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => void handleReset()}>
                Reset and try again
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {/* Network button - use chainId directly */}
          {chainId === CHAIN_ID ? (
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 rounded-lg text-sm text-primary font-medium">
              <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">B</div>
              Base Sepolia
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => void ensureCorrectNetwork()}
              className="w-full flex items-center justify-center gap-2"
            >
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Switch to Base Sepolia
            </Button>
          )}

          {/* View Account Details - opens AppKit modal */}
          <button
            onClick={handleOpenAccount}
            type="button"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary/30 rounded-lg text-sm hover:bg-secondary/50 transition-colors"
          >
            View Account Details
          </button>

          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => void handleAddToken()}
            className="w-full flex items-center justify-center gap-2"
          >
            <Coins className="h-4 w-4" />
            Add $ZSOLAR to Wallet
          </Button>

          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => void handleDisconnect()}
            className="w-full flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Disconnect Wallet
          </Button>
        </div>

        {showDiagnostics && (
          <WalletConnectDiagnostics
            isMobile={device.isMobile}
            isStandalone={device.isStandalone}
            userAgent={device.userAgent}
            isConnected={isConnected}
            wagmiAddress={address}
            chainId={chainId}
            profileWalletAddress={walletAddress}
            lastSaveError={lastSaveError}
            events={events}
            onReset={handleReset}
          />
        )}
      </div>
    );
  }

  // Wallet saved in profile but wagmi session not active (common in PWA standalone mode)
  if (showAsSavedButNotLive) {
    const shortAddress = `${walletAddress!.slice(0, 6)}...${walletAddress!.slice(-4)}`;

    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Wallet Linked</p>
            <p className="text-xs text-muted-foreground font-mono">{shortAddress}</p>
          </div>
        </div>

        <div className="rounded-md border border-border bg-muted/30 p-3 text-xs mb-3">
          <p className="text-foreground font-medium flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Your wallet is saved to your profile
          </p>
          <p className="mt-1 text-muted-foreground">
            Reconnect your wallet to perform on-chain actions like minting NFTs.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => {
            mark('reconnectButtonTap');
            handleOpenConnect();
          }}
        >
          <Wallet className="h-4 w-4 mr-2" />
          Reconnect Wallet
        </Button>

        {showDiagnostics && (
          <WalletConnectDiagnostics
            isMobile={device.isMobile}
            isStandalone={device.isStandalone}
            userAgent={device.userAgent}
            isConnected={isConnected}
            wagmiAddress={address}
            chainId={chainId}
            profileWalletAddress={walletAddress}
            lastSaveError={lastSaveError}
            events={events}
            onReset={handleReset}
          />
        )}
      </div>
    );
  }

  // Show loading spinner while AppKit is initializing
  if (!isInitialized && !isDemo) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Connect Wallet</p>
            <p className="text-xs text-muted-foreground">Initializing...</p>
          </div>
        </div>
        <div className="flex justify-center py-4">
          <BrandedSpinner size="md" label="Preparing wallet connection..." />
        </div>
      </div>
    );
  }

  // Default: Not connected state
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Connect Wallet</p>
          <p className="text-xs text-muted-foreground">Link your wallet to earn $ZSOLAR rewards</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleOpenConnect}
          type="button"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors active:scale-[0.98]"
        >
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </button>

        {device.isMobile && !HAS_WALLETCONNECT_PROJECT_ID && (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
            <p className="text-foreground font-medium">WalletConnect Setup</p>
            <div className="mt-2 space-y-2">
              <p className="text-muted-foreground">
                WalletConnect Project ID isn't configured yet.
              </p>
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  value={wcProjectIdDraft}
                  onChange={(e) => setWcProjectIdDraft(e.target.value)}
                  placeholder="Paste WalletConnect Project ID"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const v = wcProjectIdDraft.trim();
                    if (!v) {
                      toast.error('Please paste a WalletConnect Project ID');
                      return;
                    }
                    try {
                      window.localStorage.setItem('walletconnect_project_id', v);
                      toast.success('Saved. Reloading…');
                      window.location.reload();
                    } catch {
                      toast.error('Could not save to device storage');
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            </div>

            {lastSaveError ? (
              <p className="mt-2 text-[10px] text-destructive break-words">{lastSaveError}</p>
            ) : null}
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground text-center">💡 Tap to connect • MetaMask, Base Wallet & more</p>

      {showDiagnostics && (
        <WalletConnectDiagnostics
          isMobile={device.isMobile}
          isStandalone={device.isStandalone}
          userAgent={device.userAgent}
          isConnected={isConnected}
          wagmiAddress={address}
          chainId={chainId}
          profileWalletAddress={walletAddress}
          lastSaveError={lastSaveError}
          events={events}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
