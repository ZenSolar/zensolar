import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Cpu, 
  Shield, 
  Zap, 
  Database, 
  ArrowRight, 
  CheckCircle2,
  Globe,
  Lock,
  RefreshCw,
  Coins,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const segiFeatures = [
  {
    icon: Globe,
    title: 'Universal API Integration',
    description: 'Connects to Tesla, Enphase, SolarEdge, Wallbox, and more through secure API gateways.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: RefreshCw,
    title: 'Real-Time Data Collection',
    description: 'Continuously fetches your energy production (kWh), EV miles driven, and battery discharge data.',
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    icon: Shield,
    title: 'Secure & Encrypted',
    description: 'All data transmission is encrypted end-to-end, with OAuth 2.0 authentication.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Database,
    title: 'Activity Data Storage',
    description: 'Securely stores verified activity data to calculate your blockchain rewards.',
    gradient: 'from-amber-500 to-orange-500',
  },
];

const blockchainProcess = [
  {
    step: 1,
    title: 'Data Collection',
    description: 'SEGI collects your verified energy production, EV charging, and battery usage data from connected accounts.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    step: 2,
    title: 'Activity Calculation',
    description: 'Our algorithms calculate new activity since your last mint, converting kWh and miles into reward eligibility.',
    color: 'from-emerald-500 to-green-500',
  },
  {
    step: 3,
    title: 'Smart Contract Execution',
    description: 'The blockchain smart contract verifies your activity and mints $ZSOLAR tokens directly to your wallet.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    step: 4,
    title: 'Milestone Tracking',
    description: 'Our algorithm monitors your cumulative totals and triggers NFT minting when you hit milestone thresholds.',
    color: 'from-amber-500 to-orange-500',
  },
];

const securityFeatures = [
  'OAuth 2.0 authentication with all providers',
  'End-to-end encryption for all data',
  'We never store your login credentials',
  'Blockchain provides immutable transaction records',
];

export default function Technology() {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <Badge className="px-4 py-1.5 bg-gradient-to-r from-primary to-accent text-primary-foreground border-0">
          <Sparkles className="h-3 w-3 mr-1.5" />
          Patent Pending Technology
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">How Our Technology Works</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          System and Method for Tokenizing and Gamifying Sustainable Behaviors Using Blockchain Technology
        </p>
      </motion.div>

      {/* SEGI Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-xl">
                <Cpu className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">Software-Enabled Gateway Interface (SEGI)</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">The core of ZenSolar's patent-pending system</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <p className="text-muted-foreground">
              SEGI is our proprietary software layer that securely connects to your energy systems 
              and translates real-world sustainable activities into blockchain-verified rewards. 
              Unlike hardware-dependent solutions, SEGI works entirely through software, making 
              setup instant and maintenance-free.
            </p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {segiFeatures.map((feature, index) => (
                <motion.div 
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-background/80 border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${feature.gradient} shadow-md`}>
                    <feature.icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{feature.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Blockchain Rewards System */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-muted/50 to-muted/20">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-accent to-accent/60 shadow-xl">
                <Coins className="h-8 w-8 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">Blockchain Rewards System</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">How your clean energy becomes crypto</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <p className="text-muted-foreground">
              Our smart contracts on the blockchain automatically mint tokens and NFTs based on 
              your verified sustainable activities. Here's the process:
            </p>
            
            <div className="space-y-4">
              {blockchainProcess.map((item, index) => (
                <motion.div 
                  key={item.step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                      {item.step}
                    </div>
                    {index < blockchainProcess.length - 1 && (
                      <div className="w-0.5 h-full bg-gradient-to-b from-primary/40 to-transparent mt-2" />
                    )}
                  </div>
                  <div className="pb-6 flex-1">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-green-500/5 overflow-hidden relative">
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-3xl" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 shadow-xl">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Security & Privacy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid gap-3 sm:grid-cols-2">
              {securityFeatures.map((feature, index) => (
                <motion.div 
                  key={feature}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* What Makes Us Different */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-muted/50 to-muted/20">
            <CardTitle className="text-xl flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              What Makes ZenSolar Different
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {[
              { title: 'Unified Rewards Platform', desc: 'Unlike fragmented solutions that focus on single behaviors, ZenSolar integrates solar production, EV charging, and battery storage into one cohesive reward system.' },
              { title: 'Real-Time Incentives', desc: 'Our system provides immediate token rewards and milestone NFTs, creating continuous motivation rather than delayed gratification.' },
              { title: 'Software-First Approach', desc: 'SEGI eliminates the need for additional hardware, making adoption simple and accessible to anyone with supported energy systems.' },
              { title: 'Scalable for Growth', desc: 'Built to accommodate residential users today with plans to expand to commercial and enterprise scale.' },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-4 rounded-xl bg-muted/30 border border-border/50"
              >
                <p className="font-semibold text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center space-y-4 py-4"
      >
        <p className="text-muted-foreground">
          Ready to turn your clean energy into blockchain rewards?
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="gap-2 shadow-lg">
            <Link to="/">
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/how-it-works">
              Learn How It Works
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
