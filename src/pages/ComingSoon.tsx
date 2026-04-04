import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Zap, BatteryFull, Car, Check, Loader2, Shield, Hexagon, Navigation } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import teslaLogo from '@/assets/logos/tesla-wordmark-red.png';
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import solarEdgeLogo from '@/assets/logos/solaredge-cropped.svg';
import wallboxLogo from '@/assets/logos/wallbox-white.png';

/* ── Animated particle field (reduced count for performance) ── */
function ParticleField() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    duration: Math.random() * 25 + 15,
    delay: Math.random() * 8,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20 will-change-transform"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -60, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* ── Hex grid background ── */
function HexGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.12]">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexagons" width="56" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
            <path
              d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="0.7"
            />
            <path
              d="M28 0L56 16L56 50L28 66L0 50L0 16"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="0.7"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexagons)" />
      </svg>
    </div>
  );
}

/* ── Scroll-driven scanner line ── */
function ScannerLine() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let raf: number;
    let currentY = 0;
    let targetY = 0;

    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      targetY = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    };

    const animate = () => {
      // Smooth lerp for buttery feel
      currentY += (targetY - currentY) * 0.18;
      setScrollY(currentY);
      raf = requestAnimationFrame(animate);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    raf = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Map 0-100 scroll progress to full document height
  const translateY = `${scrollY}vh`;

  return (
    <div className="fixed inset-x-0 top-0 z-20 pointer-events-none" style={{ transform: `translateY(${translateY})` }}>
      {/* Ambient glow that follows the scanner */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[120px] rounded-full blur-[80px]"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.12) 0%, hsl(var(--secondary) / 0.06) 40%, transparent 70%)',
        }}
      />
      {/* Main scanner line */}
      <div
        className="w-full h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, hsl(var(--primary) / 0.4) 25%, hsl(var(--secondary) / 0.6) 50%, hsl(var(--primary) / 0.4) 75%, transparent 95%)',
          boxShadow: '0 0 40px 12px hsl(var(--primary) / 0.12), 0 0 80px 24px hsl(var(--secondary) / 0.06)',
        }}
      />
      {/* Trailing reflection */}
      <div
        className="w-full h-[1px] mt-2"
        style={{
          background: 'linear-gradient(90deg, transparent 10%, hsl(var(--primary) / 0.2) 35%, hsl(var(--secondary) / 0.25) 50%, hsl(var(--primary) / 0.2) 65%, transparent 90%)',
          boxShadow: '0 0 20px 6px hsl(var(--primary) / 0.04)',
          opacity: 0.6,
        }}
      />
    </div>
  );
}

/* ── Glowing orbs (CSS-only pulse for performance) ── */
function GlowOrbs() {
  return (
    <>
      <div
        className="absolute top-1/4 left-[16%] w-[500px] h-[500px] rounded-full blur-[150px]"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.12), transparent 70%)',
          animation: 'orb-pulse 12s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-1/4 right-[16%] w-[400px] h-[400px] rounded-full blur-[130px]"
        style={{
          background: 'radial-gradient(circle, hsl(var(--secondary) / 0.1), transparent 70%)',
          animation: 'orb-pulse 15s ease-in-out 3s infinite',
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[180px]"
        style={{
          background: 'radial-gradient(circle, hsl(var(--solar) / 0.06), transparent 70%)',
          animation: 'orb-pulse 20s ease-in-out 6s infinite',
        }}
      />
      <div
        className="absolute top-[10%] right-[20%] w-[250px] h-[250px] rounded-full blur-[100px]"
        style={{
          background: 'radial-gradient(circle, hsl(var(--token) / 0.08), transparent 70%)',
          animation: 'orb-pulse 9s ease-in-out 1.5s infinite',
        }}
      />
    </>
  );
}

/* ── Floating energy icons with glow ── */
const floatingIcons = [
  { Icon: Sun, delay: 0, x: '12%', y: '18%', color: 'text-solar/20' },
  { Icon: Zap, delay: 0.5, x: '82%', y: '12%', color: 'text-token/20' },
  { Icon: BatteryFull, delay: 1, x: '8%', y: '78%', color: 'text-secondary/20' },
  { Icon: Car, delay: 1.5, x: '88%', y: '72%', color: 'text-energy/20' },
  { Icon: Hexagon, delay: 2, x: '50%', y: '8%', color: 'text-primary/10' },
  { Icon: Shield, delay: 2.5, x: '20%', y: '50%', color: 'text-primary/10' },
];

const bulletItems = [
  { Icon: Sun, iconColor: 'text-solar', text: 'Every kWh your solar panels produce' },
  { Icon: BatteryFull, iconColor: 'text-secondary', text: 'Every kWh your battery storage exports' },
  { Icon: Car, iconColor: 'text-energy', text: 'Every EV mile you drive' },
  { Icon: Zap, iconColor: 'text-token', text: 'Every kWh used to charge your EV' },
  { Icon: Navigation, iconColor: 'text-primary', text: 'Every autonomous mile driven' },
];

/* ── Bullet list that highlights as the scanner sweeps past ── */
function ScannerHighlightList() {
  const [activeIdx, setActiveIdx] = useState(-1);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    let raf: number;

    const tick = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      const scannerY = scrollProgress * window.innerHeight;

      let closest = -1;
      let closestDist = 60;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const dist = Math.abs(mid - scannerY);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      });

      setActiveIdx(closest);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <ul className="space-y-1 text-left inline-block text-base md:text-lg">
      {bulletItems.map(({ Icon, iconColor, text }, idx) => (
        <motion.li
          key={idx}
          ref={(el) => { itemRefs.current[idx] = el; }}
          className="flex items-center gap-3 group"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 + idx * 0.1, duration: 0.5 }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className={`h-5 w-5 ${iconColor} transition-all duration-300 ${activeIdx === idx ? 'scale-110 drop-shadow-[0_0_6px_currentColor]' : ''}`} />
          </div>
          <span
            className={`transition-all duration-300 ${
              activeIdx === idx
                ? 'text-foreground drop-shadow-[0_0_8px_hsl(var(--primary)/0.3)]'
                : 'group-hover:text-foreground'
            }`}
          >
            {text}
          </span>
        </motion.li>
      ))}
    </ul>
  );
}

/* ── Typing cursor for tagline ── */
function BlinkingCursor() {
  return (
    <motion.span
      className="inline-block w-[2px] h-4 bg-primary ml-1 align-middle"
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
    />
  );
}

export default function ComingSoon() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('beta_signups')
      .insert({ name: name.trim(), email: email.trim().toLowerCase() });

    setLoading(false);

    if (error) {
      if (error.code === '23505') {
        toast.info("You're already on the list! We'll be in touch soon.");
        setSubmitted(true);
      } else {
        toast.error('Something went wrong. Please try again.');
      }
      return;
    }

    setSubmitted(true);
    toast.success("You're in! We'll reach out when your spot is ready.");
  };

  return (
    <>
      <SEO
        title="Coming Soon — ZenSolar | Tokenizing Clean Energy"
        description="The tokenization supercycle is here. ZenSolar tokenizes your solar production, battery storage, and EV driving into $ZSOLAR tokens at the kilowatt-hour level."
        url="https://zensolar.com"
        image="https://zensolar.com/og-image.png"
      />
      <div className="relative min-h-screen overflow-x-hidden bg-background">
        {/* Layered backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
        <HexGrid />
        <GlowOrbs />
        <ParticleField />
        <ScannerLine />

        {/* Floating energy icons */}
        {floatingIcons.map(({ Icon, delay, x, y, color }, i) => (
          <motion.div
            key={i}
            className={`absolute ${color} will-change-transform`}
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, y: [0, -15, 0] }}
            transition={{
              opacity: { delay: delay + 0.5, duration: 0.8 },
              scale: { delay: delay + 0.5, duration: 0.8 },
              y: { delay: delay + 1.3, duration: 5 + i, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <Icon className="w-8 h-8 md:w-12 md:h-12" strokeWidth={1} />
          </motion.div>
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center px-6 pt-[calc(env(safe-area-inset-top)+3rem)] pb-8 text-center">
          {/* Logo */}
          <motion.div
            className="relative mb-6 flex items-center justify-center w-full"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="absolute inset-0 blur-2xl bg-primary/10 rounded-full scale-150" />
            <img
              src="/logos/zen-stacked.png"
              alt="ZenSolar"
              className="relative w-auto h-24 md:h-28 object-contain drop-shadow-[0_0_30px_hsl(var(--primary)/0.3)]"
            />
          </motion.div>

          {/* Heading */}
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Tokenizing{' '}
            <motion.span
              className="bg-gradient-to-r from-primary via-secondary to-solar bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              style={{ backgroundSize: '200% 200%' }}
            >
              clean energy
            </motion.span>{' '}
            is coming…
          </motion.h1>

          {/* Value prop */}
          <motion.div
            className="text-lg md:text-xl text-muted-foreground max-w-xl mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <p className="mb-0">
              ZenSolar tokenizes your clean energy into{' '}
              <span className="text-primary font-semibold">$ZSOLAR tokens</span> and{' '}
              <span className="text-primary font-semibold">NFTs</span> at the kilowatt-hour level:
            </p>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-3 my-2.5">
              <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-primary/30" />
              <Hexagon className="w-3 h-3 text-primary/40" />
              <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-primary/30" />
            </div>

            <ScannerHighlightList />
          </motion.div>

          {/* Divider between KPIs and pill */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-secondary/25" />
            <Shield className="w-3 h-3 text-secondary/30" />
            <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-secondary/25" />
          </div>

          {/* Digital income pill */}
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
          >
            <div className="relative inline-flex items-center rounded-full backdrop-blur-sm">
              {/* Animated gradient border */}
              <motion.div
                className="absolute -inset-[1px] rounded-full opacity-60"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--solar)), hsl(var(--token)), hsl(var(--primary)))',
                  backgroundSize: '400% 400%',
                }}
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />
              <div className="relative flex items-center gap-2.5 px-5 py-2 rounded-full bg-card/95">
                <Hexagon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="text-xs md:text-sm font-medium text-foreground/90 whitespace-nowrap tracking-wide">
                  Your clean energy, now your digital income
                </span>
                <Shield className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
              </div>
            </div>
          </motion.div>

          {/* Connects With logos */}
          <motion.div
            className="w-full max-w-2xl mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
          >
            <p className="text-xs text-muted-foreground/50 uppercase tracking-[0.2em] font-mono mb-3">Connects with</p>
            <div className="relative overflow-hidden rounded-2xl py-6 px-6 border border-border/20 bg-gradient-to-br from-primary/[0.06] via-card/50 to-solar/[0.04] backdrop-blur-sm">
              {/* Ambient glow spots */}
              <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-32 h-32 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
              <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-32 h-32 bg-solar/10 rounded-full blur-[60px] pointer-events-none" />
              {/* Subtle shimmer sweep */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -skew-x-12 pointer-events-none"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
              />
              <div className="relative grid grid-cols-2 gap-y-6 gap-x-6 place-items-center">
                {[
                  { src: teslaLogo, alt: 'Tesla', cls: 'max-h-20 md:max-h-32' },
                  { src: enphaseLogo, alt: 'Enphase', cls: 'max-h-10 md:max-h-14' },
                  { src: solarEdgeLogo, alt: 'SolarEdge', cls: 'max-h-12 md:max-h-16' },
                  { src: wallboxLogo, alt: 'Wallbox', cls: 'max-h-10 md:max-h-14' },
                ].map(({ src, alt, cls }, idx) => (
                  <motion.img
                    key={alt}
                    src={src}
                    alt={alt}
                    className={`${cls} w-auto object-contain opacity-60 hover:opacity-100 transition-all duration-500`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 0.6, y: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground/40 uppercase tracking-[0.15em] font-mono mt-3">More partners coming soon…</p>
          </motion.div>
          {/* VPP / Texas Grid differentiator */}
          <motion.div
            className="w-full max-w-lg mb-6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-energy/30 bg-gradient-to-br from-energy/[0.08] via-card/60 to-primary/[0.06] backdrop-blur-sm p-5">
              <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-40 h-40 bg-energy/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-energy to-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-energy/30">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground text-base tracking-tight">Virtual Power Plant Ready</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Manufacturer-agnostic grid demand response. Tesla, Enphase, SolarEdge, and more.
                    <span className="text-primary font-semibold"> Nationwide coverage</span>. Not limited to a single grid operator.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {[
                  { label: 'ERCOT · CAISO · PJM · All ISOs', color: 'energy' },
                  { label: 'Patent Pending · Est. Q1 2025', color: 'primary' },
                  { label: 'Hardware Agnostic', color: 'secondary' },
                ].map(({ label, color }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-${color}/10 border border-${color}/20`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full bg-${color} animate-pulse`} />
                    <span className="text-[10px] font-medium text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Mint-on-Proof — holographic card */}
          <motion.div
            className="relative w-full max-w-md mb-8"
            initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {/* Animated gradient border */}
            <motion.div
              className="absolute -inset-[1px] rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--solar)), hsl(var(--token)), hsl(var(--primary)))',
                backgroundSize: '400% 400%',
              }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
            {/* Card content */}
            <div className="relative rounded-2xl bg-card/95 backdrop-blur-xl px-6 py-6">
              {/* Top row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <motion.div
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-secondary to-solar flex items-center justify-center shadow-xl shadow-primary/30"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    >
                      <Shield className="w-6 h-6 text-primary-foreground" />
                    </motion.div>
                    <motion.div
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-secondary ring-2 ring-card"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-foreground text-lg tracking-tight">Mint-on-Proof™</p>
                    <p className="text-xs text-muted-foreground">Patent-pending technology</p>
                  </div>
                </div>
                <motion.div
                  className="px-3 py-1 rounded-full bg-secondary/15 border border-secondary/30"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-xs font-mono font-semibold text-secondary">ACTIVE</span>
                </motion.div>
              </div>

              {/* Divider with glow */}
              <div className="h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-4" />

              {/* Feature pills */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  { label: 'Verified on-chain', color: 'primary' },
                  { label: 'Base Blockchain L2', color: 'secondary' },
                  { label: 'One-tap minting', color: 'token' },
                  { label: 'Anti-gaming', color: 'solar' },
                ].map(({ label, color }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-${color}/10 border border-${color}/20`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full bg-${color} animate-pulse`} />
                    <span className="text-xs font-medium text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Beta signup form — glassmorphism */}
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-secondary/30 bg-card/60 backdrop-blur-xl"
                >
                  <motion.div
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center shadow-xl shadow-secondary/30"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    <Check className="w-8 h-8 text-secondary-foreground" />
                  </motion.div>
                  <p className="font-bold text-lg text-foreground">You're on the list!</p>
                  <p className="text-sm text-muted-foreground">We'll reach out when your spot is ready.</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4 p-6 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl shadow-2xl shadow-primary/5"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Hexagon className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Request early access</p>
                  </div>
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-background/40 border-border/40 focus:border-primary/50 focus:ring-primary/20 transition-all"
                  />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/40 border-border/40 focus:border-primary/50 focus:ring-primary/20 transition-all"
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 bg-gradient-to-r from-primary via-primary to-secondary hover:opacity-90 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    {loading ? 'Submitting...' : 'Join the Beta'}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Bottom tagline */}
          <motion.p
            className="mt-10 mb-6 text-xs text-muted-foreground/50 tracking-[0.3em] uppercase font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            Clean energy. Tokenized. On-chain forever.
            <BlinkingCursor />
          </motion.p>
        </div>

        {/* Footer — crawlable links for SEO */}
        <footer className="relative z-10 w-full border-t border-border/20 bg-card/30 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <img src="/logos/zen-stacked.png" alt="ZenSolar" className="h-6 w-auto opacity-60" />
                <span className="text-xs text-muted-foreground/50">© {new Date().getFullYear()} ZenSolar</span>
              </div>
              <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                <a href="/blog" className="text-xs text-muted-foreground/60 hover:text-primary transition-colors">Blog</a>
                <a href="/how-it-works" className="text-xs text-muted-foreground/60 hover:text-primary transition-colors">How It Works</a>
                <a href="/technology" className="text-xs text-muted-foreground/60 hover:text-primary transition-colors">Technology</a>
                <a href="/tokenomics" className="text-xs text-muted-foreground/60 hover:text-primary transition-colors">Tokenomics</a>
                <a href="/privacy" className="text-xs text-muted-foreground/60 hover:text-primary transition-colors">Privacy</a>
                <a href="/terms" className="text-xs text-muted-foreground/60 hover:text-primary transition-colors">Terms</a>
              </nav>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
