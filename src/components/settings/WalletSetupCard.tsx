import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  Fingerprint, 
  Smartphone, 
  Shield, 
  Zap, 
  ExternalLink,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import { trackWalletSetupResumed } from '@/lib/onboardingAnalytics';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

export function WalletSetupCard() {
  const navigate = useNavigate();
  const { profile, isLoading } = useProfile();
  const [isNavigating, setIsNavigating] = useState(false);

  const hasWallet = !!profile?.wallet_address;
  const shortAddress = hasWallet 
    ? `${profile.wallet_address!.slice(0, 6)}...${profile.wallet_address!.slice(-4)}`
    : null;

  const handleSetupZenSolar = () => {
    setIsNavigating(true);
    trackWalletSetupResumed('settings');
    navigate('/onboarding?choice=zensolar');
  };

  const handleSetupExternal = () => {
    setIsNavigating(true);
    trackWalletSetupResumed('settings');
    navigate('/onboarding?choice=external');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
      </Card>
    );
  }

  // Connected state
  if (hasWallet) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Rewards Wallet</CardTitle>
                <CardDescription>Your connected wallet for rewards</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="gap-1.5 text-primary border-primary/30">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <div className="absolute inset-0 h-3 w-3 rounded-full bg-primary animate-ping opacity-50" />
              </div>
              <div>
                <p className="font-mono text-sm font-semibold">{shortAddress}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-[6px] text-white font-bold">B</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Base Network</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not connected state - show setup options
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-500/5 to-transparent border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Wallet className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Rewards Wallet</CardTitle>
              <CardDescription>Set up your wallet to receive rewards</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5 text-orange-500 border-orange-500/30">
            Not Connected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* ZenSolar Wallet Option */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSetupZenSolar}
          disabled={isNavigating}
          className="w-full p-4 rounded-xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent hover:border-primary/40 transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                <img src={zenLogo} alt="" className="w-6 h-6 object-contain brightness-0 invert" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">Create ZenSolar Wallet</p>
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                    <Zap className="w-3 h-3 mr-1" />
                    Recommended
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Fingerprint className="w-3 h-3" /> Passkey
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> No apps
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Self-custody
                  </span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </motion.button>

        {/* External Wallet Option */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSetupExternal}
          disabled={isNavigating}
          className="w-full p-4 rounded-xl border border-border/50 bg-muted/30 hover:border-border hover:bg-muted/50 transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Connect Existing Wallet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  MetaMask, Base Wallet, WalletConnect
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </motion.button>
      </CardContent>
    </Card>
  );
}
