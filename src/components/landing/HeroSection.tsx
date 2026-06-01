import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Sparkles, ArrowRight, Hexagon, Play } from 'lucide-react';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

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
        className="absolute top-20 -left-20 w-72 h-72 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)', y: orb1Y, scale: orb1Scale }}
      />
      <motion.div
        className="absolute bottom-20 -right-20 w-72 h-72 rounded-full opacity-35 blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(var(--secondary)) 0%, transparent 70%)', y: orb2Y, scale: orb2Scale }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(var(--energy)) 0%, transparent 70%)', y: orb3Y, opacity: orb3Opacity }}
      />
      <motion.div
        className="absolute top-1/4 right-1/4 w-48 h-48 rounded-full opacity-25 blur-2xl"
        style={{ background: 'radial-gradient(circle, hsl(var(--token)) 0%, transparent 70%)', y: orb4Y }}
      />
      <motion.div
        className="absolute bottom-1/3 left-1/4 w-36 h-36 rounded-full opacity-20 blur-2xl"
        style={{ background: 'radial-gradient(circle, hsl(var(--solar)) 0%, transparent 70%)', y: orb5Y }}
      />
    </div>
  );
}

/* ── Navigation ── */
export function LandingNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
        Skip to content
      </a>
      <div className="container max-w-6xl mx-auto px-4 flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center shrink-0">
          <img src={zenLogo} alt="ZenSolar" width="108" height="32" className="h-8 w-auto animate-logo-glow" />
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
          <Link to="/white-paper" className="text-sm text-muted-foreground hover:text-foreground transition-colors">White Paper</Link>
          <Link to="/demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Demo</Link>
          <Link to="/investor" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Investors</Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
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
    <section
      ref={heroRef}
      className="relative pt-[calc(4rem+env(safe-area-inset-top)+clamp(2rem,5vw,3.5rem))] pb-[clamp(3rem,7vw,6rem)]"
    >
      <ParallaxOrbs scrollYProgress={scrollYProgress} />

      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center flex flex-col items-center gap-[clamp(1.25rem,3.5vw,2rem)]">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Badge
              variant="outline"
              className="inline-flex items-center px-4 py-1.5 text-xs sm:text-sm border-primary/50 bg-primary/10 text-primary font-semibold tracking-wide uppercase ring-1 ring-primary/20 animate-breathing-glow"
            >
              <Sparkles className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
              Proof-of-Genesis™ · Live on Base
            </Badge>
          </motion.div>

          <img
            src="/logos/zen-logo-horizontal-new.png"
            alt="ZenSolar"
            width="189"
            height="56"
            fetchPriority="high"
            className="h-[clamp(3rem,7vw,4.5rem)] w-auto mx-auto animate-logo-glow drop-shadow-lg"
          />

          <h1 className="text-[clamp(2.5rem,7.5vw,5rem)] font-bold tracking-tight leading-[1.05] max-w-4xl">
            Creating Currency{' '}
            <span className="bg-gradient-to-r from-solar via-energy to-primary bg-clip-text text-transparent drop-shadow-sm">
              From Energy
            </span>
          </h1>

          <p className="text-[clamp(1.05rem,2.4vw,1.35rem)] text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Every verified kWh becomes <span className="text-primary font-semibold">$ZSOLAR</span> through the
            Proof-of-Genesis™ protocol. No crypto experience required.
          </p>

          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/10 via-secondary/10 to-energy/10 border border-primary/30 ring-1 ring-primary/10">
            <Hexagon className="h-4 w-4 text-primary" />
            <span className="text-sm sm:text-base font-semibold tracking-tight">
              1&nbsp;kWh <span className="text-muted-foreground">=</span> 1&nbsp;$ZSOLAR
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-md">
            <Link to="/auth" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-base bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02]">
                Start Earning
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/demo" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-base border-primary/40 hover:bg-primary/10">
                <Play className="mr-2 h-4 w-4" />
                See Live Demo
              </Button>
            </Link>
          </div>

          <div className="pt-6 flex flex-col items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Works with</span>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-foreground/80">
              <span>Tesla</span>
              <span className="text-border">•</span>
              <span>Enphase</span>
              <span className="text-border">•</span>
              <span>SolarEdge</span>
              <span className="text-border">•</span>
              <span>Wallbox</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
