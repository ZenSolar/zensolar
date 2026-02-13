import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Zap, Sun, Battery, Car } from 'lucide-react';

export function HomeHero() {
  return (
    <section className="relative pt-[calc(4rem+env(safe-area-inset-top)+clamp(2rem,6vw,4rem))] pb-[clamp(3rem,8vw,6rem)]">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 -left-20 w-96 h-96 rounded-full opacity-15 dark:opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }} />
        <div className="absolute bottom-20 -right-20 w-96 h-96 rounded-full opacity-10 dark:opacity-25 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(var(--secondary)) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10 dark:opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(var(--solar)) 0%, transparent 70%)' }} />
      </div>

      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center flex flex-col items-center gap-6 max-w-4xl mx-auto">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Badge variant="outline" className="inline-flex items-center px-4 py-2 text-sm border-primary/50 bg-primary/10 text-primary font-semibold ring-1 ring-primary/20 animate-breathing-glow">
              <Sparkles className="h-4 w-4 mr-2 flex-shrink-0" />
              Now in Beta on Base Blockchain Network
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-[clamp(2.5rem,7vw,5rem)] font-bold tracking-tight leading-[1.08]"
          >
            Turn Clean Energy
            <br />
            Into{' '}
            <span className="bg-gradient-to-r from-solar via-accent to-destructive bg-clip-text text-transparent">
              Digital Income
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-[clamp(1.1rem,2.8vw,1.5rem)] font-semibold text-muted-foreground tracking-tight"
          >
            The World's First{' '}
            <span className="bg-gradient-to-r from-eco to-primary bg-clip-text text-transparent">
              Mint-on-Proof<sup className="text-[0.35em] font-normal align-super text-muted-foreground">™</sup>
            </span>{' '}
            Rewards Platform
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-[clamp(1.05rem,2.5vw,1.25rem)] text-muted-foreground max-w-xl mx-auto leading-relaxed text-center"
          >
            <p className="mb-4">
              Earn <span className="text-primary font-semibold">$ZSOLAR tokens</span> and <span className="text-primary font-semibold">NFTs</span> for:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-solar/10 text-solar text-sm font-medium ring-1 ring-solar/20">
                <Sun className="h-3.5 w-3.5" />Solar
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-medium ring-1 ring-secondary/20">
                <Battery className="h-3.5 w-3.5" />Battery
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-energy/10 text-energy text-sm font-medium ring-1 ring-energy/20">
                <Car className="h-3.5 w-3.5" />EV Miles
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-token/10 text-token text-sm font-medium ring-1 ring-token/20">
                <Zap className="h-3.5 w-3.5" />EV Charging
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            <Link to="/demo">
              <Button size="lg" className="px-8 py-6 text-base bg-gradient-to-r from-solar via-accent to-destructive hover:opacity-90 transition-all shadow-lg shadow-accent/30 hover:shadow-accent/50 hover:scale-[1.02]">
                <Zap className="mr-2 h-5 w-5" />
                Try the Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="px-8 py-6 text-base border-primary/40 hover:bg-primary/10 hover:border-primary/60 transition-all">
                Start Earning Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
