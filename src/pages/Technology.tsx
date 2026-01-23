import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Cpu, 
  Shield, 
  Zap, 
  ArrowRight, 
  Check,
  Globe,
  Lock,
  RefreshCw,
  Coins,
  Rocket,
  Cloud,
  Key,
  Server,
  Link as LinkIcon,
  Binary,
  Fingerprint,
  Gauge,
  Hexagon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const segiLayers = [
  {
    icon: Cloud,
    title: 'API Aggregation',
    subtitle: 'The Foundation of Digital Energy Rewards',
    description: 'Secure OAuth 2.0 connections to the world\'s leading energy providers—Tesla, Enphase, SolarEdge, Wallbox, and more. No custom hardware. No technician visits. Just your existing equipment, verified and rewarded.',
    gradient: 'from-emerald-400 to-emerald-500',
    detail: 'Zero hardware installation',
  },
  {
    icon: RefreshCw,
    title: 'Data Normalization',
    subtitle: 'Unified Metrics Engine',
    description: 'Every provider speaks a different language. Our normalization engine converts Tesla\'s kWh, Enphase\'s microinverter data, and Wallbox\'s charging sessions into a standardized Impact Score—ensuring fair, consistent rewards across all devices.',
    gradient: 'from-cyan-400 to-cyan-500',
    detail: 'Cross-platform compatibility',
  },
  {
    icon: Fingerprint,
    title: 'Verification Engine',
    subtitle: 'Converting Clean Energy Into Blockchain Wealth',
    description: 'Cryptographically signed data pulled directly from manufacturer APIs. Device IDs, timestamps, and production values are verified against historical patterns—eliminating fraud and ensuring only genuine clean energy activity is rewarded.',
    gradient: 'from-blue-400 to-blue-500',
    detail: 'Tamper-proof validation',
  },
  {
    icon: Binary,
    title: 'Smart Contract Bridge',
    subtitle: 'One-Tap Blockchain Minting',
    description: 'Verified activity is packaged into transaction payloads and minted as $ZSOLAR tokens and milestone NFTs directly to your wallet—all from within the app. No external platforms. No complexity. Just rewards.',
    gradient: 'from-emerald-500 to-cyan-500',
    detail: 'In-app minting',
  },
];

const keyAdvantages = [
  {
    icon: Rocket,
    title: 'Instant Setup',
    stat: '60s',
    description: 'Connect your devices and start earning in under a minute—no hardware, no waiting.',
  },
  {
    icon: Globe,
    title: 'Hardware Agnostic',
    stat: '4+',
    description: 'Works with Tesla, Enphase, SolarEdge, Wallbox, and more. One platform for all your clean energy assets.',
  },
  {
    icon: Shield,
    title: 'Verified Data',
    stat: '100%',
    description: 'API-verified production data. No self-reporting. No manipulation. Just truth.',
  },
  {
    icon: Gauge,
    title: 'Real-Time Rewards',
    stat: 'Live',
    description: 'Watch your $ZSOLAR balance and NFT progress update as you generate clean energy.',
  },
];

const comparisonData = [
  { feature: 'Hardware Required', legacy: 'Custom IoT devices ($100-500+)', segi: 'None—software only' },
  { feature: 'Setup Time', legacy: '2-4 weeks (technician install)', segi: '60 seconds (OAuth connect)' },
  { feature: 'Vendor Support', legacy: 'Single provider lock-in', segi: 'Multi-vendor ecosystem' },
  { feature: 'Data Verification', legacy: 'Self-reported (fraud risk)', segi: 'API-verified (tamper-proof)' },
  { feature: 'Maintenance', legacy: 'Ongoing hardware updates', segi: 'Zero maintenance' },
  { feature: 'Scalability', legacy: 'Limited by hardware costs', segi: 'Unlimited—add devices instantly' },
];

const journeySteps = [
  { step: 1, title: 'Connect', description: 'Link Tesla, Enphase, or other devices via secure OAuth' },
  { step: 2, title: 'Baseline', description: 'SEGI captures your starting point—only new activity earns rewards' },
  { step: 3, title: 'Track', description: 'Real-time monitoring of solar, EV, and battery activity' },
  { step: 4, title: 'Mint', description: 'One tap to claim $ZSOLAR tokens & milestone NFTs in-app' },
  { step: 5, title: 'Own', description: 'Digital assets delivered directly to your connected wallet' },
];

const securityPoints = [
  { icon: Key, text: 'OAuth 2.0 authentication—zero password sharing' },
  { icon: Lock, text: 'End-to-end encryption for all data transmission' },
  { icon: Server, text: 'Credentials stay with manufacturers—we never store passwords' },
  { icon: LinkIcon, text: 'Immutable blockchain records for every mint' },
];

export default function Technology() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-400/5 via-cyan-400/5 to-transparent" />
        <div className="container max-w-5xl mx-auto px-4 py-16 md:py-24 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6"
          >
            <Badge variant="outline" className="px-4 py-1.5 border-primary/30 bg-primary/5 text-primary font-medium tracking-wide">
              Patent Pending
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                SEGI
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
              Software-Enabled Gateway Interface
            </p>
            
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The patent-pending technology that transforms verified clean energy data into blockchain-certified digital wealth—without hardware installation, without technician visits, without complexity.
            </p>
          </motion.div>
        </div>
      </section>

      {/* What is SEGI */}
      <section className="py-16 md:py-20 border-t border-border/40">
        <div className="container max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                The Foundation of Digital Energy Rewards
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                SEGI is the technical heart of ZenSolar—a proprietary software layer that creates a universal bridge between your existing clean energy hardware and the blockchain. We're not asking you to buy new equipment. We're rewarding the investments you've already made.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                Unlike hardware-dependent solutions that require custom IoT devices and technician installations, SEGI works entirely through secure API connections to the world's leading energy providers.
              </p>
              <ul className="space-y-4">
                {[
                  { label: 'Connect', desc: 'Tesla, Enphase, SolarEdge, Wallbox, and more' },
                  { label: 'Verify', desc: 'Cryptographic proof of production—no self-reporting' },
                  { label: 'Mint', desc: '$ZSOLAR tokens & milestone NFTs directly in-app' },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <div className="mt-1 p-1 rounded-full bg-primary/10">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-semibold">{item.label}:</span>
                      <span className="text-muted-foreground ml-2">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-cyan-400/10 to-blue-500/10 rounded-3xl blur-3xl" />
              <Card className="relative bg-card/80 backdrop-blur border-border/60">
                <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 shadow-2xl shadow-cyan-500/20">
                    <Cpu className="h-16 w-16 text-white" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-5xl font-bold tracking-tight">100%</p>
                    <p className="text-muted-foreground">Software-Only Architecture</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hexagon className="h-4 w-4 text-amber-500" />
                    <span>In-app token & NFT minting</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Four Layers */}
      <section className="py-16 md:py-20 bg-muted/30 border-y border-border/40">
        <div className="container max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Four-Layer Architecture
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Each layer performs a specialized function, working together seamlessly.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {segiLayers.map((layer, index) => (
              <motion.div
                key={layer.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="h-full bg-card hover:bg-card/80 border-border/60 hover:border-primary/30 transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 p-3 rounded-xl bg-gradient-to-br ${layer.gradient} shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                        <layer.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Layer {index + 1}
                          </p>
                          <h3 className="text-lg font-semibold">{layer.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {layer.description}
                        </p>
                        <p className="text-xs font-medium text-primary">
                          {layer.detail}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Advantages - Stats Grid */}
      <section className="py-16 md:py-20">
        <div className="container max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Key Advantages
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {keyAdvantages.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  {item.stat}
                </p>
                <p className="text-sm font-semibold mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 md:py-20 bg-muted/30 border-y border-border/40">
        <div className="container max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              SEGI vs. Legacy Solutions
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Card className="overflow-hidden border-border/60">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left py-4 px-6 font-semibold text-sm">Feature</th>
                      <th className="text-left py-4 px-6 font-semibold text-sm text-muted-foreground">Legacy</th>
                      <th className="text-left py-4 px-6 font-semibold text-sm text-primary">SEGI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, index) => (
                      <tr 
                        key={row.feature} 
                        className={`border-t border-border/40 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                      >
                        <td className="py-4 px-6 text-sm font-medium">{row.feature}</td>
                        <td className="py-4 px-6 text-sm text-muted-foreground">{row.legacy}</td>
                        <td className="py-4 px-6 text-sm font-medium text-primary flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          {row.segi}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* The Journey */}
      <section className="py-16 md:py-20">
        <div className="container max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              From Energy to Wallet
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Five steps from clean energy production to blockchain ownership.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection line - desktop */}
            <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-emerald-400/20 via-cyan-400 to-blue-500/20" />
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 relative">
              {journeySteps.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 text-white font-bold text-xl mb-4 shadow-lg shadow-cyan-500/20 relative z-10">
                    {item.step}
                  </div>
                  <p className="font-semibold mb-1">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-16 md:py-20 bg-muted/30 border-y border-border/40">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Security First
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Your data protection is paramount. SEGI uses industry-standard protocols to ensure your credentials and energy data remain secure.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {securityPoints.map((point, index) => (
                  <motion.div
                    key={point.text}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="flex items-start gap-3"
                  >
                    <point.icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{point.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-card to-muted/50 border-border/60">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-emerald-400/10 via-cyan-400/10 to-blue-500/10">
                    <Lock className="h-12 w-12 text-cyan-500" />
                  </div>
                  <p className="text-2xl font-bold">Zero Password Access</p>
                  <p className="text-sm text-muted-foreground">
                    OAuth 2.0 means we never see your manufacturer credentials
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Patent Section */}
      <section className="py-16 md:py-20">
        <div className="container max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-start gap-8">
                  <div className="flex-shrink-0 p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl">
                    <Shield className="h-10 w-10 text-white" />
                  </div>
                  <div className="space-y-4">
                    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      Patent Pending • Filed April 2025
                    </Badge>
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
                      Protected Innovation
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      SEGI is the first system to create a software-only bridge between verified energy APIs and blockchain smart contracts. The patent application protects the specific architecture: API aggregation → data normalization → cryptographic verification → automated minting.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">First-mover advantage</span> with legal protection for our unique method.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-t from-muted/50 to-transparent">
        <div className="container max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Experience SEGI
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Connect your devices and start earning in under a minute. 
              No hardware. No hassle. Just rewards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 hover:opacity-90 shadow-lg shadow-cyan-500/20 px-8">
                <Link to="/">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8">
                <Link to="/white-paper">
                  Read White Paper
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
