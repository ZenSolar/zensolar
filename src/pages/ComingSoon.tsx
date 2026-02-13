import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Zap, BatteryFull, Car, Check, Loader2, Shield, Hexagon } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import teslaLogo from '@/assets/logos/tesla-wordmark.png';
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import solarEdgeLogo from '@/assets/logos/solaredge-wordmark.svg';
import wallboxLogo from '@/assets/logos/wallbox-logo.png';

/* ── Animated particle field ── */
function ParticleField() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
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
          className="absolute rounded-full bg-primary/20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -60, 0],
            x: [0, Math.random() * 30 - 15, 0],
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
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.08]">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexagons" width="56" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
            <path
              d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="0.5"
            />
            <path
              d="M28 0L56 16L56 50L28 66L0 50L0 16"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexagons)" />
      </svg>
    </div>
  );
}

/* ── Scanner line ── */
function ScannerLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-[2px] pointer-events-none z-20"
      style={{
        background: 'linear-gradient(90deg, transparent 5%, hsl(var(--primary) / 0.3) 30%, hsl(var(--secondary) / 0.35) 50%, hsl(var(--primary) / 0.3) 70%, transparent 95%)',
        boxShadow: '0 0 30px 8px hsl(var(--primary) / 0.08), 0 0 60px 16px hsl(var(--secondary) / 0.04)',
      }}
      animate={{ top: ['0%', '100%', '0%'] }}
      transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

/* ── Glowing orbs ── */
function GlowOrbs() {
  return (
    <>
      <motion.div
        className="absolute top-1/4 left-1/6 w-[500px] h-[500px] rounded-full blur-[150px]"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.12), transparent 70%)' }}
        animate={{ scale: [1, 1.3, 1], x: [0, 60, 0], y: [0, -40, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/6 w-[400px] h-[400px] rounded-full blur-[130px]"
        style={{ background: 'radial-gradient(circle, hsl(var(--secondary) / 0.1), transparent 70%)' }}
        animate={{ scale: [1.2, 0.9, 1.2], x: [0, -50, 0], y: [0, 50, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[180px]"
        style={{ background: 'radial-gradient(circle, hsl(var(--solar) / 0.06), transparent 70%)' }}
        animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute top-[10%] right-[20%] w-[250px] h-[250px] rounded-full blur-[100px]"
        style={{ background: 'radial-gradient(circle, hsl(var(--token) / 0.08), transparent 70%)' }}
        animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
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
        title="Coming Soon — ZenSolar"
        description="ZenSolar is launching soon. Earn $ZSOLAR tokens for every kWh your solar panels produce, every battery storage export, every EV charge, and every mile you drive."
        url="https://zensolar.com"
        image="https://zensolar.com/og-image.png"
      />
      <div className="relative min-h-screen overflow-hidden bg-background">
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
            className={`absolute ${color}`}
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
            transition={{
              opacity: { delay: delay + 0.5, duration: 0.8 },
              scale: { delay: delay + 0.5, duration: 0.8 },
              y: { delay: delay + 1.3, duration: 5 + i, repeat: Infinity, ease: 'easeInOut' },
              rotate: { delay: delay + 1.3, duration: 8, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <Icon className="w-8 h-8 md:w-12 md:h-12" strokeWidth={1} />
          </motion.div>
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
          {/* Logo */}
          <motion.div
            className="relative mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="absolute inset-0 blur-2xl bg-primary/10 rounded-full scale-150" />
            <img
              src="/logos/zen-stacked.png"
              alt="ZenSolar"
              className="relative w-auto h-20 md:h-28 object-contain drop-shadow-[0_0_30px_hsl(var(--primary)/0.3)]"
            />
          </motion.div>

          {/* Heading */}
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Something{' '}
            <motion.span
              className="bg-gradient-to-r from-primary via-secondary to-solar bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              style={{ backgroundSize: '200% 200%' }}
            >
              powerful
            </motion.span>{' '}
            is coming…
          </motion.h1>

          {/* Value prop — mirrors landing hero copy */}
          <motion.div
            className="text-lg md:text-xl text-muted-foreground max-w-xl mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <p className="mb-1">
              ZenSolar rewards solar users and EV drivers with{' '}
              <span className="text-primary font-semibold">$ZSOLAR tokens</span> and{' '}
              <span className="text-primary font-semibold">NFTs</span> for:
            </p>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-3 my-3">
              <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-primary/30" />
              <Hexagon className="w-3 h-3 text-primary/40" />
              <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-primary/30" />
            </div>

            <ul className="space-y-1 text-left inline-block text-base md:text-lg">
              {[
                { Icon: Sun, iconColor: 'text-solar', text: 'Every kWh your solar panels produce' },
                { Icon: BatteryFull, iconColor: 'text-secondary', text: 'Every kWh your battery storage exports' },
                { Icon: Car, iconColor: 'text-energy', text: 'Every EV mile you drive' },
                { Icon: Zap, iconColor: 'text-token', text: 'Every kWh used to charge your EV' },
              ].map(({ Icon, iconColor, text }, idx) => (
                <motion.li
                  key={idx}
                  className="flex items-center gap-3 group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1, duration: 0.5 }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <span className="group-hover:text-foreground transition-colors">{text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Divider between KPIs and pill */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-secondary/25" />
            <Shield className="w-3 h-3 text-secondary/30" />
            <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-secondary/25" />
          </div>

          {/* Digital income pill */}
          <motion.div
            className="mb-6"
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
            className="w-full max-w-md mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
          >
            <p className="text-xs text-muted-foreground/50 uppercase tracking-[0.2em] font-mono mb-5">Connects with</p>
            <div className="flex items-center justify-center gap-6">
              {[
                { src: teslaLogo, alt: 'Tesla', h: 'h-9 md:h-11' },
                { src: enphaseLogo, alt: 'Enphase', h: 'h-6 md:h-7' },
                { src: solarEdgeLogo, alt: 'SolarEdge', h: 'h-12 md:h-16' },
                { src: wallboxLogo, alt: 'Wallbox', h: 'h-6 md:h-7' },
              ].map(({ src, alt, h }, idx) => (
                <motion.img
                  key={alt}
                  src={src}
                  alt={alt}
                  className={`${h} w-auto object-contain opacity-60 hover:opacity-100 transition-all duration-300`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.6, y: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1, duration: 0.5 }}
                />
              ))}
            </div>
          </motion.div>
          {/* Mint-on-Proof — holographic card */}
          <motion.div
            className="relative w-full max-w-md mb-12"
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
            className="mt-16 text-xs text-muted-foreground/50 tracking-[0.3em] uppercase font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            Clean energy. Real rewards. On-chain proof.
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
