import { useState } from 'react';
import { Copy, Check, ExternalLink, Wallet, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ZSOLAR_TOKEN_ADDRESS, ZSOLAR_TOKEN_SYMBOL, ZSOLAR_TOKEN_DECIMALS } from '@/lib/wagmi';
import { useToast } from '@/hooks/use-toast';
import { useWalletType, openWalletApp } from '@/hooks/useWalletType';

/**
 * Panel showing manual instructions for adding $ZSOLAR token to wallet
 * when automatic wallet_watchAsset fails (common on Base Wallet/WalletConnect).
 * Also provides a wallet-aware "Open Wallet" button to check tokens.
 */
export function ManualTokenAddPanel() {
  const { toast } = useToast();
  const [copied, setCopied] = useState<'address' | 'symbol' | 'decimals' | null>(null);
  const walletInfo = useWalletType();

  const copyToClipboard = async (text: string, field: 'address' | 'symbol' | 'decimals') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      toast({
        title: 'Copied!',
        description: `${field === 'address' ? 'Contract address' : field === 'symbol' ? 'Symbol' : 'Decimals'} copied to clipboard`,
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: 'Please manually select and copy the text',
        variant: 'destructive',
      });
    }
  };

  const handleOpenWallet = async () => {
    // Auto-copy contract address before opening wallet for convenience
    try {
      await navigator.clipboard.writeText(ZSOLAR_TOKEN_ADDRESS);
      toast({
        title: 'Contract address copied!',
        description: `Opening ${walletInfo.name}... Paste the address to import $ZSOLAR`,
      });
    } catch {
      // Clipboard failed, still open wallet
    }

    // Small delay to let toast show before switching apps
    setTimeout(() => {
      const opened = openWalletApp(walletInfo.type);
      if (!opened) {
        toast({
          title: 'Open your wallet app',
          description: `Open ${walletInfo.name} manually to view your tokens`,
        });
      }
    }, 300);
  };

  // Check if we're on Base Sepolia network reminder
  const networkNote = walletInfo.type === 'coinbase' || walletInfo.type === 'metamask' 
    ? 'Make sure you\'re on Base Sepolia network in your wallet settings.'
    : null;

  return (
    <div className="p-4 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Wallet className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground">Add $ZSOLAR to Your Wallet</span>
      </div>
      
      {/* Open Wallet Button - copies address and opens wallet */}
      {walletInfo.deepLinkBase && (
        <div className="space-y-2">
          <Button
            onClick={handleOpenWallet}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-primary via-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all duration-200"
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Copy Address & Open {walletInfo.name}
          </Button>
          {networkNote && (
            <p className="text-[10px] text-center text-amber-600 dark:text-amber-400">
              ⚠️ {networkNote}
            </p>
          )}
        </div>
      )}
      
      <p className="text-xs text-muted-foreground leading-relaxed">
        {walletInfo.type === 'coinbase' ? (
          <>In <strong className="text-foreground">Base Wallet</strong>, tokens often appear automatically. If not, go to <strong className="text-foreground">Tokens</strong> → <strong className="text-foreground">Manage</strong> → paste the contract address.</>
        ) : walletInfo.type === 'metamask' ? (
          <>In <strong className="text-foreground">MetaMask</strong>, go to <strong className="text-foreground">Tokens</strong> → <strong className="text-foreground">Import Token</strong> → paste these:</>
        ) : (
          <>In your wallet, go to <strong className="text-foreground">Tokens</strong> → <strong className="text-foreground">Import Token</strong> → paste these:</>
        )}
      </p>

      <div className="space-y-2">
        {/* Contract Address */}
        <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-background/80 border border-border/60 shadow-sm">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">Contract Address</div>
            <div className="text-[11px] font-mono break-all leading-snug text-foreground/90 mt-0.5">{ZSOLAR_TOKEN_ADDRESS}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 shrink-0 rounded-lg border-primary/30 hover:bg-primary/10 hover:border-primary/50"
            onClick={() => copyToClipboard(ZSOLAR_TOKEN_ADDRESS, 'address')}
          >
            {copied === 'address' ? (
              <Check className="h-4 w-4 text-secondary" />
            ) : (
              <Copy className="h-4 w-4 text-primary" />
            )}
          </Button>
        </div>

        {/* Symbol */}
        <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-background/80 border border-border/60 shadow-sm">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">Symbol</div>
            <div className="text-xs font-mono text-foreground/90 mt-0.5">{ZSOLAR_TOKEN_SYMBOL}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 shrink-0 rounded-lg border-primary/30 hover:bg-primary/10 hover:border-primary/50"
            onClick={() => copyToClipboard(ZSOLAR_TOKEN_SYMBOL, 'symbol')}
          >
            {copied === 'symbol' ? (
              <Check className="h-4 w-4 text-secondary" />
            ) : (
              <Copy className="h-4 w-4 text-primary" />
            )}
          </Button>
        </div>

        {/* Decimals */}
        <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-background/80 border border-border/60 shadow-sm">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">Decimals</div>
            <div className="text-xs font-mono text-foreground/90 mt-0.5">{ZSOLAR_TOKEN_DECIMALS}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 shrink-0 rounded-lg border-primary/30 hover:bg-primary/10 hover:border-primary/50"
            onClick={() => copyToClipboard(String(ZSOLAR_TOKEN_DECIMALS), 'decimals')}
          >
            {copied === 'decimals' ? (
              <Check className="h-4 w-4 text-secondary" />
            ) : (
              <Copy className="h-4 w-4 text-primary" />
            )}
          </Button>
        </div>
      </div>

      <a
        href={`https://sepolia.basescan.org/token/${ZSOLAR_TOKEN_ADDRESS}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
      >
        View on BaseScan
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
