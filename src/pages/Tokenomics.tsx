import { Coins, Zap, Award, TrendingUp, Lock, Users, Rocket, Bell, Sparkles, Battery, Car } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";

export default function Tokenomics() {
  return (
    <>
      <SEO 
        title="$ZSOLAR Tokenomics - Clean Energy Token Economics"
        description="Learn about $ZSOLAR tokenomics: 10B total supply, 20% mint burn rate, and kWh-based minting. Turn your solar production and EV miles into real crypto rewards."
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
        <p className="text-muted-foreground max-w-2xl mx-auto">Turn your solar production and EV miles into real crypto rewards. $ZSOLAR is minted based on verified kWh data.</p>
      </motion.div>

      {/* Coming Soon Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/15 via-background to-accent/10 overflow-hidden relative shadow-xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl" />
          <CardHeader className="pb-3 relative">
            <Badge variant="secondary" className="w-fit bg-primary/20 text-primary border-primary/30 gap-1.5"><Bell className="h-3 w-3" />Beta Update</Badge>
            <CardTitle className="flex items-center gap-2 text-xl"><Rocket className="h-5 w-5 text-primary" />Full Tokenomics Plan Coming Soon!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative">
            <p className="text-muted-foreground">We're building an economic flywheel where your real energy data powers token minting. Complete tokenomics—including staking, halving schedule, and governance—will be revealed soon.</p>
            <div className="flex flex-wrap gap-2">
              {['⚡ kWh-Based Minting', '🎯 Staking Rewards', '📉 Halving Schedule', '🚀 Mainnet Launch'].map((tag) => (
                <span key={tag} className="px-3 py-1.5 rounded-full bg-muted/80 text-sm text-muted-foreground">{tag}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Token Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Coins className="h-5 w-5 text-primary" />Token Overview</CardTitle>
            <CardDescription>The currency that powers the clean energy economy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-transparent p-5">
                <p className="text-sm text-muted-foreground mb-1">Token Symbol</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">$ZSOLAR</p>
              </div>
              <div className="rounded-xl border bg-gradient-to-br from-accent/5 to-transparent p-5">
                <p className="text-sm text-muted-foreground mb-1">Network</p>
                <p className="text-2xl font-bold">Base Sepolia (L2)</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20">ERC-20 Token</Badge>
              <Badge className="bg-accent/10 text-accent border-accent/20">Gasless Minting</Badge>
            </div>
            <p className="text-muted-foreground text-sm">$ZSOLAR tokens are minted proportionally to your verified energy production. Built on Base L2 for fast, low-cost transactions.</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* How to Earn */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-500" />How to Earn</CardTitle>
            <CardDescription>Your energy data becomes crypto rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {[
                { icon: Zap, title: 'Solar Energy Production', desc: 'Connect your inverter (Tesla, Enphase, SolarEdge) and mint tokens based on verified kWh output.', gradient: 'from-amber-500 to-orange-600' },
                { icon: Car, title: 'EV Charging & Miles', desc: 'Link your Tesla or home charger to earn rewards for every electric mile driven.', gradient: 'from-blue-500 to-indigo-600' },
                { icon: Battery, title: 'Battery Storage', desc: 'Discharge your home battery to the grid and earn tokens for the energy you export.', gradient: 'from-emerald-500 to-teal-600' },
                { icon: Users, title: 'Referrals & Community', desc: 'Invite friends and grow the ZenSolar community to unlock bonus token rewards.', gradient: 'from-purple-500 to-pink-600' },
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

      {/* NFT Milestones */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-amber-500" />NFT Milestones</CardTitle>
            <CardDescription>Earn collectible NFTs as you hit energy milestones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">ERC-721 NFTs</Badge>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Free to Mint</Badge>
            </div>
            <p className="text-muted-foreground text-sm">Hit real kWh milestones and automatically receive NFTs that prove your contribution to clean energy. We cover all gas fees.</p>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              {[
                { emoji: '🌱', name: 'Seedling', req: '100 kWh produced', gradient: 'from-emerald-500/10 to-emerald-600/5' },
                { emoji: '🌿', name: 'Green Warrior', req: '1,000 kWh milestone', gradient: 'from-teal-500/10 to-teal-600/5' },
                { emoji: '☀️', name: 'Solar Champion', req: '10,000 kWh legend', gradient: 'from-amber-500/10 to-amber-600/5' },
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
            <p className="text-muted-foreground text-sm">ZenSolar is in beta on the Base Sepolia testnet. We're refining the token-to-kWh ratio, staking mechanics, and halving schedule based on real user data before mainnet launch. All minting is gasless.</p>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </>
  );
}
