import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowRight, Zap, Sun, Car, Copy, Check, ExternalLink, Shield, Github } from 'lucide-react';
import heroBg from '@/assets/hero-solar-cinematic.jpg';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

// Community wall photos
import solarRoof1 from '@/assets/community/solar-roof-1.jpg';
import solarRoof2 from '@/assets/community/solar-roof-2.jpg';
import evCharging1 from '@/assets/community/ev-charging-1.jpg';
import dashboard1 from '@/assets/community/dashboard-1.jpg';
import battery1 from '@/assets/community/battery-1.jpg';
import owner1 from '@/assets/community/owner-1.jpg';

// ─── Token rates (mirroring tokenomics: 0.1 ZSOLAR/kWh mainnet, 0.75 user cut) ───
const ZSOLAR_PER_KWH = 0.1;
const ZSOLAR_PER_EV_MILE = 0.04; // ~0.4 kWh/mile * 0.1
const ZSOLAR_USD_PRICE = 0.10; // floor price
const USER_SHARE = 0.75; // 75% after burn

// ─── Earnings Calculator ─────────────────────────────────────────────────────
function EarningsCalculator() {
  const [solarKwh, setSolarKwh] = useState(500);
  const [evMiles, setEvMiles] = useState(800);

  const solarTokens = solarKwh * ZSOLAR_PER_KWH * USER_SHARE;
  const evTokens = evMiles * ZSOLAR_PER_EV_MILE * USER_SHARE;
  const totalTokens = solarTokens + evTokens;
  const totalUsd = totalTokens * ZSOLAR_USD_PRICE;

  return (
    <section className="bg-black py-28 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-semibold tracking-[0.22em] uppercase text-white/30 mb-3">Personalized Estimate</p>
          <h2 className="text-white text-4xl md:text-5xl font-black tracking-tight leading-none mb-4">
            What would{' '}
            <span style={{
              background: 'linear-gradient(90deg, hsl(var(--solar)), hsl(var(--primary)))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              YOU
            </span>
            {' '}earn?
          </h2>
          <p className="text-white/40 max-w-md mx-auto">Slide to match your setup. See your estimated monthly $ZSOLAR rewards instantly.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="grid md:grid-cols-2 gap-8 items-start"
        >
          {/* Sliders */}
          <div className="space-y-10 bg-white/[0.04] border border-white/10 rounded-3xl p-8">
            {/* Solar slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-yellow-400" />
                  <span className="text-white/70 text-sm font-medium">Solar Production</span>
                </div>
                <span className="text-white font-bold tabular-nums">{solarKwh.toLocaleString()} kWh/mo</span>
              </div>
              <Slider
                min={0}
                max={2000}
                step={50}
                value={[solarKwh]}
                onValueChange={([v]) => setSolarKwh(v)}
                className="[&_[role=slider]]:bg-yellow-400 [&_[role=slider]]:border-yellow-400 [&_.bg-primary]:bg-yellow-400"
              />
              <div className="flex justify-between text-white/20 text-xs">
                <span>0</span><span>Average: 500</span><span>2,000 kWh</span>
              </div>
            </div>

            {/* EV slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-blue-400" />
                  <span className="text-white/70 text-sm font-medium">EV Miles Driven</span>
                </div>
                <span className="text-white font-bold tabular-nums">{evMiles.toLocaleString()} mi/mo</span>
              </div>
              <Slider
                min={0}
                max={3000}
                step={50}
                value={[evMiles]}
                onValueChange={([v]) => setEvMiles(v)}
                className="[&_[role=slider]]:bg-blue-400 [&_[role=slider]]:border-blue-400 [&_.bg-primary]:bg-blue-400"
              />
              <div className="flex justify-between text-white/20 text-xs">
                <span>0</span><span>Average: 800</span><span>3,000 mi</span>
              </div>
            </div>

            <p className="text-white/20 text-xs pt-2 border-t border-white/5">
              Based on mainnet rates: {ZSOLAR_PER_KWH} $ZSOLAR/kWh · {ZSOLAR_PER_EV_MILE} $ZSOLAR/mi. After 25% protocol burn. Price floor: ${ZSOLAR_USD_PRICE}/token.
            </p>
          </div>

          {/* Results panel */}
          <div className="flex flex-col gap-4">
            {/* Big result */}
            <div
              className="rounded-3xl p-8 flex flex-col gap-2 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, hsl(var(--solar)/0.15) 0%, hsl(var(--primary)/0.15) 100%)', border: '1px solid hsl(var(--solar)/0.25)' }}
            >
              <div
                className="absolute inset-0 -z-10 blur-[60px] opacity-30"
                style={{ background: 'radial-gradient(ellipse at 60% 40%, hsl(var(--solar)) 0%, transparent 70%)' }}
              />
              <p className="text-white/40 text-xs uppercase tracking-[0.18em] font-semibold">Monthly Earnings</p>
              <div className="flex items-end gap-2 mt-1">
                <span
                  className="font-black leading-none tabular-nums"
                  style={{
                    fontSize: 'clamp(2.8rem, 7vw, 4.5rem)',
                    background: 'linear-gradient(90deg, hsl(var(--solar)), hsl(var(--primary)))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {totalTokens.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-white/50 text-lg font-semibold mb-2">$ZSOLAR</span>
              </div>
              <p className="text-white/60 text-lg font-semibold">
                ≈ <span className="text-white">${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> USD / month
              </p>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-5 bg-white/[0.04] border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sun className="h-3.5 w-3.5 text-yellow-400" />
                  <span className="text-white/40 text-xs uppercase tracking-wider">Solar</span>
                </div>
                <p className="text-white font-bold text-xl tabular-nums">{solarTokens.toFixed(0)}</p>
                <p className="text-white/30 text-xs">$ZSOLAR/mo</p>
              </div>
              <div className="rounded-2xl p-5 bg-white/[0.04] border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <Car className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-white/40 text-xs uppercase tracking-wider">EV Miles</span>
                </div>
                <p className="text-white font-bold text-xl tabular-nums">{evTokens.toFixed(0)}</p>
                <p className="text-white/30 text-xs">$ZSOLAR/mo</p>
              </div>
            </div>

            <Link to="/auth" className="block">
              <Button
                className="w-full py-6 rounded-2xl font-bold text-black"
                style={{ background: 'linear-gradient(135deg, hsl(var(--solar)), hsl(var(--primary)))' }}
              >
                <Zap className="mr-2 h-4 w-4" />
                Start Earning This Amount
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Community Wall ───────────────────────────────────────────────────────────
const communityPosts = [
  { img: solarRoof1, user: '@mike_solar', handle: 'Mike T.', location: 'San Diego, CA', caption: 'First month done. 487 kWh produced. Just minted my Genesis NFT!', tokens: '36.5', likes: 142, tag: 'Solar' },
  { img: evCharging1, user: '@tesla_daily', handle: 'Sarah K.', location: 'Austin, TX', caption: 'Charging my Model 3 every night and watching the tokens add up. This is wild.', tokens: '24.0', likes: 98, tag: 'EV' },
  { img: solarRoof2, user: '@clean_energy_fam', handle: 'James R.', location: 'Phoenix, AZ', caption: 'Installed 22 panels last spring. Never looked back. 920 kWh this month!', tokens: '69.0', likes: 211, tag: 'Solar' },
  { img: dashboard1, user: '@crypto_solar', handle: 'Priya M.', location: 'Los Angeles, CA', caption: 'Dashboard showing 1,200 $ZSOLAR earned since beta launch. Unreal!', tokens: '1,200', likes: 387, tag: 'Dashboard' },
  { img: battery1, user: '@powerwall_pro', handle: 'Dave L.', location: 'Seattle, WA', caption: 'Powerwall + ZenSolar = passive income while I sleep. Battery exports earning too.', tokens: '18.2', likes: 76, tag: 'Battery' },
  { img: owner1, user: '@green_income', handle: 'Tom B.', location: 'Denver, CO', caption: '3 years of solar + 1 month of ZenSolar. Wish I found this sooner.', tokens: '52.1', likes: 163, tag: 'Solar' },
];

const tagColors: Record<string, string> = {
  Solar: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  EV: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Dashboard: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Battery: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

function CommunityWall() {
  return (
    <section className="bg-[#050505] py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-semibold tracking-[0.22em] uppercase text-white/30 mb-3">Real Users. Real Earnings.</p>
          <h2 className="text-white text-4xl md:text-5xl font-black tracking-tight leading-none mb-4">
            #ZenSolarLife
          </h2>
          <p className="text-white/40 max-w-md mx-auto">Join 1,240+ beta users already converting clean energy into digital income.</p>
        </motion.div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {communityPosts.map((post, i) => (
            <motion.div
              key={post.user}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="break-inside-avoid rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] hover:border-white/20 transition-all group"
            >
              <div className="relative overflow-hidden">
                <img
                  src={post.img}
                  alt={post.caption}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  style={{ aspectRatio: '1/1' }}
                />
                {/* Token badge overlay */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                  <Zap className="h-3 w-3 text-yellow-400" />
                  <span className="text-white text-xs font-bold">{post.tokens}</span>
                </div>
                {/* Tag */}
                <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold border ${tagColors[post.tag]}`}>
                  {post.tag}
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-semibold">{post.handle}</p>
                    <p className="text-white/30 text-xs">{post.location}</p>
                  </div>
                  <div className="flex items-center gap-1 text-white/30 text-xs">
                    <span>❤️</span>
                    <span>{post.likes}</span>
                  </div>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">{post.caption}</p>
                <p className="text-white/25 text-xs font-mono">{post.user}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Link to="/auth">
            <Button
              size="lg"
              className="rounded-full px-10 py-6 font-bold text-black"
              style={{ background: 'linear-gradient(135deg, hsl(var(--solar)), hsl(var(--primary)))' }}
            >
              Join the Community
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Token Info Card ──────────────────────────────────────────────────────────
const CONTRACT_ADDRESS = '0x000...ZSOLAR'; // placeholder

function TokenInfoCard() {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rows = [
    { label: 'Token Name', value: 'ZenSolar Token' },
    { label: 'Ticker', value: '$ZSOLAR' },
    { label: 'Network', value: 'Base L2 (Ethereum)' },
    { label: 'Token Standard', value: 'ERC-20' },
    { label: 'Total Supply', value: '10,000,000,000' },
    { label: 'Mint Burn Rate', value: '20% per mint' },
    { label: 'Transfer Tax', value: '7% (3% burn / 2% LP / 2% treasury)' },
    { label: 'Floor Price', value: '$0.10 USD (LP-backed)' },
  ];

  return (
    <section className="bg-black py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-semibold tracking-[0.22em] uppercase text-white/30 mb-3">On-Chain Transparency</p>
          <h2 className="text-white text-4xl md:text-5xl font-black tracking-tight leading-none">
            $ZSOLAR Token
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="rounded-3xl overflow-hidden border border-white/10"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)' }}
        >
          {/* Card header */}
          <div
            className="px-8 py-6 border-b border-white/10 flex items-center gap-4"
            style={{ background: 'linear-gradient(90deg, hsl(var(--solar)/0.12), hsl(var(--primary)/0.12))' }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-black text-sm"
              style={{ background: 'linear-gradient(135deg, hsl(var(--solar)), hsl(var(--primary)))' }}
            >
              Z
            </div>
            <div>
              <p className="text-white font-bold text-lg">$ZSOLAR</p>
              <p className="text-white/40 text-sm">ZenSolar Utility Token</p>
            </div>
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-semibold">Live Beta</span>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/5">
            {rows.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-8 py-4">
                <span className="text-white/40 text-sm">{label}</span>
                <span className="text-white text-sm font-semibold text-right max-w-[55%]">{value}</span>
              </div>
            ))}

            {/* Contract address row */}
            <div className="flex items-center justify-between px-8 py-4">
              <span className="text-white/40 text-sm">Contract Address</span>
              <button
                onClick={copyAddress}
                className="flex items-center gap-2 text-white/60 hover:text-white text-sm font-mono transition-colors group"
              >
                <span>{CONTRACT_ADDRESS}</span>
                {copied
                  ? <Check className="h-3.5 w-3.5 text-emerald-400" />
                  : <Copy className="h-3.5 w-3.5 opacity-40 group-hover:opacity-80" />
                }
              </button>
            </div>
          </div>

          {/* Card footer — links */}
          <div className="px-8 py-6 border-t border-white/10 flex flex-wrap gap-3">
            <a
              href="#"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white text-sm font-medium transition-all"
            >
              <Shield className="h-4 w-4 text-emerald-400" />
              Security Audit
              <ExternalLink className="h-3 w-3 opacity-40" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white text-sm font-medium transition-all"
            >
              <Github className="h-4 w-4" />
              GitHub
              <ExternalLink className="h-3 w-3 opacity-40" />
            </a>
            <a
              href="#"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white text-sm font-medium transition-all"
            >
              <ExternalLink className="h-4 w-4 text-blue-400" />
              BaseScan Explorer
            </a>
            <Link
              to="/white-paper"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white text-sm font-medium transition-all"
            >
              White Paper
            </Link>
          </div>
        </motion.div>

        {/* Tokenomics pill summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6"
        >
          {[
            { label: 'You Receive', value: '75%', sub: 'of minted tokens' },
            { label: 'Burn Rate', value: '20%', sub: 'deflationary' },
            { label: 'LP Seed', value: '50K', sub: '$ZSOLAR stabilizer' },
            { label: 'Total Supply', value: '10B', sub: 'hard cap' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-2xl p-4 bg-white/[0.04] border border-white/10 text-center space-y-1">
              <p className="text-white/30 text-xs uppercase tracking-wider">{label}</p>
              <p
                className="font-black text-2xl leading-none"
                style={{
                  background: 'linear-gradient(90deg, hsl(var(--solar)), hsl(var(--primary)))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {value}
              </p>
              <p className="text-white/25 text-xs">{sub}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
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
        <motion.div className="absolute inset-0 -z-10" style={{ y: bgY }}>
          <img src={heroBg} alt="" aria-hidden className="w-full h-[115%] object-cover object-center" fetchPriority="high" />
        </motion.div>
        <motion.div
          className="absolute inset-0 -z-[9]"
          style={{ opacity: overlayOpacity, background: 'linear-gradient(to top, #000 0%, #000c 40%, #0007 70%, transparent 100%)' }}
        />
        <div className="absolute inset-0 -z-[8] bg-gradient-to-b from-black/60 via-transparent to-transparent" />

        <motion.div
          style={{ y: contentY }}
          className="relative z-10 flex flex-col items-center text-center px-5 max-w-5xl mx-auto gap-8 pt-16"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-[0.18em] uppercase text-white/70">Now Live on Base Blockchain</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="absolute inset-0 -z-10 blur-[80px] opacity-50 rounded-full" style={{ background: 'radial-gradient(ellipse, hsl(var(--solar)) 0%, hsl(var(--primary)) 40%, transparent 70%)' }} />
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

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.35 }}
            className="text-white font-bold leading-[1.1] tracking-tight"
            style={{ fontSize: 'clamp(1.6rem, 4.5vw, 3rem)' }}
          >
            Your sun generates power.
            <br />
            <span style={{ background: 'linear-gradient(90deg, hsl(var(--solar)), hsl(var(--primary)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Now it generates income.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="text-white/55 max-w-lg leading-relaxed"
            style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)' }}
          >
            Every kWh you produce, every EV mile you drive — automatically minted as $ZSOLAR tokens and NFTs. No crypto experience needed.
          </motion.p>

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
              <Button size="lg" variant="outline" className="px-9 py-6 text-[1rem] font-semibold rounded-full border-white/25 text-white bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/40 transition-all">
                Try Demo
              </Button>
            </Link>
          </motion.div>

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

      {/* Earnings Calculator */}
      <EarningsCalculator />

      {/* Community Wall */}
      <CommunityWall />

      {/* Token Info Card */}
      <TokenInfoCard />

      {/* Final CTA */}
      <section className="bg-black py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-white text-3xl md:text-4xl font-bold tracking-tight">
            Clean energy has always had value.
            <br />
            <span className="text-white/40">We just made it spendable.</span>
          </h2>
          <Link to="/auth">
            <Button size="lg" className="mt-4 rounded-full px-10 py-6 font-bold text-black" style={{ background: 'linear-gradient(135deg, hsl(var(--solar)), hsl(var(--primary)))' }}>
              Claim Your First Tokens
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Dev note */}
      <div className="bg-yellow-500/10 border-t border-yellow-500/20 py-3 px-6 text-center">
        <p className="text-yellow-400/80 text-xs font-mono">
          TEST PAGE — /hero-test — Compare with current hero at{' '}
          <Link to="/" className="underline hover:text-yellow-300">/ (Landing)</Link>
        </p>
      </div>
    </div>
  );
}
