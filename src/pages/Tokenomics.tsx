import { Coins, Zap, Award, TrendingUp, Lock, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Tokenomics() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-token to-primary mx-auto">
          <Coins className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">$ZSOLAR Tokenomics</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Understanding how ZenSolar rewards clean energy production and sustainable behavior through blockchain technology.
        </p>
      </div>

      {/* Token Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-token" />
            Token Overview
          </CardTitle>
          <CardDescription>The foundation of the ZenSolar ecosystem</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Token Symbol</p>
              <p className="text-2xl font-bold text-foreground">$ZSOLAR</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Network</p>
              <p className="text-2xl font-bold text-foreground">Ethereum (Sepolia Testnet)</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Currently deployed on Sepolia testnet for beta testing. Mainnet launch details coming soon.
          </p>
        </CardContent>
      </Card>

      {/* Earning Mechanisms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-secondary" />
            How to Earn
          </CardTitle>
          <CardDescription>Multiple ways to earn $ZSOLAR tokens</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex gap-4 items-start p-4 rounded-lg border border-border">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-solar/20">
                <Zap className="h-5 w-5 text-solar" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Solar Energy Production</h3>
                <p className="text-sm text-muted-foreground">
                  Earn tokens based on the kWh of solar energy your system produces. More clean energy = more rewards.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-4 rounded-lg border border-border">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-energy/20">
                <TrendingUp className="h-5 w-5 text-energy" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">EV Charging & Miles</h3>
                <p className="text-sm text-muted-foreground">
                  Get rewarded for driving electric. Track your EV miles and charging to earn additional tokens.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start p-4 rounded-lg border border-border">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/20">
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Social Engagement</h3>
                <p className="text-sm text-muted-foreground">
                  Share your clean energy journey on social media and earn bonus rewards for spreading awareness.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NFT Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            NFT Milestones
          </CardTitle>
          <CardDescription>Unlock unique NFTs by reaching activity milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              As you hit various clean energy milestones, you'll automatically receive NFTs that represent your achievements. 
              These NFTs are minted directly to your connected MetaMask wallet.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="text-center p-4 rounded-lg border border-border bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="text-3xl mb-2">🌱</div>
                <p className="font-medium text-foreground">Seedling</p>
                <p className="text-xs text-muted-foreground">First 100 kWh produced</p>
              </div>
              <div className="text-center p-4 rounded-lg border border-border bg-gradient-to-br from-secondary/5 to-secondary/10">
                <div className="text-3xl mb-2">🌿</div>
                <p className="font-medium text-foreground">Green Warrior</p>
                <p className="text-xs text-muted-foreground">1,000 kWh milestone</p>
              </div>
              <div className="text-center p-4 rounded-lg border border-border bg-gradient-to-br from-token/5 to-token/10">
                <div className="text-3xl mb-2">☀️</div>
                <p className="font-medium text-foreground">Solar Champion</p>
                <p className="text-xs text-muted-foreground">10,000 kWh legend</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">
              More milestones and NFT tiers coming soon based on community feedback.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Roadmap Note */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Beta Phase Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            ZenSolar is currently in beta on the Sepolia testnet. Token distribution rates, NFT milestones, 
            and other tokenomics parameters may be adjusted based on community feedback before mainnet launch.
            Your feedback helps shape the future of clean energy rewards!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
