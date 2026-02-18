import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap } from 'lucide-react';
import heroBg from '@/assets/hero-solar-cinematic.jpg';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

export default function HeroTest() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [0.55, 0.85]);

  return (
    <div className="min-h-screen bg-black">
      {/* Minimal nav */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-transparent">
        <img src={zenLogo} alt="ZenSolar" className="h-7 w-auto brightness-0 invert opacity-90" />
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
              Log In
            </Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="bg-white text-black hover:bg-white/90 font-semibold px-5">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Full-bleed hero */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* Parallax background image */}
        <motion.div
          className="absolute inset-0 -z-10"
          style={{ y: bgY }}
        >
          <img
            src={heroBg}
            alt=""
            aria-hidden
            className="w-full h-[115%] object-cover object-center"
            fetchPriority="high"
          />
        </motion.div>

        {/* Dark cinematic overlay — gradient from bottom */}
        <motion.div
          className="absolute inset-0 -z-[9]"
          style={{
            opacity: overlayOpacity,
            background: 'linear-gradient(to top, #000 0%, #000c 40%, #0007 70%, transparent 100%)',
          }}
        />
        {/* Extra top darkening for legibility */}
        <div className="absolute inset-0 -z-[8] bg-gradient-to-b from-black/60 via-transparent to-transparent" />

        {/* Content */}
        <motion.div
          style={{ y: contentY }}
          className="relative z-10 flex flex-col items-center text-center px-5 max-w-5xl mx-auto gap-8 pt-16"
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-[0.18em] uppercase text-white/70">
              Now Live on Base Blockchain
            </span>
          </motion.div>

          {/* Massive token ticker */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Glow halo behind text */}
            <div
              className="absolute inset-0 -z-10 blur-[80px] opacity-50 rounded-full"
              style={{ background: 'radial-gradient(ellipse, hsl(var(--solar)) 0%, hsl(var(--primary)) 40%, transparent 70%)' }}
            />
            <p
              className="font-black leading-none tracking-[-0.04em] select-none"
              style={{
                fontSize: 'clamp(5.5rem, 20vw, 14rem)',
                background: 'linear-gradient(135deg, #fff 0%, hsl(var(--solar)) 35%, hsl(var(--primary)) 65%, #fff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              $ZSOLAR
            </p>
          </motion.div>

          {/* Single bold value prop */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.35 }}
            className="text-white font-bold leading-[1.1] tracking-tight"
            style={{ fontSize: 'clamp(1.6rem, 4.5vw, 3rem)' }}
          >
            Your sun generates power.
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, hsl(var(--solar)), hsl(var(--primary)))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Now it generates income.
            </span>
          </motion.h1>

          {/* Sub-line */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="text-white/55 max-w-lg leading-relaxed"
            style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)' }}
          >
            Every kWh you produce, every EV mile you drive — automatically minted as $ZSOLAR tokens and NFTs. No crypto experience needed.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.55 }}
            className="flex flex-col sm:flex-row items-center gap-3 pt-2"
          >
            <Link to="/auth">
              <Button
                size="lg"
                className="relative overflow-hidden px-9 py-6 text-[1rem] font-bold tracking-tight text-black rounded-full"
                style={{ background: 'linear-gradient(135deg, hsl(var(--solar)), hsl(var(--primary)))' }}
              >
                {/* Shimmer sweep */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 pointer-events-none"
                  animate={{ x: ['-120%', '220%'] }}
                  transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }}
                />
                <Zap className="mr-2 h-5 w-5 relative z-10" />
                <span className="relative z-10">Start Earning Free</span>
                <ArrowRight className="ml-2 h-5 w-5 relative z-10" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button
                size="lg"
                variant="outline"
                className="px-9 py-6 text-[1rem] font-semibold rounded-full border-white/25 text-white bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/40 transition-all"
              >
                Try Demo
              </Button>
            </Link>
          </motion.div>

          {/* Live proof stat strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-6 md:gap-10 pt-6 border-t border-white/10 w-full max-w-2xl"
          >
            {[
              { value: '2.4M+', label: 'kWh Verified' },
              { value: '847K', label: '$ZSOLAR Minted' },
              { value: '1,240', label: 'Beta Users' },
              { value: 'Base L2', label: 'Blockchain' },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className="text-white font-bold text-xl leading-none">{value}</span>
                <span className="text-white/40 text-xs tracking-wide uppercase">{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <span className="text-white/40 text-[0.65rem] uppercase tracking-[0.2em]">Scroll</span>
          <motion.div
            className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent"
            animate={{ scaleY: [1, 0.4, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </section>

      {/* Below the fold — brief context */}
      <section className="bg-black py-24 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-white text-3xl md:text-4xl font-bold tracking-tight">
            Clean energy has always had value.
            <br />
            <span className="text-white/40">We just made it spendable.</span>
          </h2>
          <p className="text-white/50 text-lg leading-relaxed max-w-xl mx-auto">
            ZenSolar's patent-pending Mint-on-Proof<sup className="text-xs">™</sup> protocol converts verified energy data from your Tesla, Enphase, or SolarEdge system into on-chain tokens — automatically.
          </p>
          <Link to="/auth">
            <Button size="lg" className="mt-4 rounded-full px-10 py-6 font-bold text-black" style={{ background: 'linear-gradient(135deg, hsl(var(--solar)), hsl(var(--primary)))' }}>
              Claim Your First Tokens
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Dev note banner */}
      <div className="bg-yellow-500/10 border-t border-yellow-500/20 py-3 px-6 text-center">
        <p className="text-yellow-400/80 text-xs font-mono">
          TEST PAGE — /hero-test — Compare with current hero at{' '}
          <Link to="/" className="underline hover:text-yellow-300">/ (Landing)</Link>
        </p>
      </div>
    </div>
  );
}
