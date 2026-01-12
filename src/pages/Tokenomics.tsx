import { Coins, Zap, Award, TrendingUp, Lock, Users, Rocket, Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Tokenomics() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Coming Soon Announcement */}
      <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-token/5 to-secondary/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
              <Bell className="h-3 w-3 mr-1" />
              Beta Update
            </Badge>
          </div>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Rocket className="h-5 w-5 text-primary" />
            Full Tokenomics Plan Coming Soon!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            We're finalizing the complete $ZSOLAR tokenomics—including token supply, distribution schedule, 
            staking rewards, governance rights, and mainnet launch details. Stay tuned for the full reveal!
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">📊 Token Distribution</span>
            <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">🎯 Staking Rewards</span>
            <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">🗳️ Governance</span>
            <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">🚀 Mainnet Launch</span>
          </div>
        </CardContent>
      </Card>

      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-token to-primary mx-auto">
          <Coins className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">$ZSOLAR Tokenomics</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
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
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Token Symbol</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">$ZSOLAR</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Network</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">Ethereum (Sepolia)</p>
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
          <div className="grid gap-3">
            <div className="flex gap-3 items-start p-3 sm:p-4 rounded-lg border border-border active:bg-muted/50 transition-ios">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-solar/20">
                <Zap className="h-5 w-5 text-solar" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-foreground">Solar Energy Production</h3>
                <p className="text-sm text-muted-foreground">
                  Earn tokens based on the kWh of solar energy your system produces.
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start p-3 sm:p-4 rounded-lg border border-border active:bg-muted/50 transition-ios">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-energy/20">
                <TrendingUp className="h-5 w-5 text-energy" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-foreground">EV Charging & Miles</h3>
                <p className="text-sm text-muted-foreground">
                  Get rewarded for driving electric. Track your EV miles and charging.
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start p-3 sm:p-4 rounded-lg border border-border active:bg-muted/50 transition-ios">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/20">
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-foreground">Social Engagement</h3>
                <p className="text-sm text-muted-foreground">
                  Share your clean energy journey and earn bonus rewards.
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
            <p className="text-muted-foreground text-sm">
              As you hit various clean energy milestones, you'll automatically receive NFTs that represent your achievements.
            </p>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              <div className="text-center p-4 rounded-lg border border-border bg-gradient-to-br from-primary/5 to-primary/10 active:scale-[0.98] transition-ios">
                <div className="text-3xl mb-2">🌱</div>
                <p className="font-medium text-foreground">Seedling</p>
                <p className="text-xs text-muted-foreground">First 100 kWh produced</p>
              </div>
              <div className="text-center p-4 rounded-lg border border-border bg-gradient-to-br from-secondary/5 to-secondary/10 active:scale-[0.98] transition-ios">
                <div className="text-3xl mb-2">🌿</div>
                <p className="font-medium text-foreground">Green Warrior</p>
                <p className="text-xs text-muted-foreground">1,000 kWh milestone</p>
              </div>
              <div className="text-center p-4 rounded-lg border border-border bg-gradient-to-br from-token/5 to-token/10 active:scale-[0.98] transition-ios">
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
          <p className="text-muted-foreground text-sm">
            ZenSolar is currently in beta on the Sepolia testnet. Token distribution rates, NFT milestones, 
            and other tokenomics parameters may be adjusted based on community feedback before mainnet launch.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
