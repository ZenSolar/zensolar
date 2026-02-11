import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Zap, Battery, Car, Check, Loader2 } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const floatingIcons = [
  { Icon: Sun, delay: 0, x: '15%', y: '20%' },
  { Icon: Zap, delay: 0.5, x: '80%', y: '15%' },
  { Icon: Battery, delay: 1, x: '10%', y: '75%' },
  { Icon: Car, delay: 1.5, x: '85%', y: '70%' },
];

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
        description="ZenSolar is launching soon. Earn $ZSOLAR tokens for every kWh your solar panels produce, every battery discharge, every EV charge, and every mile you drive."
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
          {/* Logo — use object-contain to prevent distortion */}
          <motion.img
            src="/logos/zen-stacked.png"
            alt="ZenSolar"
            className="w-auto h-24 md:h-32 mb-8 object-contain drop-shadow-lg"
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
            Turn Clean Energy Into{' '}
            <span className="bg-gradient-to-r from-secondary via-energy to-primary bg-clip-text text-transparent">
              Digital Income
            </span>
          </motion.h1>

          {/* Value prop — mirrors landing hero */}
          <motion.div
            className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <p className="mb-4">
              ZenSolar rewards solar users and EV drivers with{' '}
              <span className="text-primary font-semibold">$ZSOLAR tokens</span> and{' '}
              <span className="text-primary font-semibold">NFTs</span> for:
            </p>
            <ul className="space-y-2 text-left inline-block text-base md:text-lg">
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
          </motion.div>

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

          {/* Beta signup form */}
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {submitted ? (
              <div className="flex flex-col items-center gap-3 p-6 rounded-xl border border-secondary/30 bg-card/60 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-secondary" />
                </div>
                <p className="font-semibold text-foreground">You're on the list!</p>
                <p className="text-sm text-muted-foreground">We'll reach out when your spot is ready.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-6 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
                <p className="text-sm font-medium text-foreground mb-1">Request early access</p>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-background/60"
                />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/60"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  {loading ? 'Submitting...' : 'Join the Beta'}
                </Button>
              </form>
            )}
          </motion.div>

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
