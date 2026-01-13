import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HowItWorks as HowItWorksSteps } from '@/components/dashboard/HowItWorks';
import { Coins, Image, Wallet, Shield, Sparkles, TrendingUp } from 'lucide-react';

export default function HowItWorks() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">How ZenSolar Works</h1>
        <p className="text-muted-foreground">
          Turn your clean energy production into blockchain rewards
        </p>
      </div>

      {/* Quick Steps Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <HowItWorksSteps showCard={false} />
        </CardContent>
      </Card>

      {/* What are $ZSOLAR Tokens */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">What are $ZSOLAR Tokens?</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">$ZSOLAR tokens</strong> are digital currency you earn by generating clean solar energy and charging your EV. Think of them like loyalty points, but stored securely on the blockchain.
          </p>
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Secure & Transparent</p>
                <p className="text-xs">Every token is recorded on the blockchain, making your rewards tamper-proof and verifiable.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Real Value</p>
                <p className="text-xs">Use tokens for discounts, exclusive perks, and community benefits as the ZenSolar ecosystem grows.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Wallet className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Your Wallet, Your Tokens</p>
                <p className="text-xs">Tokens are minted directly to your connected crypto wallet—you own them completely.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What are NFTs */}
      <Card className="border-accent/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg">What are NFTs?</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">NFTs (Non-Fungible Tokens)</strong> are unique digital assets that prove you own something special. In ZenSolar, NFTs represent your clean energy achievements and milestones.
          </p>
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Digital Collectibles</p>
                <p className="text-xs">Each NFT is one-of-a-kind, like a digital badge or trophy celebrating your green energy contributions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Proof of Achievement</p>
                <p className="text-xs">NFTs permanently record your milestones—no one can take away or duplicate your achievements.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Potential Value</p>
                <p className="text-xs">As the ZenSolar community grows, early adopter NFTs may become valuable collectibles.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NFT Milestones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">NFT Milestones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white text-sm font-bold">🎉</div>
            <div>
              <p className="font-medium text-foreground">Welcome NFT</p>
              <p className="text-xs text-muted-foreground">Earned when you sign up for ZenSolar</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">🌱</div>
            <div>
              <p className="font-medium text-foreground">First Harvest</p>
              <p className="text-xs text-muted-foreground">Generate 500 kWh of clean energy</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">🚀</div>
            <div>
              <p className="font-medium text-foreground">Solar Pioneer</p>
              <p className="text-xs text-muted-foreground">Generate 2,500 kWh of clean energy</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">🏆</div>
            <div>
              <p className="font-medium text-foreground">Green Champion</p>
              <p className="text-xs text-muted-foreground">Generate 10,000 kWh of clean energy</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white text-sm font-bold">⚡</div>
            <div>
              <p className="font-medium text-foreground">Energy Legend</p>
              <p className="text-xs text-muted-foreground">Generate 50,000 kWh of clean energy</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center pt-2">
            More milestones will be added as the platform grows!
          </p>
        </CardContent>
      </Card>

      {/* Crypto Wallet Explanation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Why Connect a Wallet?</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            A crypto wallet is like a digital bank account for your tokens and NFTs. It's where your ZenSolar rewards are stored securely.
          </p>
          <p>
            <strong className="text-foreground">Don't have a wallet yet?</strong> No problem! Popular options include MetaMask, Rainbow, or Coinbase Wallet. They're free to set up and take just a few minutes.
          </p>
          <p className="text-xs">
            Your wallet gives you full ownership of your rewards—ZenSolar never holds your tokens for you.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
