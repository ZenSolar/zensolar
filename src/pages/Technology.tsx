import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Cpu, 
  Shield, 
  Zap, 
  ArrowRight,
  CheckCircle2,
  Globe,
  Lock,
  RefreshCw,
  Coins,
  Sparkles,
  Rocket,
  Cloud,
  Key,
  Server,
  Link as LinkIcon,
  Binary,
  Fingerprint,
  Gauge,
  Trophy
} from 'lucide-react';
import { MintOnProofComparison } from '@/components/whitepaper/MintOnProofComparison';
import { SEGIProofOfDeltaDiagram } from '@/components/technology/SEGIProofOfDeltaDiagram';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';

const segiLayers = [
  {
    icon: Cloud,
    title: 'Layer 1: API Aggregation',
    tagline: 'Universal Translator',
    description: 'SEGI speaks every language in the clean energy world. Tesla, Enphase, SolarEdge, Wallbox—we connect to manufacturer clouds via secure OAuth. No hardware dongles, no gateway boxes, no technician visits.',
    gradient: 'from-blue-500 to-cyan-500',
    highlight: 'Zero hardware required',
  },
  {
    icon: RefreshCw,
    title: 'Layer 2: Data Normalization',
    tagline: 'Unified Standards',
    description: 'Every provider reports data differently. Tesla talks in miles, Enphase speaks Watt-hours, Wallbox counts in kWh. SEGI normalizes everything into a unified "Impact Score" (0.7 kg CO₂ per kWh). One metric to rule them all.',
    gradient: 'from-emerald-500 to-green-500',
    highlight: 'Unified impact scoring',
  },
  {
    icon: Fingerprint,
    title: 'Layer 3: Verification Engine',
    tagline: 'Cryptographic Proof',
    description: 'Anyone can claim they drove 1,000 miles. SEGI doesn\'t take your word for it—it pulls cryptographically signed data directly from manufacturer APIs. Timestamps, device IDs, and production values are all tamper-evident.',
    gradient: 'from-purple-500 to-pink-500',
    highlight: 'Tamper-proof verification',
  },
  {
    icon: Binary,
    title: 'Layer 4: Smart Contract Bridge',
    tagline: 'Mint-on-Proof + Proof-of-Origin',
    description: 'This is where the magic happens. SEGI calculates your new activity since your last mint, packages it into a transaction payload, and triggers our smart contracts on Base L2. Every mint simultaneously updates the Device Watermark Registry—a public, on-chain record binding each physical device to its total tokenized energy via Proof-of-Origin™. With one tap, you mint $ZSOLAR tokens AND milestone NFTs directly to your wallet, with cross-platform anti-double-mint protection built in.',
    gradient: 'from-amber-500 to-orange-500',
    highlight: 'One-tap minting + on-chain watermark',
  },
];

const whyItMatters = [
  {
    icon: Rocket,
    title: 'Instant Onboarding',
    description: 'Connect in 60 seconds. No hardware to install, no technicians to schedule, no waiting for shipments.',
  },
  {
    icon: Globe,
    title: 'Hardware Agnostic',
    description: 'Don\'t have Tesla? No problem. SEGI works with the equipment you already own.',
  },
  {
    icon: Shield,
    title: 'Trustless Verification',
    description: 'Data comes directly from manufacturers—not user input. No gaming the system.',
  },
  {
    icon: Gauge,
    title: 'Real-Time Tracking',
    description: 'Your dashboard updates as you produce. Watch your rewards grow in real-time.',
  },
];

const comparisonTable = [
  { feature: 'Hardware Required', traditional: 'Custom IoT devices', segi: 'None—software only ✓' },
  { feature: 'Setup Time', traditional: '2-4 weeks', segi: '60 seconds ✓' },
  { feature: 'Vendor Lock-In', traditional: 'Single provider', segi: 'Multi-vendor ✓' },
  { feature: 'Verification Method', traditional: 'Self-reported', segi: 'API-verified ✓' },
  { feature: 'Maintenance', traditional: 'Ongoing hardware upkeep', segi: 'Zero maintenance ✓' },
  { feature: 'Cost to User', traditional: '$100-500+ devices', segi: 'Free to connect ✓' },
];

const blockchainFlow = [
  {
    step: 1,
    emoji: '🔌',
    title: 'Connect Your Devices',
    description: 'Link your Tesla, solar inverter, or EV charger in seconds via OAuth.',
  },
  {
    step: 2,
    emoji: '📊',
    title: 'SEGI Tracks Everything',
    description: 'We pull your production data automatically—kWh generated, miles driven, energy stored.',
  },
  {
    step: 3,
    emoji: '🧮',
    title: 'Calculate Your Rewards',
    description: 'SEGI converts your activity into token eligibility using our verified formulas.',
  },
  {
    step: 4,
    emoji: '🚀',
    title: 'Mint Right From the App!',
    description: 'Tap a button and our smart contracts mint $ZSOLAR tokens + collectible NFTs directly to your connected wallet. No external sites, no complexity—just rewards, delivered instantly.',
  },
  {
    step: 5,
    emoji: '💰',
    title: 'You Own Your Rewards',
    description: 'Tokens are yours—hold, trade, or spend in the ZenSolar store.',
  },
];

const securityFeatures = [
  { icon: Key, text: 'OAuth 2.0 authentication—we never see your passwords' },
  { icon: Lock, text: 'End-to-end encryption for all data transmission' },
  { icon: Server, text: 'Your credentials stay with manufacturers, not us' },
  { icon: LinkIcon, text: 'Blockchain provides immutable, auditable records' },
];

export default function Technology() {
  return (
    <>
      <SEO 
        title="Mint-on-Proof™ Technology - Patent-Pending Clean Energy Verification"
        url="https://zensolar.lovable.app/technology"
        image="https://zensolar.lovable.app/og-technology.png"
      />
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <Badge className="px-4 py-1.5 bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground border-0 shadow-lg">
          <Sparkles className="h-3.5 w-3.5 mr-2" />
          Patent Pending Technology
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold">
          Meet <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">Mint-on-Proof™</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Powered by <strong>SEGI (Software-Enabled Gateway Interface)</strong>—the patent-pending tech that turns your clean energy into blockchain rewards, no hardware required.
        </p>
      </motion.div>

      {/* What is SEGI - Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 border-primary/30 overflow-hidden">
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-shrink-0 p-4 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 shadow-xl mx-auto md:mx-0">
                <Cpu className="h-12 w-12 text-white" />
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-center md:text-left">What is Mint-on-Proof™?</h2>
                <p className="text-muted-foreground leading-relaxed text-center md:text-left">
                  Think of SEGI as a <strong className="text-foreground">universal translator</strong> that sits between your 
                  energy hardware and the blockchain. It's a software layer that:
                </p>
                <ul className="space-y-3 text-muted-foreground max-w-md mx-auto md:mx-0">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-left"><strong className="text-foreground">Connects</strong> to Tesla, Enphase, SolarEdge, Wallbox (and more coming)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-left"><strong className="text-foreground">Verifies</strong> your actual energy production—no self-reporting</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-left"><strong className="text-foreground">Converts</strong> that data into blockchain-certified rewards</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-left"><strong className="text-foreground">Mints</strong> $ZSOLAR tokens AND collectible NFTs directly from the app to your wallet! 🚀</span>
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed text-center md:text-left">
                  The innovation? <strong className="text-foreground">It's 100% software</strong>. No IoT dongles. No gateway boxes. 
                  No technician visits. You connect in 60 seconds and start earning—then mint your rewards with a single tap.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* The 4 Layers */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">How Mint-on-Proof Works: The 4 Layers</h2>
          <p className="text-muted-foreground">Under the hood, SEGI is a layered architecture—each piece doing its job perfectly.</p>
        </div>
        
        <div className="grid gap-4">
          {segiLayers.map((layer, index) => (
            <motion.div
              key={layer.title}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 dark:hover:shadow-primary/20 transition-all duration-300 cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <motion.div 
                      className={`flex-shrink-0 p-3 rounded-xl bg-gradient-to-br ${layer.gradient} shadow-lg`}
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <layer.icon className="h-6 w-6 text-white" />
                    </motion.div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-lg">{layer.title}</h3>
                        <Badge variant="outline" className="text-xs">{layer.tagline}</Badge>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{layer.description}</p>
                      <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                        {layer.highlight}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* SEGI + Proof-of-Delta Architecture */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
      >
        <SEGIProofOfDeltaDiagram />
      </motion.div>

      {/* Mint-on-Proof vs Pre-Minted Pools Visual Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <MintOnProofComparison autoPlay={true} showControls={true} />
      </motion.div>

      {/* Why It Matters */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Trophy className="h-6 w-6 text-emerald-500" />
              Why This Matters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {whyItMatters.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-background/80 border border-border/60"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <item.icon className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* SEGI vs Traditional */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card>
          <CardHeader className="bg-muted/40">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Zap className="h-6 w-6 text-primary" />
              SEGI vs. Traditional Approaches
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold">Feature</th>
                    <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Traditional</th>
                    <th className="text-left py-3 px-2 font-semibold text-primary">SEGI</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonTable.map((row, index) => (
                    <tr key={row.feature} className={index < comparisonTable.length - 1 ? 'border-b border-border/50' : ''}>
                      <td className="py-3 px-2 font-medium">{row.feature}</td>
                      <td className="py-3 px-2 text-muted-foreground">{row.traditional}</td>
                      <td className="py-3 px-2 text-primary font-medium">{row.segi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* The Flow */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="bg-gradient-to-r from-primary/10 to-emerald-500/10">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Coins className="h-6 w-6 text-primary" />
              From Solar Panel to Wallet: The Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {blockchainFlow.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + index * 0.08 }}
                  className="flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-2xl shadow-lg">
                      {item.emoji}
                    </div>
                    {index < blockchainFlow.length - 1 && (
                      <div className="w-0.5 h-full bg-gradient-to-b from-primary/50 to-transparent mt-2 min-h-[24px]" />
                    )}
                  </div>
                  <div className="pb-4 flex-1">
                    <p className="font-bold text-foreground">{item.title}</p>
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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Lock className="h-6 w-6 text-blue-500" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              We take security seriously. Here's how your data stays safe:
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + index * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10"
                >
                  <feature.icon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* The Patent */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg flex-shrink-0">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold">Why Is This Patent-Pending? 📜</h3>
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">The innovation is the method.</strong> Prior approaches required 
                  custom IoT hardware or relied on self-reported data. SEGI is the first system to create a 
                  <strong className="text-foreground"> software-only bridge</strong> between verified energy APIs 
                  and blockchain smart contracts.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The patent application (filed April 2025) protects the specific architecture: API aggregation → 
                  data normalization → cryptographic verification → automated minting, plus <strong className="text-foreground">Proof-of-Origin™</strong> (Device Watermark Registry)—a 
                  standalone on-chain contract that prevents cross-platform double-minting of physical devices.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                    First-mover advantage with legal protection
                  </Badge>
                  <Badge className="bg-primary/10 text-primary border-primary/30">
                    Proof-of-Origin™
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center space-y-4 py-6"
      >
        <h2 className="text-2xl font-bold">
          Ready to Experience SEGI? ⚡
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Connect your devices and start earning $ZSOLAR rewards in under a minute. 
          No hardware, no hassle—just clean energy → digital income.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="lg" className="gap-2 bg-gradient-to-r from-primary to-emerald-600 hover:opacity-90 shadow-lg">
            <Link to="/">
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/white-paper">
              Read White Paper
            </Link>
          </Button>
        </div>
      </motion.div>
      </div>
    </>
  );
}
