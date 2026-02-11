import { motion } from 'framer-motion';
import { Sun, Zap, Battery, Car } from 'lucide-react';
import { SEO } from '@/components/SEO';

const floatingIcons = [
  { Icon: Sun, delay: 0, x: '15%', y: '20%' },
  { Icon: Zap, delay: 0.5, x: '80%', y: '15%' },
  { Icon: Battery, delay: 1, x: '10%', y: '75%' },
  { Icon: Car, delay: 1.5, x: '85%', y: '70%' },
];

export default function ComingSoon() {
  return (
    <>
      <SEO
        title="Coming Soon — ZenSolar"
        description="ZenSolar is launching soon. Earn $ZSOLAR tokens for every kWh your solar panels produce, every EV mile you drive, and every battery cycle."
        url="https://zensolar.com"
        image="https://zensolar.com/og-image.png"
      />
      <div className="relative min-h-screen overflow-hidden bg-background">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
          <motion.div
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]"
            animate={{ scale: [1, 1.2, 1], x: [0, 40, 0], y: [0, -30, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-solar/5 blur-[100px]"
            animate={{ scale: [1.2, 1, 1.2], x: [0, -30, 0], y: [0, 40, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Floating energy icons */}
        {floatingIcons.map(({ Icon, delay, x, y }, i) => (
          <motion.div
            key={i}
            className="absolute text-primary/15"
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, y: [0, -12, 0] }}
            transition={{
              opacity: { delay: delay + 0.5, duration: 0.8 },
              scale: { delay: delay + 0.5, duration: 0.8 },
              y: { delay: delay + 1.3, duration: 4, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <Icon className="w-10 h-10 md:w-14 md:h-14" />
          </motion.div>
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
          {/* Logo */}
          <motion.img
            src="/logos/zen-stacked.png"
            alt="ZenSolar"
            className="w-28 h-28 md:w-36 md:h-36 mb-8 drop-shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          />

          {/* Heading */}
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Something{' '}
            <span className="bg-gradient-to-r from-primary via-secondary to-solar bg-clip-text text-transparent">
              powerful
            </span>{' '}
            is coming
          </motion.h1>

          {/* Subheading */}
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Earn{' '}
            <span className="font-semibold text-primary">$ZSOLAR</span>{' '}
            tokens for every kWh your solar panels produce, every EV mile you drive,
            and every battery cycle you complete.
          </motion.p>

          {/* Mint-on-Proof badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/60 bg-card/60 backdrop-blur-sm mb-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-sm text-muted-foreground">
              Patent-pending <span className="font-medium text-foreground">Mint-on-Proof™</span> technology on Base L2
            </span>
          </motion.div>

          {/* CTA — link to beta */}
          <motion.a
            href="https://beta.zen.solar/auth"
            className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Zap className="w-5 h-5" />
            Join the Beta
            <motion.span
              className="absolute inset-0 rounded-xl bg-white/10"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
          </motion.a>

          {/* Bottom tagline */}
          <motion.p
            className="mt-16 text-xs text-muted-foreground/60 tracking-widest uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            Clean energy. Real rewards. On-chain proof.
          </motion.p>
        </div>

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>
    </>
  );
}
