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
            We're building an economic flywheel where your real energy data powers token minting. 
            The complete tokenomics—including staking, halving schedule, and governance—will be revealed soon.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">⚡ kWh-Based Minting</span>
            <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">🎯 Staking Rewards</span>
            <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">📉 Halving Schedule</span>
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
          Turn your solar production and EV miles into real crypto rewards. $ZSOLAR is minted based on verified kWh data from your connected devices.
        </p>
      </div>

      {/* Token Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-token" />
            Token Overview
          </CardTitle>
          <CardDescription>The currency that powers the clean energy economy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Token Symbol</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground">$ZSOLAR</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Network</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">Base Sepolia (L2)</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs mb-2">
            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">ERC-20 Token</span>
            <span className="px-2 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20">Gasless Minting</span>
          </div>
          <p className="text-muted-foreground text-sm">
            $ZSOLAR tokens are minted proportionally to your verified energy production. Built on Base L2 for fast, low-cost transactions. Currently on Base Sepolia testnet—Base mainnet launch coming soon.
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
          <CardDescription>Your energy data becomes crypto rewards</CardDescription>
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
                  Connect your inverter (Tesla, Enphase, SolarEdge) and mint tokens based on verified kWh output.
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
                  Link your Tesla or home charger to earn rewards for every electric mile driven.
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start p-3 sm:p-4 rounded-lg border border-border active:bg-muted/50 transition-ios">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/20">
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-foreground">Referrals & Community</h3>
                <p className="text-sm text-muted-foreground">
                  Invite friends and grow the ZenSolar community to unlock bonus token rewards.
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
          <CardDescription>Earn collectible NFTs as you hit energy milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
          <div className="flex flex-wrap gap-2 text-xs mb-3">
            <span className="px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">ERC-721 NFTs</span>
            <span className="px-2 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20">Free to Mint</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Hit real kWh milestones and automatically receive NFTs that prove your contribution to clean energy. We cover all gas fees—minting is completely free for you.
          </p>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              <div className="text-center p-4 rounded-lg border border-border bg-gradient-to-br from-primary/5 to-primary/10 active:scale-[0.98] transition-ios">
                <div className="text-3xl mb-2">🌱</div>
                <p className="font-medium text-foreground">Seedling</p>
                <p className="text-xs text-muted-foreground">100 kWh produced</p>
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
              Commercial tiers for businesses producing 100,000+ kWh coming soon.
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
            ZenSolar is in beta on the Base Sepolia testnet. We're refining the token-to-kWh ratio, staking mechanics, 
            and halving schedule based on real user data before Base mainnet launch. All minting is gasless—we cover transaction costs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
