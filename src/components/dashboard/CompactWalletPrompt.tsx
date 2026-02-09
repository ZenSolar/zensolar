import { ArrowRight, Fingerprint, Wallet, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

// Import wallet logos
import baseWalletLogo from '@/assets/wallets/base-wallet.png';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

export function CompactWalletPrompt() {
  const navigate = useNavigate();

  const goToWalletSetup = (choice?: 'zensolar' | 'external') => {
    const params = new URLSearchParams({ step: 'wallet' });
    if (choice) params.set('choice', choice);
    navigate(`/onboarding?${params.toString()}`);
  };

  return (
    <Card className="border-token/30 bg-gradient-to-br from-token/5 via-card to-card overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-token/10">
              <Wallet className="h-5 w-5 text-token" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Connect Wallet</h2>
              <p className="text-sm text-muted-foreground">Link your wallet to receive blockchain rewards</p>
            </div>
          </div>
          <img src={zenLogo} alt="ZenSolar" className="h-5 w-auto opacity-60 dark:drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
        </div>
        
        <div className="space-y-3">
          {/* Recommended embedded option */}
          <Button
            size="lg"
            onClick={() => goToWalletSetup('zensolar')}
            className="w-full justify-between h-12"
          >
            <span className="inline-flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
                <Fingerprint className="h-4 w-4 text-primary" />
              </div>
              <span className="text-left">
                <span className="block text-sm font-semibold">Create ZenSolar Wallet</span>
                <span className="block text-xs opacity-80">Face ID / Touch ID • no apps</span>
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-1 text-[10px] font-semibold text-primary">
                <Zap className="h-3 w-3" />
                Recommended
              </span>
              <ArrowRight className="h-4 w-4" />
            </span>
          </Button>

          {/* External wallets */}
          <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-10 flex-1 min-w-[120px]"
            onClick={() => goToWalletSetup('external')}
          >
            <svg className="h-4 w-4" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32.9582 1L19.8241 10.7183L22.2665 4.99099L32.9582 1Z" fill="#E17726"/>
              <path d="M2.65991 1L15.6851 10.809L13.3515 4.99098L2.65991 1Z" fill="#E27625"/>
              <path d="M28.2295 23.5334L24.7346 28.872L32.2271 30.9323L34.3804 23.6501L28.2295 23.5334Z" fill="#E27625"/>
              <path d="M1.2373 23.6501L3.37338 30.9323L10.8659 28.872L7.38823 23.5334L1.2373 23.6501Z" fill="#E27625"/>
              <path d="M10.4706 14.5149L8.39185 17.6507L15.7927 17.9876L15.5765 9.96973L10.4706 14.5149Z" fill="#E27625"/>
              <path d="M25.1469 14.5149L19.9659 9.87891L19.8241 17.9876L27.2249 17.6507L25.1469 14.5149Z" fill="#E27625"/>
              <path d="M10.8659 28.872L15.4039 26.6794L11.4776 23.7012L10.8659 28.872Z" fill="#E27625"/>
              <path d="M20.2136 26.6794L24.7346 28.872L24.1399 23.7012L20.2136 26.6794Z" fill="#E27625"/>
            </svg>
            MetaMask
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-10 flex-1 min-w-[120px]"
            onClick={() => goToWalletSetup('external')}
          >
            <img src={baseWalletLogo} alt="Base Wallet" className="h-4 w-4 object-contain" />
            Base Wallet
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-10 flex-1 min-w-[120px]"
            onClick={() => goToWalletSetup('external')}
          >
            <svg className="h-4 w-4" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="16" fill="#0500FF"/>
              <path d="M23.4 10.4L16 4L8.6 10.4L16 12.8L23.4 10.4Z" fill="white"/>
              <path d="M8.6 10.4V17.6L16 24V16.8L8.6 10.4Z" fill="white" fillOpacity="0.7"/>
              <path d="M23.4 10.4V17.6L16 24V16.8L23.4 10.4Z" fill="white"/>
            </svg>
            Trust Wallet
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-10 flex-1 min-w-[120px]"
            onClick={() => goToWalletSetup('external')}
          >
            <svg className="h-4 w-4" viewBox="0 0 300 185" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M61.4385 36.2562C104.226 -5.41872 173.926 -5.41872 216.713 36.2562L221.931 41.3256C224.188 43.5243 224.188 47.0719 221.931 49.2706L203.793 66.8952C202.665 67.9946 200.832 67.9946 199.703 66.8952L192.44 59.8312C163.159 31.3137 115.993 31.3137 86.7121 59.8312L78.9009 67.4398C77.7726 68.5392 75.9389 68.5392 74.8106 67.4398L56.6727 49.8152C54.4154 47.6165 54.4154 44.0689 56.6727 41.8702L61.4385 36.2562ZM253.407 71.9974L269.5 87.5773C271.757 89.776 271.757 93.3236 269.5 95.5223L196.486 166.461C194.229 168.66 190.561 168.66 188.304 166.461L135.348 115.007C134.784 114.457 133.867 114.457 133.303 115.007L80.3473 166.461C78.0899 168.66 74.4225 168.66 72.1652 166.461L-0.848633 95.5223C-3.10598 93.3236 -3.10598 89.776 -0.848633 87.5773L15.2445 71.9974C17.5018 69.7987 21.1692 69.7987 23.4266 71.9974L76.3824 123.452C76.9469 124.001 77.8638 124.001 78.4283 123.452L131.384 71.9974C133.641 69.7987 137.309 69.7987 139.566 71.9974L192.522 123.452C193.087 124.001 194.004 124.001 194.568 123.452L247.524 71.9974C249.782 69.7987 253.149 69.7987 255.407 71.9974H253.407Z" fill="#3B99FC"/>
            </svg>
            WalletConnect
          </Button>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          You can also set this up later from here anytime.
        </p>
      </CardContent>
    </Card>
  );
}
