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
 * - Otherwise we fall back to opening the dapp inside the wallet browser (less reliable for "return + connected")
 * 
 * IMPORTANT: Coinbase Wallet (now rebranded to "Base") is the ONLY Coinbase product that supports
 * WalletConnect/dApp connections. The main "Coinbase" exchange app does NOT support Web3 dApp connections.
 * App Store: "Base: Formerly Coinbase Wallet" (id: com.coinbase.wallet)
 */
export function getWalletConnectDeepLink(wallet: WalletDeepLinkWalletId, wcUri?: string): string | null {
  const dappUrl = typeof window !== 'undefined' ? window.location.href.replace(/^https?:\/\//, '') : '';

  if (wcUri) {
    const encodedUri = encodeURIComponent(wcUri);
    switch (wallet) {
      case 'metamask':
        return `metamask://wc?uri=${encodedUri}`;
      case 'coinbase':
        // Note: cbwallet:// is for Coinbase Wallet (now "Base" app), NOT the Coinbase exchange app
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
      // Coinbase Wallet universal link - opens the "Base" (formerly Coinbase Wallet) app
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
  // Note: "Coinbase Wallet" was rebranded to "Base" in the App Store
  // The main Coinbase exchange app does NOT support dApp connections
  const wallets: { id: WalletDeepLinkWalletId; name: string; note?: string }[] = [
    { id: 'metamask', name: 'MetaMask' },
    { id: 'coinbase', name: 'Base Wallet', note: 'formerly Coinbase Wallet' },
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
            className="text-xs flex-col h-auto py-2"
            disabled={disabled}
            onClick={() => onSelect(w.id)}
          >
            <span className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              {w.name}
            </span>
            {w.note && (
              <span className="text-[9px] text-muted-foreground font-normal">{w.note}</span>
            )}
          </Button>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground">
        Note: The main Coinbase exchange app does not support dApp connections. 
        Use "Base" (formerly Coinbase Wallet) for Web3.
      </p>

      {!wcUri ? (
        <p className="text-[10px] text-muted-foreground">
          Tip: iOS PWA is most reliable when using WalletConnect (not "open in wallet browser").
        </p>
      ) : null}
    </div>
  );
}
