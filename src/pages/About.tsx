import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sun, Zap, Coins, Leaf, Users, Globe, ArrowRight, Cpu, Sparkles, Shield, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import zenLogo from "@/assets/zen-logo-horizontal-new.png";
import { SEO } from "@/components/SEO";

const features = [
  {
    icon: Sun,
    title: "Solar Tracking",
    description: "Connect your Enphase, Tesla, or SolarEdge system to automatically track energy production.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Zap,
    title: "EV Integration",
    description: "Log electric vehicle miles and charging to earn additional rewards for clean transportation.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Coins,
    title: "Token Rewards",
    description: "Earn $ZSOLAR tokens proportional to your verified clean energy production.",
    gradient: "from-emerald-500 to-green-500",
  },
  {
    icon: Leaf,
    title: "NFT Milestones",
    description: "Unlock unique NFTs as you hit sustainability milestones like 1000 kWh or 10,000 miles.",
    gradient: "from-purple-500 to-pink-500",
  },
];

const stats = [
  { value: "Beta", label: "Current Phase", icon: Sparkles },
  { value: "Sepolia", label: "Test Network", icon: Shield },
  { value: "3", label: "Solar Providers", icon: Sun },
  { value: "∞", label: "Potential Impact", icon: TrendingUp },
];

export default function About() {
  return (
    <>
      <SEO 
        title="About ZenSolar"
        description="Learn about ZenSolar's mission to reward clean energy production. Connect solar, EV, and battery systems to earn blockchain-verified tokens and NFTs."
        url="https://zensolar.lovable.app/about"
        image="https://zensolar.lovable.app/og-about.png"
      />
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Hero */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <div className="relative inline-block">
          <img 
            src={zenLogo} 
            alt="ZenSolar" 
            className="h-12 mx-auto dark:animate-logo-glow"
          />
          <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl -z-10" />
        </div>
        <div className="space-y-3">
          <Badge variant="outline" className="px-4 py-1 border-primary/30 bg-primary/5">
            <Sparkles className="h-3 w-3 mr-1.5 text-primary" />
            Clean Energy Rewards Platform
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Turn Sunshine into <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">Rewards</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ZenSolar rewards you for generating and using clean energy. Connect your solar system, 
            track your impact, and earn blockchain-verified tokens and NFTs.
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {stats.map((stat, index) => (
          <Card key={stat.label} className="bg-gradient-to-br from-muted/50 to-muted/20 border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="pt-6 text-center">
              <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Patent Pending Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Link to="/technology" className="block group">
          <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
            <CardContent className="py-5">
              <div className="flex items-center justify-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                  <Cpu className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-foreground">Patent Pending Technology</p>
                  <p className="text-sm text-muted-foreground">
                    System and Method for Tokenizing Sustainable Behaviors Using Blockchain
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Mission */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none relative z-10">
            <p className="text-muted-foreground">
              Climate change is the defining challenge of our generation. While governments and corporations 
              debate solutions, millions of homeowners are already taking action by installing solar panels, 
              driving electric vehicles, and making sustainable choices.
            </p>
            <p className="text-muted-foreground">
              ZenSolar exists to recognize and reward these everyday climate heroes. By connecting your 
              clean energy sources to our platform, you earn verifiable, on-chain rewards that represent 
              your positive impact on the planet.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* How It Works */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-5"
      >
        <h2 className="text-2xl font-bold text-center">How It Works</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow group">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Beta Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">🧪</span>
              Beta Program
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ZenSolar is currently in beta on the Sepolia testnet. This means:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              {[
                'Tokens and NFTs have no monetary value during beta',
                "We're refining tokenomics based on community feedback",
                'Your feedback directly shapes the product',
                'Early testers will be recognized when we launch on mainnet'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>

      {/* Team */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              The Team
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              ZenSolar is built by a passionate team of climate tech enthusiasts, blockchain developers, 
              and renewable energy advocates. We believe in the power of decentralized incentives to 
              accelerate the transition to clean energy.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* CTA */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center space-y-5 py-4"
      >
        <h2 className="text-2xl font-bold">Ready to Start Earning?</h2>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="gap-2 shadow-lg">
            <Link to="/">
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/tokenomics">
              View Tokenomics
            </Link>
          </Button>
        </div>
      </motion.div>
      </div>
    </>
  );
}
