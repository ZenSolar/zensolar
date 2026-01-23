import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HowItWorks as HowItWorksSteps } from '@/components/dashboard/HowItWorks';
import { SEGIMintingInfographic } from '@/components/landing/SEGIMintingInfographic';
import { Coins, Image, Wallet, Shield, Sparkles, TrendingUp, Cpu, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const milestoneColors = [
  { tier: '🎉', name: 'Welcome NFT', desc: 'Earned when you sign up', color: 'from-amber-400 to-yellow-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { tier: '🌱', name: 'First Harvest', desc: '500 kWh generated', color: 'from-lime-400 to-green-500', bg: 'bg-lime-500/10', border: 'border-lime-500/20' },
  { tier: '☀️', name: 'Solar Pioneer', desc: '1,000 kWh generated', color: 'from-emerald-400 to-green-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { tier: '🛡️', name: 'Energy Guardian', desc: '2,500 kWh generated', color: 'from-teal-400 to-cyan-500', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
  { tier: '⚔️', name: 'Eco Warrior', desc: '5,000 kWh generated', color: 'from-cyan-400 to-blue-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { tier: '💡', name: 'Green Innovator', desc: '10,000 kWh generated', color: 'from-blue-400 to-indigo-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { tier: '🏆', name: 'Sustainability Champion', desc: '25,000 kWh generated', color: 'from-indigo-400 to-purple-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  { tier: '🦸', name: 'Renewable Hero', desc: '50,000 kWh generated', color: 'from-purple-400 to-pink-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { tier: '🧘', name: 'Zen Master', desc: '100,000 kWh generated', color: 'from-rose-400 to-red-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
];

export default function HowItWorks() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <Badge variant="outline" className="px-4 py-1.5 border-primary/30 bg-primary/5">
          <Zap className="h-3 w-3 mr-1.5 text-primary" />
          Learn the Basics
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">How ZenSolar Works</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Turn your clean energy production into blockchain rewards
        </p>
        <Link 
          to="/technology" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 hover:bg-primary/20 transition-all group"
        >
          <Cpu className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Patent Pending Technology</span>
          <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </motion.div>

      {/* SEGI Connect → Verify → Mint Infographic */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SEGIMintingInfographic />
      </motion.div>

      {/* Quick Steps Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-muted/50 to-muted/20">
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <HowItWorksSteps showCard={false} />
          </CardContent>
        </Card>
      </motion.div>

      {/* What are $ZSOLAR Tokens */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-primary/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg">
                <Coins className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">What are $ZSOLAR Tokens?</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 relative z-10">
            <p className="text-muted-foreground">
              <strong className="text-foreground">$ZSOLAR tokens</strong> are ERC-20 digital currency you earn by generating clean solar energy and charging your EV. Built on Base L2 for fast, low-cost transactions—and we cover all gas fees so minting is free for you.
            </p>
            <div className="grid gap-4">
              {[
                { icon: Shield, title: 'Secure & Transparent', desc: 'Every token is recorded on the blockchain, making your rewards tamper-proof and verifiable.' },
                { icon: TrendingUp, title: 'Real Value', desc: 'Use tokens for discounts, exclusive perks, and community benefits as the ZenSolar ecosystem grows.' },
                { icon: Wallet, title: 'Your Wallet, Your Tokens', desc: 'Tokens are minted directly to your connected crypto wallet—you own them completely.' },
              ].map((item, index) => (
                <motion.div 
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* What are NFTs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-accent/20 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-accent to-accent/60 shadow-lg">
                <Image className="h-6 w-6 text-accent-foreground" />
              </div>
              <CardTitle className="text-xl">What are NFTs?</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 relative z-10">
            <p className="text-muted-foreground">
              <strong className="text-foreground">NFTs (Non-Fungible Tokens)</strong> are unique ERC-721 digital assets on Base that prove you own something special. In ZenSolar, NFTs represent your clean energy achievements and milestones—and they're completely free to mint.
            </p>
            <div className="grid gap-4">
              {[
                { icon: Sparkles, title: 'Digital Collectibles', desc: 'Each NFT is one-of-a-kind, like a digital badge or trophy celebrating your green energy contributions.' },
                { icon: Shield, title: 'Proof of Achievement', desc: "NFTs permanently record your milestones—no one can take away or duplicate your achievements." },
                { icon: TrendingUp, title: 'Potential Value', desc: 'As the ZenSolar community grows, early adopter NFTs may become valuable collectibles.' },
              ].map((item, index) => (
                <motion.div 
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-accent/5 border border-accent/10"
                >
                  <div className="p-2 rounded-lg bg-accent/10">
                    <item.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* NFT Milestones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-muted/50 to-muted/20">
            <CardTitle className="text-xl">NFT Milestones</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">ERC-721</Badge>
              <Badge variant="outline" className="text-xs">Base Network</Badge>
              <Badge variant="secondary" className="text-xs">Gasless Minting</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            {milestoneColors.map((m, index) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-xl ${m.bg} border ${m.border} hover:scale-[1.02] transition-transform`}
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
                  {m.tier}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{m.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{m.desc}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-muted-foreground/30 flex-shrink-0" />
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Crypto Wallet Explanation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="overflow-hidden relative">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-primary/10 to-transparent rounded-full blur-3xl" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg">
                <Wallet className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">Why Connect a Wallet?</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <p className="text-muted-foreground">
              A crypto wallet is like a digital bank account for your tokens and NFTs. It's where your ZenSolar rewards are stored securely.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Don't have a wallet yet?</strong> No problem! Popular options include MetaMask, Rainbow, or Coinbase Wallet. They're free to set up and take just a few minutes.
            </p>
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                ✨ Your wallet gives you full ownership of your rewards—ZenSolar never holds your tokens for you.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center py-4"
      >
        <Button asChild size="lg" className="gap-2 shadow-lg">
          <Link to="/">
            Start Earning Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
