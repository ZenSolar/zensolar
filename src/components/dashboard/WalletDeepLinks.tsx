import { Button } from '@/components/ui/button';
import { ExternalLink, Smartphone } from 'lucide-react';

interface WalletDeepLinksProps {
  onDeepLinkTap: (wallet: string) => void;
  wcUri?: string;
}

/**
 * Generate WalletConnect deep link URI for a specific wallet
 */
function getWalletConnectDeepLink(wallet: string, wcUri?: string): string | null {
  // Get the current page URL without protocol for return navigation
  const dappUrl = typeof window !== 'undefined' 
    ? window.location.href.replace(/^https?:\/\//, '')
    : '';
  
  // If we have a WalletConnect URI, use it for proper session persistence
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
  
  // Fallback: Use dapp deep links (less reliable for PWA)
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

export function WalletDeepLinks({ onDeepLinkTap, wcUri }: WalletDeepLinksProps) {
  const handleTap = (wallet: string) => {
    onDeepLinkTap(wallet);
    
    const deepLink = getWalletConnectDeepLink(wallet, wcUri);
    if (deepLink) {
      // Small delay to ensure event is recorded
      setTimeout(() => {
        window.location.href = deepLink;
      }, 100);
    }
  };

  const wallets = [
    { id: 'metamask', name: 'MetaMask', color: 'bg-orange-500 hover:bg-orange-600' },
    { id: 'coinbase', name: 'Coinbase', color: 'bg-blue-600 hover:bg-blue-700' },
    { id: 'trust', name: 'Trust', color: 'bg-blue-400 hover:bg-blue-500' },
    { id: 'rainbow', name: 'Rainbow', color: 'bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 hover:opacity-90' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Smartphone className="h-3 w-3" />
        <span>Open in wallet app:</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {wallets.map(wallet => (
          <Button
            key={wallet.id}
            variant="outline"
            size="sm"
            className={`${wallet.color} text-white border-0 text-xs`}
            onClick={() => handleTap(wallet.id)}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            {wallet.name}
          </Button>
        ))}
      </div>
      
      {wcUri && (
        <p className="text-[10px] text-muted-foreground text-center">
          Using WalletConnect for persistent connection
        </p>
      )}
    </div>
  );
}

export { getWalletConnectDeepLink };
