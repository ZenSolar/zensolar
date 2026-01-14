import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Wallet } from 'lucide-react';
import { CHAIN_ID } from '@/lib/wagmi';

interface ConnectWalletProps {
  walletAddress: string | null;
  onConnect: (address: string) => Promise<void>;
  isDemo?: boolean;
}

export function ConnectWallet({ walletAddress, onConnect, isDemo = false }: ConnectWalletProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const hasHandledConnection = useRef(false);
  const prevConnectedRef = useRef(false);

  // Auto-switch to Base Sepolia when wallet connects on wrong network
  const ensureCorrectNetwork = useCallback(async () => {
    if (isConnected && chainId !== CHAIN_ID) {
      toast.info('Adding Base Sepolia network...', { duration: 3000 });
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
        toast.success('Wallet connected successfully!');
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

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Connect Wallet</p>
          <p className="text-xs text-muted-foreground">
            {isConnected ? 'Manage your wallet connection' : 'Link your wallet to earn rewards'}
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
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
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
          💡 Base Sepolia testnet (Beta) will be added automatically
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
