import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useSwitchChain, useDisconnect } from 'wagmi';
import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Wallet, CheckCircle2, LogOut } from 'lucide-react';
import { CHAIN_ID } from '@/lib/wagmi';
import { Button } from '@/components/ui/button';

interface ConnectWalletProps {
  walletAddress: string | null;
  onConnect: (address: string) => Promise<void>;
  onDisconnect?: () => Promise<void>;
  isDemo?: boolean;
}

export function ConnectWallet({ walletAddress, onConnect, onDisconnect, isDemo = false }: ConnectWalletProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const hasHandledConnection = useRef(false);
  const prevConnectedRef = useRef(false);

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

  // Detect when wallet just connected (transition from disconnected to connected)
  useEffect(() => {
    const justConnected = isConnected && !prevConnectedRef.current;
    prevConnectedRef.current = isConnected;

    if (justConnected && address) {
      console.log('[ConnectWallet] Wallet just connected:', address);
      
      // Force close any RainbowKit modals
      setTimeout(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }, 200);
    }
  }, [isConnected, address]);

  // Sync wallet address to profile when connected
  useEffect(() => {
    if (isConnected && address && address !== walletAddress && !hasHandledConnection.current) {
      hasHandledConnection.current = true;
      console.log('[ConnectWallet] Syncing wallet to profile:', address);
      
      ensureCorrectNetwork();
      
      onConnect(address).then(() => {
        toast.success('🎉 Congratulations! Your wallet is now connected!', { duration: 5000 });
      }).catch((err) => {
        console.error('[ConnectWallet] Failed to save wallet:', err);
        toast.error('Failed to save wallet address');
      });
    }
    
    // Reset when disconnected
    if (!isConnected) {
      hasHandledConnection.current = false;
    }
  }, [isConnected, address, walletAddress, onConnect, ensureCorrectNetwork]);

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    try {
      // Disconnect from wagmi/RainbowKit
      disconnect();
      
      // Clear wallet address from profile
      if (onDisconnect) {
        await onDisconnect();
      }
      
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect wallet');
    }
  }, [disconnect, onDisconnect]);

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

  // Show connected success state
  if (isConnected && address && walletAddress) {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Wallet Connected!</p>
            <p className="text-xs text-muted-foreground font-mono">{shortAddress}</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <ConnectButton.Custom>
            {({ chain, openChainModal, openAccountModal, mounted }) => {
              if (!mounted) return null;
              
              return (
                <>
                  {chain && (
                    <button
                      onClick={openChainModal}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary/50 rounded-lg text-sm hover:bg-secondary/70 transition-colors"
                    >
                      {chain.hasIcon && chain.iconUrl && (
                        <img
                          alt={chain.name ?? 'Chain icon'}
                          src={chain.iconUrl}
                          className="h-4 w-4 rounded-full"
                        />
                      )}
                      {chain.name ?? 'Unknown Network'}
                    </button>
                  )}
                  <button
                    onClick={openAccountModal}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary/30 rounded-lg text-sm hover:bg-secondary/50 transition-colors"
                  >
                    View Account Details
                  </button>
                </>
              );
            }}
          </ConnectButton.Custom>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            className="w-full flex items-center justify-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Disconnect Wallet
          </Button>
        </div>

        <p className="mt-3 text-xs text-green-600 dark:text-green-400 text-center">
          🎉 You're earning $ZSOLAR rewards!
        </p>
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
          <p className="text-xs text-muted-foreground">
            Link your wallet to earn $ZSOLAR rewards
          </p>
        </div>
      </div>
      
      {/* RainbowKit's ConnectButton handles everything */}
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          const ready = mounted;
          const connected = ready && account && chain;

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors active:scale-[0.98]"
                    >
                      <Wallet className="h-4 w-4" />
                      Connect Wallet
                    </button>
                  );
                }

                if (chain.unsupported) {
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
                      {chain.hasIcon && chain.iconUrl && (
                        <img
                          alt={chain.name ?? 'Chain icon'}
                          src={chain.iconUrl}
                          className="h-4 w-4 rounded-full"
                        />
                      )}
                      {chain.name}
                    </button>
                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                        ✓
                      </div>
                      {account.displayName}
                      {account.displayBalance && (
                        <span className="text-muted-foreground text-sm">
                          ({account.displayBalance})
                        </span>
                      )}
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>

      {/* Wallet recommendation */}
      {!isConnected && (
        <p className="mt-3 text-xs text-muted-foreground text-center">
          💡 Tap a wallet to connect • Base Sepolia testnet
        </p>
      )}
      
      {/* Manual add link if having trouble */}
      {isConnected && chainId !== CHAIN_ID && (
        <a
          href="https://chainlist.org/chain/84532"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block text-xs text-primary hover:underline text-center"
        >
          Having trouble? Add Base Sepolia manually via ChainList →
        </a>
      )}
    </div>
  );
}
