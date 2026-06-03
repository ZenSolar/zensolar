import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Sun, BatteryFull, Car, Navigation } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import enphaseLogo from '@/assets/logos/enphase-wordmark.svg';
import teslaLogo from '@/assets/logos/tesla-t-icon.png';
import solaredgeLogo from '@/assets/logos/solaredge-cropped.svg';
import wallboxLogo from '@/assets/logos/wallbox-white.png';

const brandLogos = [
  { src: teslaLogo, alt: 'Tesla' },
  { src: enphaseLogo, alt: 'Enphase' },
  { src: solaredgeLogo, alt: 'SolarEdge' },
  { src: wallboxLogo, alt: 'Wallbox' },
];

const earnRows = [
  { icon: Sun, label: 'Every kWh your solar panels produce' },
  { icon: BatteryFull, label: 'Every kWh your battery storage exports' },
  { icon: Car, label: 'Every EV mile you drive' },
  { icon: Zap, label: 'Every kWh used to charge your EV' },
  { icon: Navigation, label: 'Every autonomous mile driven' },
];

const heroStats = [
  { k: 'Beta', v: 'Live on Base' },
  { k: 'kWh', v: 'Minted as $ZSOLAR' },
  { k: 'Patent', v: 'Pending · Est. 2025' },
];

export function HomeHero() {
  const { mediumTap } = useHaptics();
  return (
    <section className="relative overflow-hidden border-b border-border/40 pt-[calc(4rem+env(safe-area-inset-top)+clamp(2rem,6vw,4rem))] pb-[clamp(3rem,8vw,6rem)]">
      {/* Single calm radial glow — matches /investor/pitch hero */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--secondary)/0.18),transparent_60%)]"
      />

      <div className="container max-w-3xl mx-auto px-5">
        <div className="flex flex-col items-center text-center gap-6">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-[11px] uppercase tracking-[0.24em] text-secondary/90"
          >
            Tokenizing Clean Energy · Beta Live on Base
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-3xl md:text-5xl font-semibold leading-[1.05] tracking-tight text-foreground"
          >
            Creating Currency
            <br />
            From Energy.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed"
          >
            The world&apos;s first Mint-on-Proof™ platform. Tokenizing clean energy at the
            kilowatt-hour level — for solar owners, battery storage, and EV drivers.
          </motion.p>

          {/* Hero KPI tiles, matching /investor/pitch */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="grid grid-cols-3 gap-3 w-full max-w-md"
          >
            {heroStats.map((s) => (
              <div
                key={s.v}
                className="rounded-xl border border-border/60 bg-card/50 px-2 py-3"
              >
                <div className="text-base md:text-lg font-semibold text-foreground">{s.k}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  {s.v}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Earn-for list */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="w-full max-w-md rounded-2xl border border-border/60 bg-card/40 p-5 text-left"
          >
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
              You earn $ZSOLAR for
            </div>
            <ul className="space-y-2.5">
              {earnRows.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-foreground/90">
                  <Icon className="h-4 w-4 text-secondary flex-shrink-0" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full"
          >
            <Button
              asChild
              size="lg"
              onClick={mediumTap}
              className="w-full sm:w-auto h-11 bg-secondary text-secondary-foreground hover:bg-secondary/90 px-7"
            >
              <Link to="/demo">
                <Zap className="mr-2 h-4 w-4" />
                Try Minting · Free Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              onClick={mediumTap}
              className="w-full sm:w-auto h-11 border-border/60 hover:bg-card/60 px-7"
            >
              <Link to="/auth">
                Start Earning Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="w-full max-w-2xl pt-10"
          >
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-4">
              Connects with
            </p>
            <div className="rounded-2xl border border-border/60 bg-card/40 px-6 py-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 place-items-center">
                {brandLogos.map(({ src, alt }) => (
                  <img
                    key={alt}
                    src={src}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    className={`w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300 ${
                      alt === 'Tesla'
                        ? 'max-w-[300px] md:max-w-[400px] max-h-16 md:max-h-20'
                        : 'max-w-[120px] md:max-w-[140px] max-h-9 md:max-h-10'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/60 mt-4">
              More partners coming soon
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
