import { Coins, Zap, Award, TrendingUp, Lock, Users, Rocket, Bell, Sparkles, Battery, Car, Flame, Percent, DollarSign, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";
import { 
  MAX_SUPPLY, 
  PRICES, 
  MINT_DISTRIBUTION, 
  TRANSFER_TAX, 
  ALLOCATIONS 
} from "@/lib/tokenomics";

export default function Tokenomics() {
  return (
    <>
      <SEO 
        title="$ZSOLAR Tokenomics - Clean Energy Token Economics"
        description="Learn about $ZSOLAR tokenomics: 10B total supply, $0.10 launch floor, 20% mint burn rate, and 7% transfer tax. Turn your solar production and EV miles into real crypto rewards."
        url="https://zensolar.lovable.app/tokenomics"
        image="https://zensolar.lovable.app/og-tokenomics.png"
      />
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl">
          <Coins className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">$ZSOLAR Tokenomics</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">Turn your solar production and EV miles into real crypto rewards. Built for 10x growth from $0.10 to $1.00.</p>
      </motion.div>

      {/* Key Metrics Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Launch Price", value: "$0.10", icon: DollarSign, color: "text-emerald-500" },
          { label: "Target Price", value: "$1.00", icon: Target, color: "text-primary" },
          { label: "Mint Burn", value: "20%", icon: Flame, color: "text-orange-500" },
          { label: "Transfer Tax", value: "7%", icon: Percent, color: "text-blue-500" },
        ].map((stat, i) => (
          <Card key={stat.label} className="text-center p-4">
            <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </motion.div>

      {/* Token Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5 text-primary" />Token Overview</CardTitle>
            <CardDescription>10 billion max supply with aggressive deflationary mechanics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-transparent p-5">
                <p className="text-sm text-muted-foreground mb-1">Token Symbol</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">$ZSOLAR</p>
              </div>
              <div className="rounded-xl border bg-gradient-to-br from-accent/5 to-transparent p-5">
                <p className="text-sm text-muted-foreground mb-1">Max Supply</p>
                <p className="text-2xl font-bold">10 Billion</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20">ERC-20 on Base</Badge>
              <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">20% Mint Burn</Badge>
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">7% Transfer Tax</Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Deflationary Mechanics */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="shadow-lg border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Flame className="h-5 w-5 text-orange-500" />Deflationary Mechanics</CardTitle>
            <CardDescription>Aggressive burn rates create scarcity as the ecosystem grows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                <h4 className="font-semibold text-orange-600 mb-2">20% Mint Burn</h4>
                <p className="text-sm text-muted-foreground">Of every token minted: 75% to user, 20% burned forever, 3% LP, 2% treasury</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <h4 className="font-semibold text-blue-600 mb-2">7% Transfer Tax</h4>
                <p className="text-sm text-muted-foreground">Every transfer: 3% burned, 2% to LP, 2% to treasury—continuous deflation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* How to Earn */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-500" />How to Earn</CardTitle>
            <CardDescription>1 $ZSOLAR per kWh or mile—your energy data becomes crypto rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {[
                { icon: Zap, title: 'Solar Energy Production', desc: 'Connect your inverter (Tesla, Enphase, SolarEdge) and mint 1 $ZSOLAR per kWh.', gradient: 'from-amber-500 to-orange-600' },
                { icon: Car, title: 'EV Charging & Miles', desc: 'Link your Tesla or home charger to earn 1 $ZSOLAR per mile driven.', gradient: 'from-blue-500 to-indigo-600' },
                { icon: Battery, title: 'Battery Storage', desc: 'Discharge your Powerwall to the grid and earn 1 $ZSOLAR per kWh exported.', gradient: 'from-emerald-500 to-teal-600' },
                { icon: Users, title: 'Referrals & Community', desc: 'Invite friends and grow the ZenSolar community to unlock bonus rewards.', gradient: 'from-purple-500 to-pink-600' },
              ].map((item, index) => (
                <motion.div key={item.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + index * 0.1 }} className="flex gap-4 items-start p-4 rounded-xl border bg-card/50 hover:bg-muted/30 transition-colors">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg`}>
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Token Allocation */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-purple-500" />Token Allocation</CardTitle>
            <CardDescription>Community-first distribution with vested team allocations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { label: "Community Rewards", percent: 90, color: "bg-emerald-500", desc: "Dual-gated for $9.99/mo subscribers" },
                { label: "Treasury", percent: 7.5, color: "bg-blue-500", desc: "2-year vest for ecosystem growth" },
                { label: "Founder", percent: 2.5, color: "bg-purple-500", desc: "3-year vest, 6-month cliff" },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">{item.percent}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* NFT Milestones */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-amber-500" />NFT Milestones</CardTitle>
            <CardDescription>Earn 42 unique NFTs as you hit energy milestones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">ERC-1155 NFTs</Badge>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Gas-Free Minting</Badge>
            </div>
            <p className="text-muted-foreground text-sm">Hit real kWh milestones and automatically receive NFTs proving your contribution. We cover all gas fees.</p>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              {[
                { emoji: '☀️', name: 'Sunspark', req: '500 kWh solar', gradient: 'from-amber-500/10 to-amber-600/5' },
                { emoji: '⚡', name: 'Gigasun', req: '50,000 kWh solar', gradient: 'from-orange-500/10 to-orange-600/5' },
                { emoji: '🌟', name: 'Starforge', req: '100,000 kWh legend', gradient: 'from-yellow-500/10 to-yellow-600/5' },
              ].map((tier) => (
                <motion.div key={tier.name} whileHover={{ scale: 1.02, y: -2 }} className={`text-center p-5 rounded-xl border bg-gradient-to-br ${tier.gradient} cursor-pointer`}>
                  <div className="text-4xl mb-3">{tier.emoji}</div>
                  <p className="font-semibold">{tier.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{tier.req}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Beta Notice */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="border-dashed bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground"><Lock className="h-5 w-5" />Beta Phase Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">ZenSolar is in beta on the Base Sepolia testnet. The $0.10 launch floor will be established with a $300K USDC liquidity pool at mainnet launch. All minting is gasless—we cover transaction fees.</p>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </>
  );
}
