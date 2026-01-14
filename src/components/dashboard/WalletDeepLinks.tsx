import { Button } from '@/components/ui/button';
import { ExternalLink, Smartphone } from 'lucide-react';

export type WalletDeepLinkWalletId = 'metamask' | 'coinbase' | 'trust' | 'rainbow';

interface WalletDeepLinksProps {
  onSelect: (wallet: WalletDeepLinkWalletId) => void;
  disabled?: boolean;
  wcUri?: string;
}

/**
 * Generate a wallet deep link.
 * - When wcUri is provided, we deep-link into the wallet's WalletConnect handler (recommended for iOS PWA)
 * - Otherwise we fall back to opening the dapp inside the wallet browser (less reliable for “return + connected”)
 */
export function getWalletConnectDeepLink(wallet: WalletDeepLinkWalletId, wcUri?: string): string | null {
  const dappUrl = typeof window !== 'undefined' ? window.location.href.replace(/^https?:\/\//, '') : '';

  if (wcUri) {
    const encodedUri = encodeURIComponent(wcUri);
    switch (wallet) {
      case 'metamask':
        return `metamask://wc?uri=${encodedUri}`;
      case 'coinbase':
        return `cbwallet://wc?uri=${encodedUri}`;
      case 'trust':
        return `trust://wc?uri=${encodedUri}`;
      case 'rainbow':
        return `rainbow://wc?uri=${encodedUri}`;
      default:
        return null;
    }
  }

  // Fallback: open the dapp inside the wallet browser
  switch (wallet) {
    case 'metamask':
      return `https://metamask.app.link/dapp/${dappUrl}`;
    case 'coinbase':
      return `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(`https://${dappUrl}`)}`;
    case 'trust':
      return `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(`https://${dappUrl}`)}`;
    case 'rainbow':
      return `https://rainbow.me/dapp?url=${encodeURIComponent(`https://${dappUrl}`)}`;
    default:
      return null;
  }
}

export function WalletDeepLinks({ onSelect, disabled, wcUri }: WalletDeepLinksProps) {
  const wallets: { id: WalletDeepLinkWalletId; name: string }[] = [
    { id: 'metamask', name: 'MetaMask' },
    { id: 'coinbase', name: 'Coinbase' },
    { id: 'trust', name: 'Trust' },
    { id: 'rainbow', name: 'Rainbow' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Smartphone className="h-3 w-3" />
        <span>Open in wallet app</span>
        {wcUri ? <span className="text-[10px]">(WalletConnect)</span> : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {wallets.map((w) => (
          <Button
            key={w.id}
            type="button"
            variant="secondary"
            size="sm"
            className="text-xs"
            disabled={disabled}
            onClick={() => onSelect(w.id)}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            {w.name}
          </Button>
        ))}
      </div>

      {!wcUri ? (
        <p className="text-[10px] text-muted-foreground">
          Tip: iOS PWA is most reliable when using WalletConnect (not “open in wallet browser”).
        </p>
      ) : null}
    </div>
  );
}

