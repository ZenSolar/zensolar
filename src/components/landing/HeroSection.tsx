import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sun, Zap, Battery, Car,
  ChevronRight, Sparkles, Hexagon, ArrowRight,
} from 'lucide-react';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

/* ── Background orbs with parallax ── */
function ParallaxOrbs({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const orb1Y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const orb3Y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const orb1Scale = useTransform(scrollYProgress, [0, 1], [1, 1.3]);
  const orb2Scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const orb3Opacity = useTransform(scrollYProgress, [0, 0.5], [0.2, 0.4]);
  const orb4Y = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const orb5Y = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute top-20 -left-20 w-72 h-72 rounded-full opacity-20 dark:opacity-40 dark:blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)', y: orb1Y, scale: orb1Scale }}
      />
      <motion.div
        className="absolute bottom-20 -right-20 w-72 h-72 rounded-full opacity-15 dark:opacity-35 dark:blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(var(--secondary)) 0%, transparent 70%)', y: orb2Y, scale: orb2Scale }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl hidden dark:block"
        style={{ background: 'radial-gradient(circle, hsl(var(--energy)) 0%, transparent 70%)', y: orb3Y, opacity: orb3Opacity }}
      />
      <motion.div
        className="absolute top-1/4 right-1/4 w-48 h-48 rounded-full opacity-10 dark:opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, hsl(var(--token)) 0%, transparent 70%)', y: orb4Y }}
      />
      <motion.div
        className="absolute bottom-1/3 left-1/4 w-36 h-36 rounded-full opacity-10 dark:opacity-20 blur-2xl"
        style={{ background: 'radial-gradient(circle, hsl(var(--solar)) 0%, transparent 70%)', y: orb5Y }}
      />
    </div>
  );
}

/* ── Navigation ── */
export function LandingNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
        Skip to content
      </a>
      <div className="container max-w-6xl mx-auto px-4 flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center shrink-0">
          <img src={zenLogo} alt="ZenSolar" width="108" height="32" className="h-8 w-auto dark:animate-logo-glow" />
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
          <Link to="/white-paper" className="text-sm text-muted-foreground hover:text-foreground transition-colors">White Paper</Link>
          <Link to="/demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Demo</Link>
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
  );
}

/* ── Hero Section ── */
export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  return (
    <section ref={heroRef} className="relative pt-[calc(4rem+env(safe-area-inset-top)+clamp(1rem,4vw,2.5rem))] pb-[clamp(2.5rem,6vw,5rem)]">
      <ParallaxOrbs scrollYProgress={scrollYProgress} />

      <div className="container max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center flex flex-col items-center gap-[clamp(1.25rem,4vw,2.5rem)] max-w-3xl mx-auto"
        >
          {/* Beta badge */}
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Badge
              variant="outline"
              className="inline-flex items-center max-w-[min(95vw,44rem)] px-[clamp(0.75rem,3vw,2.25rem)] py-[clamp(0.6rem,1.6vw,0.95rem)] text-[clamp(0.78rem,2.6vw,1.05rem)] whitespace-nowrap border-primary/50 bg-primary/10 text-primary font-semibold tracking-tight leading-none ring-1 ring-primary/20 animate-breathing-glow"
            >
              <Sparkles className="h-[clamp(0.9rem,2.4vw,1.15rem)] w-[clamp(0.9rem,2.4vw,1.15rem)] mr-[clamp(0.35rem,1.2vw,0.6rem)] flex-shrink-0" />
              <span className="whitespace-nowrap">Now in Beta on Base Blockchain Network</span>
            </Badge>
          </motion.div>

          {/* Logo */}
          <motion.img
            src={zenLogo}
            alt="ZenSolar"
            width="189"
            height="56"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="h-[clamp(3.5rem,8vw,5.5rem)] w-auto mx-auto dark:animate-logo-glow drop-shadow-lg"
          />

          {/* Headline */}
          <h1 className="text-[clamp(2.4rem,8vw,4.5rem)] font-bold tracking-tight leading-[1.1]">
            Turn Clean Energy Into{' '}
            <span className="bg-gradient-to-r from-secondary via-energy to-primary bg-clip-text text-transparent drop-shadow-sm">
              Digital Income
            </span>
          </h1>

          {/* Value prop with bullet list */}
          <div className="text-[clamp(1.05rem,3vw,1.25rem)] text-muted-foreground max-w-xl mx-auto leading-relaxed text-center">
            <p className="mb-4">
              ZenSolar rewards solar users and EV drivers
              <br />
              with <span className="text-primary font-semibold">$ZSOLAR tokens</span> and <span className="text-primary font-semibold">NFTs</span> for:
            </p>
            <ul className="space-y-2 text-left inline-block text-[clamp(0.9rem,2.5vw,1.05rem)]">
              <li className="flex items-center gap-2.5">
                <Sun className="h-4 w-4 text-solar flex-shrink-0" />
                <span>Every kWh your solar panels produce</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Battery className="h-4 w-4 text-secondary flex-shrink-0" />
                <span>Every kWh your battery discharges</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Car className="h-4 w-4 text-energy flex-shrink-0" />
                <span>Every EV mile you drive</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Zap className="h-4 w-4 text-token flex-shrink-0" />
                <span>Every kWh used to charge your EV</span>
              </li>
            </ul>
            <div className="mt-6 inline-flex items-center px-5 py-2.5 rounded-full border-primary/50 bg-primary/10 text-primary font-semibold ring-1 ring-primary/20 animate-breathing-glow">
              <span className="text-sm tracking-tight">Start monetizing your sustainable lifestyle →</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full">
            <Link to="/demo">
              <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-base bg-gradient-to-r from-solar via-accent to-destructive hover:opacity-90 transition-all shadow-lg shadow-accent/30 hover:shadow-accent/50 hover:scale-[1.02]">
                <Hexagon className="mr-2 h-5 w-5" />
                Mint Tokens & NFTs Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-base bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/45 hover:scale-[1.02]">
                Start Earning Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <HeroTrustBadges />
        </motion.div>
      </div>
    </section>
  );
}

function HeroTrustBadges() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-6"
    >
      {[
        { icon: '🛡️', label: 'Patent Pending', colors: 'from-primary/10 to-secondary/10 border-primary/30 hover:border-primary/50' },
        { icon: '🌐', label: 'Built on Base L2', colors: 'from-energy/10 to-primary/10 border-energy/30 hover:border-energy/50' },
        { icon: '⬡', label: 'In-App Minting', colors: 'from-solar/10 to-accent/10 border-solar/30 hover:border-solar/50' },
      ].map((badge) => (
        <div
          key={badge.label}
          className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${badge.colors} shadow-sm hover:shadow-md transition-all cursor-default`}
        >
          <span className="text-sm">{badge.icon}</span>
          <span className="text-sm font-medium text-foreground">{badge.label}</span>
        </div>
      ))}
    </motion.div>
  );
}
