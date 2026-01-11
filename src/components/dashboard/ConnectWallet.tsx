import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Wallet } from 'lucide-react';

interface ConnectWalletProps {
  walletAddress: string | null;
  onConnect: (address: string) => Promise<void>;
  isDemo?: boolean;
}

export function ConnectWallet({ walletAddress, onConnect, isDemo = false }: ConnectWalletProps) {
  const { address, isConnected } = useAccount();

  // Sync wallet address to profile when connected
  useEffect(() => {
    if (isConnected && address && address !== walletAddress) {
      onConnect(address).then(() => {
        toast.success('Wallet connected successfully!');
      }).catch(() => {
        toast.error('Failed to save wallet address');
      });
    }
  }, [isConnected, address, walletAddress, onConnect]);

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
          💡 <strong>Recommended:</strong> MetaMask for best testnet support
        </p>
      )}
    </div>
  );
}
