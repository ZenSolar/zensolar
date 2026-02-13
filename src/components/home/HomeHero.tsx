import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Zap, Sun, BatteryFull, Car } from 'lucide-react';
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import teslaLogo from '@/assets/logos/tesla-brand.png';
import solaredgeLogo from '@/assets/logos/solaredge-cropped.svg';
import wallboxLogo from '@/assets/logos/wallbox-brand.png';

const brandLogos = [
  { src: teslaLogo, alt: 'Tesla', extra: '' },
  { src: enphaseLogo, alt: 'Enphase', extra: '' },
  { src: solaredgeLogo, alt: 'SolarEdge', extra: '' },
  { src: wallboxLogo, alt: 'Wallbox', extra: 'dark:invert' },
];

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
            Turn Your Clean Energy
            <br />
            Into{' '}
            <span className="bg-gradient-to-r from-eco via-primary to-secondary bg-clip-text text-transparent">
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
            <span className="bg-gradient-to-r from-solar via-accent to-destructive bg-clip-text text-transparent">
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
            <p className="mb-4 font-normal text-[clamp(0.95rem,2.3vw,1.1rem)] leading-relaxed">
              ZenSolar rewards solar users and EV drivers with <span className="text-primary font-medium">$ZSOLAR tokens</span> and <span className="text-primary font-medium">NFTs</span> for:
            </p>
            <ul className="space-y-2 text-left inline-block text-[clamp(0.9rem,2.5vw,1.05rem)]">
              <li className="flex items-center gap-2.5">
                <Sun className="h-4 w-4 text-solar flex-shrink-0" />
                <span>Every kWh your solar panels produce</span>
              </li>
              <li className="flex items-center gap-2.5">
                <BatteryFull className="h-4 w-4 text-secondary flex-shrink-0" />
                <span>Every kWh your battery storage exports</span>
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

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="w-full max-w-2xl pt-8"
          >
            <p className="text-xs text-muted-foreground/50 uppercase tracking-[0.2em] font-mono mb-5">Connects with</p>
            <div className="relative overflow-hidden rounded-lg py-3">
              {/* Subtle shimmer sweep */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -skew-x-12 pointer-events-none"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 items-center justify-items-center px-4">
                {brandLogos.map(({ src, alt, extra }, idx) => (
                  <motion.img
                    key={alt}
                    src={src}
                    alt={alt}
                    className={`${extra} w-auto object-contain opacity-50 hover:opacity-100 transition-all duration-500 ${alt === 'Tesla' ? 'max-w-[140px] md:max-w-[160px] max-h-12 md:max-h-14' : 'max-w-[120px] md:max-w-[140px] max-h-10 md:max-h-12'}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 0.5, y: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground/40 uppercase tracking-[0.15em] font-mono mt-4">More manufacturers coming soon…</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
