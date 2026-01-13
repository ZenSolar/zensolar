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
  Coins
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const segiFeatures = [
  {
    icon: Globe,
    title: 'Universal API Integration',
    description: 'Connects to Tesla, Enphase, SolarEdge, Wallbox, and more through secure API gateways.',
  },
  {
    icon: RefreshCw,
    title: 'Real-Time Data Collection',
    description: 'Continuously fetches your energy production (kWh), EV miles driven, and battery discharge data.',
  },
  {
    icon: Shield,
    title: 'Secure & Encrypted',
    description: 'All data transmission is encrypted end-to-end, with OAuth 2.0 authentication.',
  },
  {
    icon: Database,
    title: 'Activity Data Storage',
    description: 'Securely stores verified activity data to calculate your blockchain rewards.',
  },
];

const blockchainProcess = [
  {
    step: 1,
    title: 'Data Collection',
    description: 'SEGI collects your verified energy production, EV charging, and battery usage data from connected accounts.',
  },
  {
    step: 2,
    title: 'Activity Calculation',
    description: 'Our algorithms calculate new activity since your last mint, converting kWh and miles into reward eligibility.',
  },
  {
    step: 3,
    title: 'Smart Contract Execution',
    description: 'The blockchain smart contract verifies your activity and mints $ZSOLAR tokens directly to your wallet.',
  },
  {
    step: 4,
    title: 'Milestone Tracking',
    description: 'Our algorithm monitors your cumulative totals and triggers NFT minting when you hit milestone thresholds.',
  },
];

export default function Technology() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-sm">⚡</span>
          <span className="text-sm font-semibold text-primary">Patent Pending Technology</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">How Our Technology Works</h1>
        <p className="text-muted-foreground">
          System and Method for Tokenizing and Gamifying Sustainable Behaviors Using Blockchain Technology
        </p>
      </div>

      {/* SEGI Introduction */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <Cpu className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Software-Enabled Gateway Interface (SEGI)</CardTitle>
              <p className="text-sm text-muted-foreground">The core of ZenSolar's patent-pending system</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            SEGI is our proprietary software layer that securely connects to your energy systems 
            and translates real-world sustainable activities into blockchain-verified rewards. 
            Unlike hardware-dependent solutions, SEGI works entirely through software, making 
            setup instant and maintenance-free.
          </p>
          
          <div className="grid gap-3 sm:grid-cols-2">
            {segiFeatures.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border">
                <feature.icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Rewards System */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/20">
              <Coins className="h-6 w-6 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">Blockchain Rewards System</CardTitle>
              <p className="text-sm text-muted-foreground">How your clean energy becomes crypto</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Our smart contracts on the blockchain automatically mint tokens and NFTs based on 
            your verified sustainable activities. Here's the process:
          </p>
          
          <div className="space-y-3">
            {blockchainProcess.map((item, index) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {item.step}
                  </div>
                  {index < blockchainProcess.length - 1 && (
                    <div className="w-0.5 h-full bg-primary/20 mt-1" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20">
              <Lock className="h-6 w-6 text-emerald-500" />
            </div>
            <CardTitle className="text-lg">Security & Privacy</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">OAuth 2.0 authentication with all providers</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">End-to-end encryption for all data</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">We never store your login credentials</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">Blockchain provides immutable transaction records</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What Makes Us Different */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">What Makes ZenSolar Different</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Unified Rewards Platform:</strong> Unlike fragmented solutions 
            that focus on single behaviors, ZenSolar integrates solar production, EV charging, and battery 
            storage into one cohesive reward system.
          </p>
          <p>
            <strong className="text-foreground">Real-Time Incentives:</strong> Our system provides immediate 
            token rewards and milestone NFTs, creating continuous motivation rather than delayed gratification.
          </p>
          <p>
            <strong className="text-foreground">Software-First Approach:</strong> SEGI eliminates the need for 
            additional hardware, making adoption simple and accessible to anyone with supported energy systems.
          </p>
          <p>
            <strong className="text-foreground">Scalable for Growth:</strong> Built to accommodate residential 
            users today with plans to expand to commercial and enterprise scale.
          </p>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center space-y-4 pt-2">
        <p className="text-sm text-muted-foreground">
          Ready to turn your clean energy into blockchain rewards?
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link to="/">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/how-it-works">
              Learn How It Works
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
