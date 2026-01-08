import { Button } from '@/components/ui/button';
import { Wallet, Check, Loader2, LogOut } from 'lucide-react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface ConnectWalletProps {
  walletAddress: string | null;
  onConnect: (address: string) => Promise<void>;
  isDemo?: boolean;
}

export function ConnectWallet({ walletAddress, onConnect, isDemo = false }: ConnectWalletProps) {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

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

  const handleConnect = (connectorIndex: number) => {
    if (isDemo) {
      toast.info('Wallet connection is disabled in demo mode');
      return;
    }
    
    const connector = connectors[connectorIndex];
    if (connector) {
      connect({ connector }, {
        onError: (error) => {
          console.error('Wallet connection error:', error);
          if (error.message.includes('rejected')) {
            toast.error('Connection rejected. Please approve in your wallet.');
          } else {
            toast.error('Failed to connect wallet. Please try again.');
          }
        }
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.info('Wallet disconnected');
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isLoading = isConnecting || isPending;

  if (isConnected && address) {
    return (
      <div className="rounded-lg border border-secondary bg-secondary/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20">
              <Check className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Wallet Connected</p>
              <p className="text-xs text-muted-foreground font-mono">{formatAddress(address)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
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
          <p className="text-xs text-muted-foreground">Link your wallet to earn rewards</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {connectors.map((connector, index) => (
          <Button
            key={connector.uid}
            onClick={() => handleConnect(index)}
            disabled={isLoading}
            className="w-full"
            variant={index === 0 ? "default" : "outline"}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                {connector.name}
              </>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
