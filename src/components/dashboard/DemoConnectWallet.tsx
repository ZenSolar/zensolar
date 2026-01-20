import { useState } from 'react';
import { toast } from 'sonner';
import { Wallet, CheckCircle2, LogOut, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DemoConnectWalletProps {
  walletAddress: string | null;
  onConnect: (address: string) => Promise<void>;
  onDisconnect?: () => Promise<void>;
  onMintTokens?: () => void;
}

/**
 * Demo-only wallet component that doesn't use any Web3/AppKit hooks.
 * This allows demo mode to work without initializing Web3 providers.
 */
export function DemoConnectWallet({ 
  walletAddress, 
  onConnect, 
  onDisconnect, 
  onMintTokens 
}: DemoConnectWalletProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  
  const fakeWalletAddress = walletAddress || '0x7a3F...8E4d';
  const isConnectedDemo = Boolean(walletAddress);
  
  const handleConnect = async () => {
    setIsConnecting(true);
    // Generate a fake wallet address
    const fakeAddr = '0x7a3F' + Math.random().toString(16).slice(2, 6).toUpperCase() + '...8E4d';
    try {
      await onConnect(fakeAddr);
      toast.success('Demo: Wallet connected!');
    } finally {
      setIsConnecting(false);
    }
  };
  
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
          disabled={isConnecting}
          onClick={handleConnect}
        >
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet (Demo)
        </Button>
      )}
    </div>
  );
}
