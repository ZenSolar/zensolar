import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ZSOLAR_TOKEN_ADDRESS, ZSOLAR_TOKEN_SYMBOL, ZSOLAR_TOKEN_DECIMALS } from '@/lib/wagmi';
import { useToast } from '@/hooks/use-toast';

/**
 * Panel showing manual instructions for adding $ZSOLAR token to MetaMask
 * when automatic wallet_watchAsset fails (common on mobile/WalletConnect).
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
    <div className="mt-4 p-4 rounded-lg border border-border bg-muted/30 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">Add $ZSOLAR to MetaMask</span>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Open MetaMask → Tokens → Import Token, then paste these details:
      </p>

      <div className="space-y-2">
        {/* Contract Address */}
        <div className="flex items-center justify-between gap-2 p-2 rounded bg-background border border-border">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase text-muted-foreground font-medium">Contract Address</div>
            <div className="text-xs font-mono truncate">{ZSOLAR_TOKEN_ADDRESS}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={() => copyToClipboard(ZSOLAR_TOKEN_ADDRESS, 'address')}
          >
            {copied === 'address' ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Symbol */}
        <div className="flex items-center justify-between gap-2 p-2 rounded bg-background border border-border">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase text-muted-foreground font-medium">Symbol</div>
            <div className="text-xs font-mono">{ZSOLAR_TOKEN_SYMBOL}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={() => copyToClipboard(ZSOLAR_TOKEN_SYMBOL, 'symbol')}
          >
            {copied === 'symbol' ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Decimals */}
        <div className="flex items-center justify-between gap-2 p-2 rounded bg-background border border-border">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase text-muted-foreground font-medium">Decimals</div>
            <div className="text-xs font-mono">{ZSOLAR_TOKEN_DECIMALS}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={() => copyToClipboard(String(ZSOLAR_TOKEN_DECIMALS), 'decimals')}
          >
            {copied === 'decimals' ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <a
        href={`https://sepolia.basescan.org/token/${ZSOLAR_TOKEN_ADDRESS}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        View on BaseScan
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
