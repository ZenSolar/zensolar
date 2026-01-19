import { useState } from 'react';
import { Copy, Check, ExternalLink, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ZSOLAR_TOKEN_ADDRESS, ZSOLAR_TOKEN_SYMBOL, ZSOLAR_TOKEN_DECIMALS } from '@/lib/wagmi';
import { useToast } from '@/hooks/use-toast';

/**
 * Panel showing manual instructions for adding $ZSOLAR token to wallet
 * when automatic wallet_watchAsset fails (common on Base Wallet/WalletConnect).
 */
export function ManualTokenAddPanel() {
  const { toast } = useToast();
  const [copied, setCopied] = useState<'address' | 'symbol' | 'decimals' | null>(null);

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

  return (
    <div className="p-4 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Wallet className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold text-foreground">Add $ZSOLAR to Your Wallet</span>
      </div>
      
      <p className="text-xs text-muted-foreground leading-relaxed">
        In your wallet, go to <strong className="text-foreground">Tokens</strong> → <strong className="text-foreground">Import Token</strong> → paste these:
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
