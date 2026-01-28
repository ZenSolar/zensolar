import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sun, Zap, Battery, Car, Coins, Shield, TrendingUp, 
  ChevronRight, Sparkles, Globe, ArrowRight, Hexagon
} from 'lucide-react';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import { SEGIFlowDiagram } from '@/components/whitepaper/SEGIFlowDiagram';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { SEO } from '@/components/SEO';

const features = [
  {
    icon: Sun,
    title: "Solar Production",
    description: "Earn tokens for every kWh your panels generate",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Car,
    title: "EV Miles",
    description: "Get rewarded for every electric mile driven",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Battery,
    title: "Battery Storage",
    description: "Maximize earnings from home battery systems",
    gradient: "from-emerald-500 to-green-500",
  },
  {
    icon: Zap,
    title: "EV Charging",
    description: "Earn from every charge session at home",
    gradient: "from-purple-500 to-pink-500",
  },
];

const benefits = [
  {
    icon: Coins,
    title: "$400-$1,000/Month",
    description: "Transform your clean energy into meaningful passive income",
  },
  {
    icon: Shield,
    title: "Hardware Agnostic",
    description: "Works with Tesla, Enphase, SolarEdge, Wallbox & more",
  },
  {
    icon: TrendingUp,
    title: "10x Growth Potential",
    description: "$0.10 launch floor with clear path to $1.00+",
  },
];

export default function Landing() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  // Parallax transforms for background orbs
  const orb1Y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const orb3Y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const orb1Scale = useTransform(scrollYProgress, [0, 1], [1, 1.3]);
  const orb2Scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const orb3Opacity = useTransform(scrollYProgress, [0, 0.5], [0.2, 0.4]);

  return (
    <>
      <SEO 
        title="ZenSolar - Earn Crypto for Clean Energy"
        description="Transform your solar production, EV miles, and battery storage into $ZSOLAR tokens and NFTs. Patent-pending SEGI technology verifies your clean energy impact."
        url="https://zensolar.lovable.app"
        image="https://zensolar.lovable.app/og-image.png"
      />
      <div className="min-h-screen bg-background dark:bg-gradient-to-br dark:from-background dark:via-background dark:to-primary/5">
      {/* Navigation - with safe area padding for mobile notches */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="container max-w-6xl mx-auto px-4 flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center shrink-0">
            <img 
              src={zenLogo} 
              alt="ZenSolar" 
              className="h-8 w-auto dark:animate-logo-glow"
            />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/white-paper" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              White Paper
            </Link>
            <Link to="/demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Demo
            </Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="px-3">Log In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-primary hover:bg-primary/90 px-3 sm:px-4">
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Start</span>
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - optimized for iPhone SE through Pro Max + Android */}
      <section ref={heroRef} className="relative pt-[calc(4rem+env(safe-area-inset-top)+clamp(1rem,4vw,2.5rem))] pb-[clamp(2.5rem,6vw,5rem)]">
        {/* Parallax background orbs with glow effects */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div 
            className="absolute top-20 -left-20 w-72 h-72 rounded-full opacity-20 dark:opacity-40 dark:blur-3xl"
            style={{ 
              background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
              y: orb1Y,
              scale: orb1Scale
            }}
          />
          <motion.div 
            className="absolute bottom-20 -right-20 w-72 h-72 rounded-full opacity-15 dark:opacity-35 dark:blur-3xl"
            style={{ 
              background: 'radial-gradient(circle, hsl(142 76% 36%) 0%, transparent 70%)',
              y: orb2Y,
              scale: orb2Scale
            }}
          />
          {/* Additional glow orb for dark mode with parallax */}
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl hidden dark:block"
            style={{ 
              background: 'radial-gradient(circle, hsl(199 89% 48%) 0%, transparent 70%)',
              y: orb3Y,
              opacity: orb3Opacity
            }}
          />
          {/* Extra floating orbs for more depth */}
          <motion.div 
            className="absolute top-1/4 right-1/4 w-48 h-48 rounded-full opacity-10 dark:opacity-25 blur-2xl"
            style={{ 
              background: 'radial-gradient(circle, hsl(280 80% 60%) 0%, transparent 70%)',
              y: useTransform(scrollYProgress, [0, 1], [0, -60])
            }}
          />
          <motion.div 
            className="absolute bottom-1/3 left-1/4 w-36 h-36 rounded-full opacity-10 dark:opacity-20 blur-2xl"
            style={{ 
              background: 'radial-gradient(circle, hsl(45 100% 50%) 0%, transparent 70%)',
              y: useTransform(scrollYProgress, [0, 1], [0, 100])
            }}
          />
        </div>

        <div className="container max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-center flex flex-col items-center gap-[clamp(1.25rem,4vw,2.5rem)] max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Badge 
                variant="outline" 
                className="inline-flex items-center max-w-[min(95vw,44rem)] px-[clamp(0.75rem,3vw,2.25rem)] py-[clamp(0.6rem,1.6vw,0.95rem)] text-[clamp(0.78rem,2.6vw,1.05rem)] whitespace-nowrap flex-nowrap border-primary/50 bg-primary/10 text-primary font-semibold tracking-tight leading-none ring-1 ring-primary/20 animate-breathing-glow"
              >
                <Sparkles className="h-[clamp(0.9rem,2.4vw,1.15rem)] w-[clamp(0.9rem,2.4vw,1.15rem)] mr-[clamp(0.35rem,1.2vw,0.6rem)] flex-shrink-0" />
                <span className="whitespace-nowrap">Now in Beta on Base Blockchain Network</span>
              </Badge>
            </motion.div>

            <motion.img
              src={zenLogo}
              alt="ZenSolar"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="h-[clamp(3.5rem,8vw,5.5rem)] w-auto mx-auto dark:animate-logo-glow drop-shadow-lg"
            />
            
            <h1 className="text-[clamp(2.4rem,8vw,4.5rem)] font-bold tracking-tight leading-[1.1]">
              Turn Clean Energy Into{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-sm">
                Digital Income
              </span>
            </h1>
            
            {/* Single clear value proposition */}
            <p className="text-[clamp(1.05rem,3vw,1.3rem)] text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Earn <span className="text-primary font-semibold">$ZSOLAR tokens</span> and <span className="text-primary font-semibold">NFTs</span> for every kWh you produce, store, drive, or charge.
            </p>

            {/* Reward categories - Clean inline display */}
            <div className="flex flex-col items-center gap-3 pt-3">
              <p className="text-xs text-muted-foreground/80 uppercase tracking-widest font-medium">
                Earn for
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-medium">
                <span className="flex items-center gap-1.5 text-amber-500">
                  <Sun className="h-4 w-4" />
                  Solar kWh
                </span>
                <span className="text-border/60">•</span>
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <Battery className="h-4 w-4" />
                  Battery kWh
                </span>
                <span className="text-border/60">•</span>
                <span className="flex items-center gap-1.5 text-blue-500">
                  <Car className="h-4 w-4" />
                  EV Miles
                </span>
                <span className="text-border/60">•</span>
                <span className="flex items-center gap-1.5 text-purple-500">
                  <Zap className="h-4 w-4" />
                  EV Charging kWh
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-5 w-full">
              <Link to="/demo">
                <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-base bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:opacity-90 transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02]">
                  <Hexagon className="mr-2 h-5 w-5" />
                  Mint Tokens & NFTs Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-base bg-gradient-to-r from-primary to-emerald-600 hover:opacity-90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/45 hover:scale-[1.02]">
                  Start Earning Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Trust indicators - More pronounced */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-6"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-emerald-500/10 border border-primary/30 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-default">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Patent Pending</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all cursor-default">
                <Globe className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-foreground">Built on Base L2</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 shadow-sm hover:shadow-md hover:border-amber-500/50 transition-all cursor-default">
                <Hexagon className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-foreground">Tokens & NFTs Minted In-App</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 shadow-sm hover:shadow-md hover:border-purple-500/50 transition-all cursor-default">
                <Zap className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-foreground">One-Tap Minting</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SEGI Minting Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-background to-muted/30 dark:from-background dark:to-primary/5">
        <div className="container max-w-4xl mx-auto px-4 space-y-10">
          {/* Intro Text */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-5"
          >
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Hexagon className="h-3.5 w-3.5 mr-2" />
              One-Tap Minting
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Tokens & NFTs{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Minted In-App
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
              Our patent-pending SEGI technology verifies your energy production and lets you mint $ZSOLAR tokens 
              and milestone NFTs with just one tap—no external tools needed.
            </p>

            <div className="pt-4 space-y-3">
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Patent-Pending SEGI Technology
              </Badge>
              <h3 className="text-2xl md:text-3xl font-bold">
                How In-App Minting Works
              </h3>
              <p className="text-muted-foreground">
                Our 4-layer architecture seamlessly converts energy data to blockchain rewards
              </p>
            </div>
          </motion.div>

          {/* SEGI 4-Layer Diagram */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <SEGIFlowDiagram />
          </motion.div>
        </div>
      </section>

      {/* Competitive Edge Section */}
      <section className="py-16 md:py-20">
        <div className="container max-w-4xl mx-auto px-4 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
              <Shield className="h-3.5 w-3.5 mr-2" />
              First-Mover Advantage
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              A{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Category-Defining
              </span>
              {' '}Innovation
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
              ZenSolar isn't an incremental improvement—it's the first platform to unify verified energy 
              data with true on-demand blockchain minting.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <Card className="h-full bg-card/80 border-border/50 hover:border-primary/40 transition-all">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Hexagon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">Mint-on-Proof Architecture</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Unlike legacy systems that distribute from pre-minted pools, SEGI creates tokens 
                    on-demand—each one backed by verified clean energy activity.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <Card className="h-full bg-card/80 border-border/50 hover:border-primary/40 transition-all">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold">Deflationary by Design</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Our innovative tokenomics apply burn mechanics at minting and transfer, creating 
                    sustainable scarcity as adoption grows.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Card className="h-full bg-card/80 border-border/50 hover:border-primary/40 transition-all">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-amber-500" />
                    </div>
                    <h3 className="font-semibold">Unified Multi-Vertical</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The first and only platform aggregating Solar, Battery, EV, and Charging rewards 
                    into one dashboard with one token.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <Card className="h-full bg-card/80 border-border/50 hover:border-primary/40 transition-all">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-blue-500" />
                    </div>
                    <h3 className="font-semibold">Patent-Pending IP</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    SEGI's software-only gateway methodology is protected by pending patents—no 
                    existing claims cover this approach.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-20 bg-muted/30 dark:bg-muted/10 border-y border-border/30 dark:border-primary/10">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Four Ways to Earn
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Connect your existing clean energy hardware and start earning $ZSOLAR tokens automatically
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
              >
                <Card className="h-full bg-card/80 border-border/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/15 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-5 text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-3 shadow-lg`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-base mb-1.5">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div>
                <Badge variant="outline" className="mb-4 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Why ZenSolar?
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                  Beyond Tax Credits—
                  <br />
                  <span className="text-primary">Perpetual Rewards</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Federal incentives are one-time and bureaucratic. $ZSOLAR rewards are ongoing, 
                  automatic, and grow as the token appreciates.
                </p>
              </div>

              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ delay: index * 0.08, duration: 0.4 }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border/40 hover:border-primary/30 hover:bg-muted/60 transition-all duration-200"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <Card className="relative bg-gradient-to-br from-card via-card to-muted/60 border-border/50 shadow-2xl dark:shadow-primary/10 dark:border-primary/20 overflow-hidden">
                <CardContent className="p-8 md:p-10">
                  <div className="text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 shadow-lg shadow-primary/25">
                      <Coins className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Average Monthly Earnings</p>
                      <p className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        $800
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">at $1.00 token price</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/60">
                      <div>
                        <p className="text-2xl font-bold text-primary">10x</p>
                        <p className="text-xs text-muted-foreground">Growth potential</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">$0.10</p>
                        <p className="text-xs text-muted-foreground">Launch price</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-muted/30 dark:bg-muted/10 border-t border-border/30 dark:border-primary/10">
        <div className="container max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Monetize Your{' '}
              <span className="text-primary">Clean Energy?</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Join the ZenSolar community and start earning blockchain rewards for the sustainable 
              lifestyle you're already living.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto px-8 bg-gradient-to-r from-primary to-emerald-600 hover:opacity-90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:scale-[1.02]">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/white-paper">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-8">
                  Read White Paper
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - with safe area padding */}
      <footer className="py-8 border-t border-border/40 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={zenLogo} 
                alt="ZenSolar" 
                className="h-6 w-auto dark:animate-logo-glow"
              />
              <span className="text-sm text-muted-foreground">© 2026 ZenSolar. Patent Pending.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/white-paper" className="hover:text-foreground transition-colors">White Paper</Link>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
