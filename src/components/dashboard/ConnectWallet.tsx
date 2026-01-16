import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useSwitchChain, useDisconnect, useConnect } from 'wagmi';
import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Wallet, CheckCircle2, LogOut, AlertTriangle, Link2, Coins } from 'lucide-react';
import { CHAIN_ID } from '@/lib/wagmi';

import { Button } from '@/components/ui/button';
import { WalletConnectDiagnostics, type WalletDiagEvents } from './WalletConnectDiagnostics';
import { WalletDeepLinks, getWalletConnectDeepLink, type WalletDeepLinkWalletId } from './WalletDeepLinks';
import { hardResetWalletStorage } from '@/lib/walletStorage';
import { autoPromptAddToken, resetTokenPromptFlag } from '@/lib/walletAssets';

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

function markForWallet(set: (key: keyof WalletDiagEvents) => void, wallet: WalletDeepLinkWalletId) {
  switch (wallet) {
    case 'metamask':
      set('deepLinkMetaMaskTap');
      break;
    case 'coinbase':
      set('deepLinkCoinbaseTap');
      break;
    case 'trust':
      set('deepLinkTrustTap');
      break;
    case 'rainbow':
      set('deepLinkRainbowTap');
      break;
  }
}

export function ConnectWallet({ walletAddress, onConnect, onDisconnect, onMintTokens, isDemo = false, showDiagnostics = false }: ConnectWalletProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const { connectAsync, connectors } = useConnect();

  const hasHandledConnection = useRef(false);
  const prevConnectedRef = useRef(false);

  const [events, setEvents] = useState<WalletDiagEvents>({});
  const [lastSaveError, setLastSaveError] = useState<string | null>(null);
  const [wcUri, setWcUri] = useState<string | undefined>(undefined);
  const [isStartingWc, setIsStartingWc] = useState(false);

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

  useEffect(() => {
    if (isConnected) setIsStartingWc(false);
  }, [isConnected]);

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

  const startWalletConnectDeepLink = useCallback(
    async (wallet: WalletDeepLinkWalletId) => {
      // This is the critical fix: we first start a WalletConnect pairing (to obtain a WC URI),
      // then deep-link into the wallet with that URI so the session persists back to the PWA.
      const wcConnector = connectors.find((c) => (c as any)?.id === 'walletConnect') ?? connectors.find((c) => (c as any)?.type === 'walletConnect');

      if (!wcConnector) {
        toast.error('WalletConnect is not available on this device.');
        return;
      }

      setLastSaveError(null);
      setIsStartingWc(true);

      try {
        const provider: any = await (wcConnector as any).getProvider?.();
        if (!provider?.on) {
          toast.error('WalletConnect provider not available.');
          setIsStartingWc(false);
          return;
        }

        let opened = false;
        const handleUri = (uri: string) => {
          if (opened) return;
          opened = true;
          setWcUri(uri);

          const deepLink = getWalletConnectDeepLink(wallet, uri);
          if (deepLink) {
            // Give React a tick to flush state (diagnostics timestamps, etc.)
            setTimeout(() => {
              window.location.href = deepLink;
            }, 50);
          }
        };

        provider.on('display_uri', handleUri);

        // Trigger pairing (do not await; the user will jump to the wallet app)
        void connectAsync({ connector: wcConnector, chainId: CHAIN_ID }).catch((err) => {
          const msg = err instanceof Error ? err.message : String(err);
          setLastSaveError(msg);
          setIsStartingWc(false);
        });

        // Cleanup / safety timeout
        setTimeout(() => {
          try {
            provider.off?.('display_uri', handleUri);
          } catch {
            // ignore
          }
          setIsStartingWc(false);
        }, 30000);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setLastSaveError(msg);
        setIsStartingWc(false);
        toast.error('Failed to start WalletConnect.');
        console.error('[ConnectWallet] WalletConnect start error:', err);
      }
    },
    [connectAsync, connectors]
  );

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

      // Close any RainbowKit modals
      setTimeout(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }, 200);

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
    setWcUri(undefined);

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

  if (isDemo) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Connect Wallet</p>
            <p className="text-xs text-muted-foreground">Disabled in demo mode</p>
          </div>
        </div>
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
          {/* Network button - use chainId directly since RainbowKit chain data may not hydrate properly in PWA */}
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

          <ConnectButton.Custom>
            {({ openAccountModal, mounted }) => {
              if (!mounted) return null;

              return (
                <button
                  onClick={openAccountModal}
                  type="button"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary/30 rounded-lg text-sm hover:bg-secondary/50 transition-colors"
                >
                  View Account Details
                </button>
              );
            }}
          </ConnectButton.Custom>

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

        <ConnectButton.Custom>
          {({ openConnectModal, mounted }) => {
            if (!mounted) return null;
            
            return (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => {
                  mark('reconnectButtonTap');
                  openConnectModal();
                }}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Reconnect Wallet
              </Button>
            );
          }}
        </ConnectButton.Custom>


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

      <ConnectButton.Custom>
        {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
          const ready = mounted;
          const connected = ready && account && chain;

          const handleOpenConnect = () => {
            mark('connectButtonTap');
            try {
              openConnectModal();
            } catch (err) {
              console.error('[ConnectWallet] openConnectModal error:', err);
            }
          };

          if (!ready) {
            return (
              <div className="opacity-60">
                <Button type="button" className="w-full" disabled>
                  Loading wallets…
                </Button>
              </div>
            );
          }

          if (!connected) {
            return (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleOpenConnect}
                  type="button"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors active:scale-[0.98]"
                >
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </button>

              </div>
            );
          }

          if (chain?.unsupported) {
            return (
              <button
                onClick={openChainModal}
                type="button"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 transition-colors"
              >
                Wrong Network - Click to Switch
              </button>
            );
          }

          return (
            <div className="flex flex-col gap-2">
              <button
                onClick={openChainModal}
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary/50 rounded-lg text-sm hover:bg-secondary/70 transition-colors"
              >
                {chain?.hasIcon && chain.iconUrl && (
                  <img alt={chain.name ?? 'Chain icon'} src={chain.iconUrl} className="h-4 w-4 rounded-full" />
                )}
                {chain?.name}
              </button>

              <button
                onClick={openAccountModal}
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  ✓
                </div>
                {account?.displayName}
                {account?.displayBalance && (
                  <span className="text-muted-foreground text-sm">({account.displayBalance})</span>
                )}
              </button>
            </div>
          );
        }}
      </ConnectButton.Custom>

      <p className="mt-3 text-xs text-muted-foreground text-center">💡 Tap a wallet to connect • Base Sepolia testnet</p>

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
