import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEO } from "@/components/SEO";
import { 
  Wallet, 
  Mail, 
  Smartphone, 
  Check, 
  ArrowRight, 
  Sun, 
  Coins, 
  Image,
  Banknote,
  Sparkles,
  Shield,
  Zap,
  ChevronRight,
  ExternalLink,
  Copy,
  CheckCircle2,
  Loader2,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

type DemoStep = 'welcome' | 'signup' | 'creating-wallet' | 'wallet-created' | 'connect-solar' | 'earning' | 'claim-nft' | 'cash-out';

export default function EmbeddedWalletDemo() {
  const [currentStep, setCurrentStep] = useState<DemoStep>('welcome');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress] = useState('0x7a3B...4f2E');
  const [tokenBalance, setTokenBalance] = useState(0);
  const [nftsClaimed, setNftsClaimed] = useState(0);

  const simulateStep = async (nextStep: DemoStep, delay: number = 1500) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, delay));
    setIsLoading(false);
    setCurrentStep(nextStep);
  };

  const handleSignup = async () => {
    if (!email) return;
    await simulateStep('creating-wallet', 2000);
    await simulateStep('wallet-created', 1500);
  };

  const handleConnectSolar = async () => {
    await simulateStep('earning', 2000);
    setTokenBalance(1250);
  };

  const handleClaimNFT = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setNftsClaimed(prev => prev + 1);
    setIsLoading(false);
  };

  const resetDemo = () => {
    setCurrentStep('welcome');
    setEmail('');
    setTokenBalance(0);
    setNftsClaimed(0);
  };

  return (
    <>
      <SEO title="Embedded Wallet Demo | ZenSolar" />
      
      <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Badge variant="outline" className="mb-2">
            <Sparkles className="h-3 w-3 mr-1" />
            Interactive Prototype
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold">
            Coinbase Smart Wallet Experience
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See how a user would experience ZenSolar with an embedded wallet. 
            No MetaMask, no seed phrases, no gas fees.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-xs">
            {['Signup', 'Wallet', 'Connect', 'Earn', 'NFTs', 'Cash Out'].map((step, i) => {
              // Map demo steps to progress step index (0-5)
              const stepToProgress: Record<DemoStep, number> = {
                'welcome': 0,
                'signup': 0,
                'creating-wallet': 1,
                'wallet-created': 1,
                'connect-solar': 2,
                'earning': 3,
                'claim-nft': 4,
                'cash-out': 5
              };
              const currentProgressStep = stepToProgress[currentStep];
              const isCompleted = i <= currentProgressStep;
              
              return (
                <div key={step} className="flex items-center gap-2">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all",
                    isCompleted
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-muted-foreground/30 text-muted-foreground"
                  )}>
                    {i + 1}
                  </div>
                  {i < 5 && <div className="w-4 h-0.5 bg-muted-foreground/30" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Demo Container */}
        <Card className="border-2 border-primary/20 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-transparent p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <span className="text-xs text-muted-foreground">zensolar.app</span>
            <Button variant="ghost" size="sm" onClick={resetDemo} className="text-xs h-6">
              Reset Demo
            </Button>
          </div>

          <CardContent className="p-6 min-h-[500px] flex flex-col">
            {/* Step: Welcome */}
            {currentStep === 'welcome' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sun className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Welcome to ZenSolar ☀️</h2>
                  <p className="text-muted-foreground max-w-md">
                    Earn crypto rewards for your solar energy production. 
                    No wallet setup required — we handle everything.
                  </p>
                </div>
                <Button size="lg" onClick={() => setCurrentStep('signup')} className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>No Gas Fees</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wallet className="h-3 w-3" />
                    <span>No MetaMask</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Signup */}
            {currentStep === 'signup' && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 max-w-sm mx-auto w-full">
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold">Create Your Account</h2>
                  <p className="text-sm text-muted-foreground">
                    Sign up with your email or social account
                  </p>
                </div>

                <div className="w-full space-y-3">
                  <div className="space-y-2">
                    <Input 
                      type="email" 
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  
                  <Button 
                    className="w-full h-12 gap-2" 
                    onClick={handleSignup}
                    disabled={!email || isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    Continue with Email
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-12 gap-2" onClick={() => {
                      setEmail('user@gmail.com');
                      handleSignup();
                    }}>
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </Button>
                    <Button variant="outline" className="h-12 gap-2" onClick={() => {
                      setEmail('user@icloud.com');
                      handleSignup();
                    }}>
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Apple
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  By continuing, you agree to our Terms and Privacy Policy
                </p>
              </div>
            )}

            {/* Step: Creating Wallet */}
            {currentStep === 'creating-wallet' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <Wallet className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">Creating Your Wallet...</h2>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Setting up your secure crypto wallet. This happens automatically — 
                    no action required from you.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating secure keys with passkey...</span>
                </div>
              </div>
            )}

            {/* Step: Wallet Created */}
            {currentStep === 'wallet-created' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">Wallet Created! 🎉</h2>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Your secure wallet is ready. It's protected by your device's biometrics — 
                    no passwords or seed phrases to remember.
                  </p>
                </div>

                <Card className="p-4 bg-muted/50 max-w-xs w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium">{email}</div>
                        <div className="text-xs text-muted-foreground font-mono">{walletAddress}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 justify-center">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Secured with Face ID / Touch ID</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>No seed phrases to backup</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>You own your wallet (non-custodial)</span>
                  </div>
                </div>

                <Button size="lg" onClick={() => setCurrentStep('connect-solar')} className="gap-2">
                  Connect Your Solar System <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step: Connect Solar */}
            {currentStep === 'connect-solar' && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 max-w-sm mx-auto w-full">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sun className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold">Connect Your Solar System</h2>
                  <p className="text-sm text-muted-foreground">
                    Link your solar provider to start earning $ZSOLAR tokens
                  </p>
                </div>

                <div className="w-full space-y-2">
                  {[
                    { name: 'Tesla', icon: '⚡', connected: false },
                    { name: 'Enphase', icon: '☀️', connected: false },
                    { name: 'SolarEdge', icon: '🔆', connected: false },
                  ].map((provider) => (
                    <Button
                      key={provider.name}
                      variant="outline"
                      className="w-full h-14 justify-between"
                      onClick={handleConnectSolar}
                      disabled={isLoading}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{provider.icon}</span>
                        <span>{provider.name}</span>
                      </div>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Step: Earning */}
            {currentStep === 'earning' && (
              <div className="flex-1 flex flex-col space-y-6">
                <div className="text-center space-y-2">
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                    <Zap className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                  <h2 className="text-xl font-bold">You're Earning! 🎉</h2>
                  <p className="text-sm text-muted-foreground">
                    Your solar production is now generating $ZSOLAR tokens
                  </p>
                </div>

                {/* Token Balance */}
                <Card className="p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Available to Claim</div>
                      <div className="text-3xl font-bold">{tokenBalance.toLocaleString()} $ZSOLAR</div>
                      <div className="text-sm text-green-500">+12.5 tokens/hour</div>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <Coins className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                </Card>

                {/* NFT Progress */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-primary" />
                      <span className="font-medium">Next NFT Milestone</span>
                    </div>
                    <Badge variant="outline">{nftsClaimed} claimed</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>SunSpark NFT</span>
                      <span>100 kWh</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '75%' }} />
                    </div>
                    <div className="text-xs text-muted-foreground">75 / 100 kWh produced</div>
                  </div>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={() => setCurrentStep('claim-nft')} 
                    className="h-12 gap-2"
                  >
                    <Image className="h-4 w-4" />
                    View NFTs
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep('cash-out')}
                    className="h-12 gap-2"
                  >
                    <Banknote className="h-4 w-4" />
                    Cash Out
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Claim NFT */}
            {currentStep === 'claim-nft' && (
              <div className="flex-1 flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Your NFT Collection</h2>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep('earning')}>
                    Back
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'SunSpark', tier: 1, unlocked: true, claimed: nftsClaimed >= 1 },
                    { name: 'Photonic', tier: 2, unlocked: nftsClaimed >= 1, claimed: nftsClaimed >= 2 },
                    { name: 'RayForge', tier: 3, unlocked: false, claimed: false },
                    { name: 'Solaris', tier: 4, unlocked: false, claimed: false },
                  ].map((nft) => (
                    <Card 
                      key={nft.name} 
                      className={cn(
                        "p-4 text-center",
                        !nft.unlocked && "opacity-50"
                      )}
                    >
                      <div className={cn(
                        "h-24 rounded-lg mb-3 flex items-center justify-center",
                        nft.claimed ? "bg-green-500/10" : "bg-muted"
                      )}>
                        {nft.claimed ? (
                          <CheckCircle2 className="h-8 w-8 text-green-500" />
                        ) : (
                          <Image className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="font-medium text-sm">{nft.name}</div>
                      <div className="text-xs text-muted-foreground">Tier {nft.tier}</div>
                      {nft.unlocked && !nft.claimed && (
                        <Button 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={handleClaimNFT}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Claim"
                          )}
                        </Button>
                      )}
                      {nft.claimed && (
                        <Badge className="mt-2 bg-green-500/10 text-green-500">Claimed</Badge>
                      )}
                    </Card>
                  ))}
                </div>

                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
                  <div className="flex items-center gap-2 font-medium text-green-600 dark:text-green-400 mb-1">
                    <Sparkles className="h-4 w-4" />
                    No gas fees!
                  </div>
                  <p className="text-muted-foreground">
                    NFT claims are completely free. We sponsor all transaction costs.
                  </p>
                </div>
              </div>
            )}

            {/* Step: Cash Out */}
            {currentStep === 'cash-out' && (
              <div className="flex-1 flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Cash Out</h2>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep('earning')}>
                    Back
                  </Button>
                </div>

                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">Converting</div>
                      <div className="text-3xl font-bold">{tokenBalance.toLocaleString()} $ZSOLAR</div>
                    </div>
                    
                    <div className="flex justify-center">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">You'll receive</div>
                      <div className="text-3xl font-bold text-green-500">~${(tokenBalance * 0.0245).toFixed(2)} USD</div>
                    </div>

                    <div className="p-3 rounded-lg bg-muted text-sm text-center text-muted-foreground">
                      Deposited to your bank in 1-2 business days
                    </div>

                    <Button className="w-full h-12" disabled>
                      Cash Out (Coming Soon)
                    </Button>
                  </div>
                </Card>

                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-sm">
                  <div className="flex items-center gap-2 font-medium text-primary mb-2">
                    <Shield className="h-4 w-4" />
                    100% In-App Experience
                  </div>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Never leave ZenSolar to cash out</li>
                    <li>• Bank linking via secure embedded widget</li>
                    <li>• One-time KYC (like Venmo/Cash App)</li>
                    <li>• Automatic ZSOLAR → ETH → USD conversion</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How It Works (Technical)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="font-medium mb-1 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  Coinbase Smart Wallet
                </div>
                <p className="text-muted-foreground text-xs">
                  Account abstraction wallet using passkeys. No seed phrases, secured by device biometrics.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="font-medium mb-1 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Gasless Transactions
                </div>
                <p className="text-muted-foreground text-xs">
                  ZenSolar sponsors all gas fees via Coinbase Paymaster. Users never pay transaction costs.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="font-medium mb-1 flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-primary" />
                  Embedded Off-Ramp
                </div>
                <p className="text-muted-foreground text-xs">
                  MoonPay/Transak widget embedded in-app. No external sites, no wallet exports needed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-3">
          <Button variant="outline" asChild>
            <a href="/admin/wallet-providers" className="gap-2">
              View Full Research <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </>
  );
}
